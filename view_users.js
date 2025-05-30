const db = require('./db/database.js');

console.log("Attempting to retrieve all users from the database (including password hash)...");

const sql = `SELECT user_id, username, email, password_hash, created_at FROM Users`;

db.all(sql, [], (err, rows) => {
    if (err) {
        console.error("Error retrieving users:", err.message);
        return;
    }

    if (rows.length === 0) {
        console.log("No users found in the database.");
    } else {
        console.log("Users found (password_hash is the stored bcrypt hash):");
        rows.forEach((row) => {
            console.log(`- ID: ${row.user_id}, Username: ${row.username}, Email: ${row.email || 'N/A'}, Hash: ${row.password_hash}, Created: ${row.created_at}`);
        });
    }

    // Important: Since db/database.js keeps the connection open for the server,
    // we should not close it here if the server might be running or if other scripts expect it to be open.
    // For a simple one-off script where the server is NOT running, you might add db.close().
    // However, given the setup, it's safer to let the main process (like server.js) manage the connection's lifecycle.
    // This script will simply execute its query and then exit.
});