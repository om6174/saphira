#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use deepgram::speak::options::Options;
use deepgram::{
    speak::options::{Container, Encoding, Model},
    Deepgram,
};
use dotenv::dotenv;
use futures::stream::StreamExt;
use serde::{Deserialize, Serialize};
use serde_json;
use sha2::{Digest, Sha256}; // For hashing dialogue strings
use std::env;
use std::fs;
use std::fs::File;
use std::io::Read;
use std::path::Path as StdPath;
use std::time::{Duration};
use tauri::command;
use winapi::shared::windef::HWND;
use winapi::um::winuser::{
    EnumWindows, GetWindowTextA, SetForegroundWindow, ShowWindow, AllowSetForegroundWindow, SW_SHOWMAXIMIZED
};

mod db;
mod settings;

use db::{create_settings_table, establish_connection};
use rusqlite::Connection;
use settings::{get_settings, set_settings, UserSettings};
use std::sync::Mutex;
use tauri::Manager;
use tauri::{path::BaseDirectory};
use winapi::um::winuser::SW_SHOW;
use winapi::um::shellapi::ShellExecuteW;
use std::ptr;
use std::ffi::OsStr;
use std::os::windows::ffi::OsStrExt;
use std::path::Path;

#[derive(Deserialize, Serialize, Debug)]
struct ProjectConfig {
    shortcut: String,
    folder_path: String,
    project_path: String,
    project_name: String,
}


fn open_with_shell(exe_path: &str, project_path: &str) -> Result<(), String> {
    println!("Opening: {} {}", exe_path, project_path);
    let start_cmd = &format!("{}", exe_path);

    let wide_exe_path: Vec<u16> = OsStr::new(start_cmd)
        .encode_wide()
        .chain(Some(0))
        .collect();

    let wide_project_path: Vec<u16> = OsStr::new(project_path)
        .encode_wide()
        .chain(Some(0))
        .collect();

    let result = unsafe {
        ShellExecuteW(
            ptr::null_mut(),
            ptr::null(),
            wide_exe_path.as_ptr(),
            wide_project_path.as_ptr(),
            ptr::null(),
            SW_SHOWMAXIMIZED,
        )
    };

    if result as isize <= 32 {
        println!("Error: {}, {}", exe_path, project_path);
        return Err(format!("Failed to open '{}'", exe_path));
    }

    Ok(())
}



#[command]
fn read_project_config(app: tauri::AppHandle) -> Result<Vec<ProjectConfig>, String> {
    let file_path = match app
        .app_handle()
        .path()
        .resolve("../client_paths.json", BaseDirectory::Resource)
    {
        Ok(path) => path,
        Err(e) => return Err(format!("Error resolving path: {}", e)),
    };
    // Print the file path for debugging purposes
    println!("Attempting to open file at path: {}", file_path.display());

    // Attempt to open the file and handle the error if the file doesn't exist
    let mut file = match File::open(file_path) {
        Ok(f) => f,
        Err(e) => {
            // Print the error and return a custom error message
            println!("Error opening file: {}", e);
            return Err(format!("Error opening file: {}", e));
        }
    };

    let mut contents = String::new();
    if let Err(e) = file.read_to_string(&mut contents) {
        // Handle error reading the file
        println!("Error reading file: {}", e);
        return Err(format!("Error reading file: {}", e));
    }

    // Attempt to deserialize the JSON content into Vec<ProjectConfig>
    match serde_json::from_str(&contents) {
        Ok(configs) => Ok(configs),
        Err(e) => {
            // Print the error and return a custom error message
            println!("Error parsing JSON: {}", e);
            Err(format!("Error parsing JSON: {}", e))
        }
    }
}

