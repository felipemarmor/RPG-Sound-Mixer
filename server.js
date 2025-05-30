console.log('[SERVER.JS] Script starting...'); // Log 1: Script start

const express = require('express');
console.log('[SERVER.JS] Express required.');
const bcrypt = require('bcrypt');
console.log('[SERVER.JS] Bcrypt required.');
const db = require('./db/database.js'); // Our database connection
console.log('[SERVER.JS] Database module required. DB object:', db ? 'Exists' : 'Does NOT exist');
const path = require('path');
console.log('[SERVER.JS] Path required.');

const app = express();
console.log('[SERVER.JS] Express app initialized.');
const port = 3000; // You can choose any port

// Middleware to parse JSON bodies
app.use(express.json());
// Middleware to parse URL-encoded bodies (for form submissions if not using JS fetch for JSON)
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory first
app.use(express.static(__dirname));
// Then, serve static files from 'www' directory (for login page assets etc.)
// This order allows /login.style.css to be found in www if not in root.
app.use(express.static(path.join(__dirname, 'www')));

// Signup Endpoint
app.post('/api/signup', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    // Basic validation (you can add more)
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    try {
        // Check if username or email already exists
        const checkUserSql = `SELECT * FROM Users WHERE username = ? OR (email IS NOT NULL AND email = ? AND ? IS NOT NULL)`;
        db.get(checkUserSql, [username, email, email], async (err, row) => {
            if (err) {
                console.error('Database error during user check:', err.message);
                return res.status(500).json({ message: 'Server error during user check.' });
            }
            if (row) {
                if (row.username === username) {
                    return res.status(409).json({ message: 'Username already exists.' });
                }
                if (email && row.email === email) {
                    return res.status(409).json({ message: 'Email already exists.' });
                }
            }

            // Hash the password
            const saltRounds = 10; // Standard practice
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Insert the new user
            const insertSql = `INSERT INTO Users (username, email, password_hash) VALUES (?, ?, ?)`;
            db.run(insertSql, [username, email, hashedPassword], function(err) {
                if (err) {
                    console.error('Database error during user insertion:', err.message);
                    return res.status(500).json({ message: 'Error registering new user.' });
                }
                console.log(`User ${username} registered with ID: ${this.lastID}`);
                // Respond with success (excluding password)
                res.status(201).json({
                    message: 'User registered successfully!',
                    userId: this.lastID, 
                    username: username 
                });
            });
        });
    } catch (error) {
        console.error('Error during signup process:', error);
        res.status(500).json({ message: 'Server error during signup.' });
    }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
    // Avoid logging the entire body if it contains sensitive info like password
    const { email, password } = req.body;
    console.log(`[SERVER.JS] /api/login hit for email/username: ${email}`); // Log email/username only

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // Find user by email (or username if you prefer, adjust SQL accordingly)
        // For simplicity, this example uses email. If username is also allowed, the query needs to check both.
        const findUserSql = `SELECT * FROM Users WHERE email = ? OR username = ?`;
        db.get(findUserSql, [email, email], async (err, user) => {
            if (err) {
                console.error('[SERVER.JS] Database error during login user find:', err.message);
                return res.status(500).json({ message: 'Server error during login.' });
            }

            if (!user) {
                console.log(`[SERVER.JS] Login attempt for non-existent user: ${email}`);
                return res.status(401).json({ message: 'Invalid credentials.' }); // Generic message for security
            }

            // Compare password
            const match = await bcrypt.compare(password, user.password_hash);

            if (match) {
                console.log(`[SERVER.JS] User ${user.username} logged in successfully.`);
                // Respond with success (excluding password_hash)
                // In a real app, you'd likely generate a session token (e.g., JWT) here
                res.status(200).json({
                    message: 'Login successful!',
                    userId: user.user_id,
                    username: user.username,
                    email: user.email
                    // Add any other user data you want to send to the client
                });
            } else {
                console.log(`[SERVER.JS] Password mismatch for user: ${email}`);
                return res.status(401).json({ message: 'Invalid credentials.' }); // Generic message
            }
        });
    } catch (error) {
        console.error('[SERVER.JS] Error during login process:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// The app.get('/', ...) route is no longer needed as express.static(__dirname)
// will serve index.html from the root by default.

console.log(`[SERVER.JS] About to call app.listen on port ${port}...`); // Log 2: Before app.listen
app.listen(port, () => {
    console.log(`[SERVER.JS] app.listen CALLBACK executing...`); // Log 3: Inside app.listen callback
    console.log(`✅ Server running at http://localhost:${port}`);
    console.log('Database connection status from server.js:');
    // Check db connection (db object itself doesn't give live status easily after initial connect)
    // The console.log in database.js should have already indicated success.
    // We can do a simple query to be sure if needed, but for now, we assume it's connected.
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='Users'", (err, row) => {
        if (err) {
            console.error("Error querying Users table on startup:", err.message);
        } else if (row) {
            console.log("✅ Users table found. Database seems OK.");
        } else {
            console.warn("⚠️ Users table not found. Check schema application.");
        }
    });
});