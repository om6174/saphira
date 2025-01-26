use rusqlite::{params, Connection, Result};
use serde::{Serialize, Deserialize};

// Define a struct to hold the user settings
#[derive(Serialize, Deserialize)]
pub struct UserSettings {
    username: String,
    theme: String,
    language: String,
}

// Add or update settings for a specific username
pub fn set_settings(conn: &Connection, username: &str, theme: &str, language: &str) -> Result<()> {
    conn.execute(
        "INSERT OR REPLACE INTO settings (username, theme, language) VALUES (?, ?, ?)",
        params![username, theme, language],
    )?;
    Ok(())
}

// Retrieve settings for a specific username and return them as a JSON object
pub fn get_settings(conn: &Connection, username: &str) -> Result<UserSettings> {
    let mut stmt = conn.prepare("SELECT username, theme, language FROM settings WHERE username = ?")?;
    let settings = stmt.query_row(params![username], |row| {
        Ok(UserSettings {
            username: row.get(0)?,
            theme: row.get(1)?,
            language: row.get(2)?,
        })
    })?;

    Ok(settings)
}
