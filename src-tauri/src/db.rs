use rusqlite::{Connection, Result};

// Establish a connection to the database
pub fn establish_connection() -> Result<Connection> {
    let conn = Connection::open("settings.db")?;
    Ok(conn)
}

// Create the settings table if it doesn't already exist
pub fn create_settings_table(conn: &Connection) -> Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            theme TEXT NOT NULL,
            language TEXT NOT NULL
        )",
        [],
    )?;
    Ok(())
}
