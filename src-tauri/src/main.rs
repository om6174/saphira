use std::process::Command;
use std::time::{Duration, Instant};
use tauri::command;
use winapi::shared::windef::HWND;
use winapi::um::winuser::{
    EnumWindows, GetWindowTextA, SetForegroundWindow, ShowWindow, SW_MAXIMIZE,
};
use std::fs;
use std::path::Path as StdPath;
use sha2::{Sha256, Digest}; // For hashing dialogue strings
use deepgram::{speak::options::{Container, Encoding, Model}, Deepgram};
use deepgram::speak::options::Options;
use futures::stream::StreamExt;
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::Read;
use serde_json;
use std::env;
use dotenv::dotenv; // Import dotenv

#[derive(Deserialize, Serialize, Debug)]
struct ProjectConfig {
    shortcut: String,
    folder_path: String,
    project_path: String,
    project_name: String,
}

#[command]
fn read_project_config() -> Result<Vec<ProjectConfig>, String> {
    let file_path = "../client_paths.json";
    
    // Print the file path for debugging purposes
    println!("Attempting to open file at path: {}", file_path);

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
    dotenv().ok(); // This loads the .env file

    let audio_dir = "audio_cache";
    fs::create_dir_all(audio_dir).map_err(|e| e.to_string())?;

    // Generate a unique hash for the dialogue
    let mut hasher = Sha256::new();
    hasher.update(dialogue.as_bytes());
    let dialogue_hash = format!("{:x}", hasher.finalize());
    let file_path = format!("{}/{}.wav", audio_dir, dialogue_hash);

    // Check if the file exists
    if StdPath::new(&file_path).exists() {
        println!("Serving cached audio for dialogue: {}", dialogue);
        return fs::read(&file_path).map_err(|e| e.to_string());
    }

    // Generate audio using Deepgram
    let deepgram_api_key = match env::var("DEEPGRAM_API_KEY") {
        Ok(value) => value,
        Err(_) => {
            eprintln!("DEEPGRAM_API_KEY is not set or could not be read");
            String::new() // Use an empty string or handle the error as needed
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

// Open command for paths
fn open_with_command(command: &str, arg: &str) -> Result<(), String> {
    Command::new(command)
        .arg(arg)
        .spawn()
        .map_err(|e| format!("Failed to open '{}': {}", command, e))?;
    Ok(())
}

fn open_without_command(path: &str) -> Result<(), String> {
    Command::new("cmd")
        .args(&["/C", "start", "", path])
        .spawn()
        .map_err(|e| format!("Failed to open '{}': {}", path, e))?;
    Ok(())
}

fn find_window_by_partial_title(partial_title: &str, timeout: Duration) -> Result<HWND, String> {
    let start_time = Instant::now();
    while start_time.elapsed() < timeout {
        let mut found_hwnd: HWND = std::ptr::null_mut();
        unsafe {
            EnumWindows(
                Some(enum_window_proc),
                &mut (partial_title, &mut found_hwnd) as *mut _ as _,
            );
        }
        if !found_hwnd.is_null() {
            return Ok(found_hwnd);
        }
        std::thread::sleep(Duration::from_millis(100));
    }
    Err(format!(
        "Window with partial title '{}' not found within timeout",
        partial_title
    ))
}

unsafe extern "system" fn enum_window_proc(hwnd: HWND, lparam: isize) -> i32 {
    let (partial_title, found_hwnd) = &mut *(lparam as *mut (&str, &mut HWND));
    let mut buffer = [0i8; 512]; // Buffer to hold window title
    let length = GetWindowTextA(hwnd, buffer.as_mut_ptr(), buffer.len() as i32);
    if length > 0 {
        let title = std::ffi::CStr::from_ptr(buffer.as_ptr()).to_string_lossy();
        if title.contains(*partial_title) { // Dereference `partial_title` here
            **found_hwnd = hwnd;
            return 0; // Stop enumeration
        }
    }
    1 // Continue enumeration
}

// Tauri Command to open project folder
#[command]
fn open_project(folder_path: String, project_path: String) -> Result<String, String> {
    let folder_name = StdPath::new(&folder_path)
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("");

    let explorer_window_title = format!("{} - File Explorer", folder_name);

    // Open Explorer and wait for its window
    open_without_command(&folder_path)?;
    let explorer_hwnd = find_window_by_partial_title(&explorer_window_title, Duration::from_secs(2))?;
    unsafe {
        ShowWindow(explorer_hwnd, SW_MAXIMIZE);
        SetForegroundWindow(explorer_hwnd);
    }

    let project_name = StdPath::new(&project_path)
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("");

    let code_window_title = format!("{} - Visual Studio Code", project_name);
    // Open VS Code and wait for its window using partial title matching
    open_with_command("C:/Program Files/Microsoft VS Code/Code.exe", &project_path)?;
    let vs_code_hwnd = find_window_by_partial_title(&code_window_title, Duration::from_secs(2))?;
    unsafe {
        ShowWindow(vs_code_hwnd, SW_MAXIMIZE);
        SetForegroundWindow(vs_code_hwnd);
    }

    Ok(format!("Project initialized: {}", folder_path))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_project,generate_speech,read_project_config])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