// Tauri Command to generate speech
#[command]
async fn generate_speech(dialogue: String) -> Result<Vec<u8>, String> {
    let audio_dir = "audio_cache";
    fs::create_dir_all(audio_dir).map_err(|e| e.to_string())?;

    // Generate a unique hash for the dialogue
    let mut hasher = Sha256::new();
    hasher.update(dialogue.as_bytes());
    let dialogue_hash = format!("{:x}", hasher.finalize());
    let file_path = format!("{}/{}.wav", audio_dir, dialogue_hash);

    if StdPath::new(&file_path).exists() {
        println!("Serving cached audio for dialogue: {}", dialogue);
        return fs::read(&file_path).map_err(|e| e.to_string());
    }

    dotenv().ok();

    let deepgram_api_key = match env::var("DEEPGRAM_API_KEY") {
        Ok(value) => value,
        Err(_) => {
            eprintln!("DEEPGRAM_API_KEY is not set or could not be read");
            String::new()
        }
    };

    println!("Generating audio for key: {}", deepgram_api_key);
    let dg_client = Deepgram::new(&deepgram_api_key).map_err(|e| e.to_string())?;
    let options = Options::builder()
        .model(Model::AuraAthenaEn)
        .encoding(Encoding::Linear16)
        .sample_rate(16000)
        .container(Container::Wav)
        .build();

    let mut audio_stream = dg_client
        .text_to_speech()
        .speak_to_stream(&dialogue, &options)
        .await
        .map_err(|e| e.to_string())?;

    let mut audio_data = Vec::new();
    while let Some(data) = audio_stream.next().await {
        audio_data.extend_from_slice(&data);
    }

    // Save the audio data to a file
    fs::write(&file_path, &audio_data).map_err(|e| e.to_string())?;
    println!("Audio generated and cached at {}", file_path);

    Ok(audio_data)
}


fn find_window_by_partial_title(partial_title: &str) -> Result<HWND, String> {
    let mut found_hwnd: HWND = std::ptr::null_mut();
    unsafe {
        EnumWindows(
            Some(enum_window_proc),
            &mut (partial_title, &mut found_hwnd) as *mut _ as _,
        );
    }
    if !found_hwnd.is_null() {
        Ok(found_hwnd)
    } else {
        Err(format!("Window with partial title '{}' not found", partial_title))
    }
}


unsafe extern "system" fn enum_window_proc(hwnd: HWND, lparam: isize) -> i32 {
    let (partial_title, found_hwnd) = &mut *(lparam as *mut (&str, &mut HWND));
    let mut buffer = [0i8; 512]; // Buffer to hold window title
    let length = GetWindowTextA(hwnd, buffer.as_mut_ptr(), buffer.len() as i32);
    if length > 0 {
        let title = std::ffi::CStr::from_ptr(buffer.as_ptr()).to_string_lossy();
        if title.contains(*partial_title) {
            // Dereference `partial_title` here
            **found_hwnd = hwnd;
            return 0; // Stop enumeration
        }
    }
    1 // Continue enumeration
}


fn maximize_and_focus_window(hwnd: HWND) {
    unsafe {
        ShowWindow(hwnd, SW_SHOWMAXIMIZED);
        SetForegroundWindow(hwnd);
    }
}

#[command]
fn open_project(folder_path: String, project_path: String) -> Result<String, String> {
    let folder_name = Path::new(&folder_path)
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("");

    let explorer_window_title = format!("{} - File Explorer", folder_name);
    let project_name = Path::new(&project_path)
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("");

    let code_window_title = format!("{} - Visual Studio Code", project_name);

    // Check if Explorer and VS Code are already open
    let explorer_hwnd = find_window_by_partial_title(&explorer_window_title).ok();
    let code_hwnd = find_window_by_partial_title(&code_window_title).ok();

    if explorer_hwnd.is_none(){
        let _ = open_with_shell(&folder_path, "")?;
    }else {
        maximize_and_focus_window(explorer_hwnd.unwrap());
    }

    if code_hwnd.is_none(){
        let _ = open_with_shell("code", &project_path)?;
    }else {
        if !explorer_hwnd.is_none(){
            maximize_and_focus_window(code_hwnd.unwrap());
        }
    }
    

    Ok(format!("Project initialized: {}", folder_path))
}








#[tauri::command]
fn initialize_db() -> Result<(), String> {
    let conn = establish_connection().map_err(|e| e.to_string())?;
    create_settings_table(&conn).map_err(|e| e.to_string())?;
    Ok(())
}

pub struct AppState {
    pub db: Mutex<Connection>, // Mutex ensures thread-safe access
}

#[tauri::command]
fn set_user_settings(username: String, theme: String, language: String) -> Result<(), String> {
    let conn = establish_connection().map_err(|e| e.to_string())?;
    set_settings(&conn, &username, &theme, &language).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_user_settings(username: String) -> Result<UserSettings, String> {
    let conn = establish_connection().map_err(|e| e.to_string())?;
    let settings = get_settings(&conn, &username).map_err(|e| e.to_string())?;
    Ok(settings) // Tauri automatically serializes this as JSON
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            open_project,
            generate_speech,
            read_project_config,
            initialize_db,
            set_user_settings,
            get_user_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
