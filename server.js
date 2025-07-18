console.log('[SERVER.JS] Script starting...'); // Log 1: Script start

const express = require('express');
console.log('[SERVER.JS] Express required.');
const bcrypt = require('bcrypt');
console.log('[SERVER.JS] Bcrypt required.');
const { db, dbRun, dbGet, dbAll } = require('./db/database.js');
console.log('[SERVER.JS] Database module required. DB object:', db ? 'Exists' : 'Does NOT exist');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mm = require('music-metadata');
console.log('[SERVER.JS] Path, fs, and multer required.');

const app = express();
console.log('[SERVER.JS] Express app initialized.');
const port = 3001; // You can choose any port

// Middleware to parse JSON bodies
app.use(express.json());
// Middleware to parse URL-encoded bodies (for form submissions if not using JS fetch for JSON)
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
   destination: function (req, file, cb) {
       const userId = req.body.userId; // Assuming userId is sent in the form data
       if (!userId) {
           return cb(new Error("User ID is required for upload."), null);
       }
       const userUploadsPath = path.join(__dirname, 'sounds', 'user_uploads', userId.toString());
       fs.mkdirSync(userUploadsPath, { recursive: true });
       cb(null, userUploadsPath);
   },
   filename: function (req, file, cb) {
       // Sanitize filename to prevent directory traversal issues
       const safeFilename = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '');
       cb(null, Date.now() + '-' + safeFilename);
   }
});

const upload = multer({
   storage: storage,
   limits: { fileSize: 2 * 1024 * 1024 }, // 2MB file size limit
   fileFilter: function (req, file, cb) {
       if (file.mimetype.startsWith('audio/')) {
           cb(null, true);
       } else {
           cb(new Error('Only audio files are allowed!'), false);
       }
   }
}).single('soundFile');

// API ROUTES
app.get('/api/test', (req, res) => {
    res.status(200).json({ message: 'Test route is working!' });
});

// Signup Endpoint
app.post('/api/signup', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    try {
        const checkUserSql = `SELECT * FROM Users WHERE username = ? OR (email IS NOT NULL AND email = ? AND ? IS NOT NULL)`;
        const existingUser = await dbGet(checkUserSql, [username, email, email]);

        if (existingUser) {
            if (existingUser.username === username) {
                return res.status(409).json({ message: 'Username already exists.' });
            }
            if (email && existingUser.email === email) {
                return res.status(409).json({ message: 'Email already exists.' });
            }
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const insertSql = `INSERT INTO Users (username, email, password_hash) VALUES (?, ?, ?)`;
        const { lastID } = await dbRun(insertSql, [username, email, hashedPassword]);

        console.log(`User ${username} registered with ID: ${lastID}`);
        res.status(201).json({
            message: 'User registered successfully!',
            userId: lastID,
            username: username
        });
    } catch (error) {
        console.error('Error during signup process:', error);
        res.status(500).json({ message: 'Server error during signup.' });
    }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`[SERVER.JS] /api/login hit for email/username: ${email}`);

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const findUserSql = `SELECT * FROM Users WHERE email = ? OR username = ?`;
        const user = await dbGet(findUserSql, [email, email]);

        if (!user) {
            console.log(`[SERVER.JS] Login attempt for non-existent user: ${email}`);
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const match = await bcrypt.compare(password, user.password_hash);

        if (match) {
            console.log(`[SERVER.JS] User ${user.username} logged in successfully.`);
            res.status(200).json({
                message: 'Login successful!',
                userId: user.user_id,
                username: user.username,
                email: user.email
            });
        } else {
            console.log(`[SERVER.JS] Password mismatch for user: ${email}`);
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
    } catch (error) {
        console.error('[SERVER.JS] Error during login process:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// Save Scene Endpoint
app.post('/api/scenes', async (req, res) => {
    const { userId, sceneName, sounds } = req.body;
    console.log(`[SERVER.JS] /api/scenes hit. UserID: ${userId}, SceneName: ${sceneName}`);

    if (!userId || !sceneName || !Array.isArray(sounds)) {
        return res.status(400).json({ message: 'User ID, scene name, and sounds array are required.' });
    }

    try {
        await dbRun("BEGIN TRANSACTION;");

        const findSceneSql = `SELECT scene_id FROM Scenes WHERE user_id = ? AND scene_name = ?`;
        const existingScene = await dbGet(findSceneSql, [userId, sceneName]);

        let sceneId;
        if (existingScene) {
            sceneId = existingScene.scene_id;
            console.log(`[SERVER.JS] Scene "${sceneName}" exists (ID: ${sceneId}). Updating sounds.`);
            const deleteOldSoundsSql = `DELETE FROM SceneSounds WHERE scene_id = ?`;
            await dbRun(deleteOldSoundsSql, [sceneId]);
            const updateSceneTimestampSql = `UPDATE Scenes SET updated_at = CURRENT_TIMESTAMP WHERE scene_id = ?`;
            await dbRun(updateSceneTimestampSql, [sceneId]);
        } else {
            const insertSceneSql = `INSERT INTO Scenes (user_id, scene_name) VALUES (?, ?)`;
            const { lastID } = await dbRun(insertSceneSql, [userId, sceneName]);
            sceneId = lastID;
            console.log(`[SERVER.JS] New scene "${sceneName}" created with ID: ${sceneId} for user ${userId}.`);
        }

        if (sounds.length > 0) {
            const insertSoundSql = `INSERT INTO SceneSounds (scene_id, sound_name, volume, slot_index) VALUES (?, ?, ?, ?)`;
            for (const sound of sounds) {
                await dbRun(insertSoundSql, [sceneId, sound.sound_name, sound.volume, sound.slot_index]);
            }
        }

        await dbRun("COMMIT;");
        console.log(`[SERVER.JS] Scene "${sceneName}" (ID: ${sceneId}) and its sounds saved successfully for user ${userId}.`);
        res.status(201).json({ message: 'Scene saved successfully!', sceneId: sceneId });

    } catch (error) {
        console.error('[SERVER.JS] Error in /api/scenes endpoint:', error);
        try {
            await dbRun("ROLLBACK;");
            console.log('[SERVER.JS] Transaction rolled back successfully.');
        } catch (rollbackError) {
            console.error('[SERVER.JS] Failed to rollback transaction:', rollbackError);
        }
        res.status(500).json({ message: 'Error saving scene.', error: error.message });
    }
});

// Get Scenes for a User Endpoint
app.get('/api/scenes', async (req, res) => {
    const userId = req.query.userId;
    console.log(`[SERVER.JS] /api/scenes GET hit for userId: ${userId}`);

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required.' });
    }

    try {
        const sql = `SELECT scene_id, scene_name, updated_at FROM Scenes WHERE user_id = ? ORDER BY updated_at DESC`;
        const scenes = await dbAll(sql, [userId]);
        console.log(`[SERVER.JS] Found ${scenes.length} scenes for user ${userId}.`);
        res.status(200).json(scenes);
    } catch (error) {
        console.error('[SERVER.JS] Database error fetching scenes:', error.message);
        res.status(500).json({ message: 'Error fetching scenes.' });
    }
});

// Get a specific scene with its sounds
app.get('/api/scenes/:sceneId', async (req, res) => {
    const { sceneId } = req.params;
    const userId = req.query.userId;

    if (!userId) {
        return res.status(401).json({ message: 'User authentication is required.' });
    }

    try {
        const sceneSql = `SELECT * FROM Scenes WHERE scene_id = ? AND user_id = ?`;
        const scene = await dbGet(sceneSql, [sceneId, userId]);

        if (!scene) {
            return res.status(404).json({ message: 'Scene not found or access denied.' });
        }

        const soundsSql = `SELECT sound_name, volume, slot_index FROM SceneSounds WHERE scene_id = ? ORDER BY slot_index`;
        const sounds = await dbAll(soundsSql, [sceneId]);

        res.status(200).json({ ...scene, sounds });
    } catch (error) {
        console.error('[SERVER.JS] Database error fetching scene:', error.message);
        res.status(500).json({ message: 'Error fetching scene.' });
    }
});

app.post('/api/sounds/upload', (req, res) => {
   upload(req, res, async function (err) {
       if (err instanceof multer.MulterError) {
           return res.status(400).json({ message: `Multer error: ${err.message}` });
       } else if (err) {
           return res.status(400).json({ message: err.message });
       }

       const { userId, soundName, icon } = req.body;
       const file = req.file;

       if (!userId || !soundName || !icon || !file) {
           return res.status(400).json({ message: 'Missing required fields.' });
       }

       try {
           const metadata = await mm.parseFile(file.path);
           if (metadata.format.duration > 12) {
               fs.unlinkSync(file.path); // Delete the file
               return res.status(400).json({ message: 'Sound duration cannot exceed 12 seconds.' });
           }

           const relativePath = path.relative(__dirname, file.path).replace(/\\/g, '/');
           const sql = `INSERT INTO Sounds (user_id, sound_name, file_path, icon) VALUES (?, ?, ?, ?)`;
           const { lastID } = await dbRun(sql, [userId, soundName, relativePath, icon]);
           res.status(201).json({ message: 'Sound uploaded successfully!', soundId: lastID });
       } catch (error) {
           console.error('Error processing sound upload:', error);
           fs.unlinkSync(file.path); // Clean up the file on error
           res.status(500).json({ message: 'Server error while processing sound.' });
       }
   });
});

app.get('/api/sounds', async (req, res) => {
   const userId = req.query.userId;
   try {
       let sql;
       let params;
       if (userId) {
           sql = `SELECT * FROM Sounds WHERE user_id IS NULL OR user_id = ?`;
           params = [userId];
       } else {
           sql = `SELECT * FROM Sounds WHERE user_id IS NULL`;
           params = [];
       }
       const sounds = await dbAll(sql, params);
       res.status(200).json(sounds);
   } catch (error) {
       console.error('Error fetching sounds:', error);
       res.status(500).json({ message: 'Error fetching sounds.' });
   }
});

app.delete('/api/sounds/:soundId', async (req, res) => {
   const { soundId } = req.params;
   const { userId } = req.body; // Assuming userId is sent for verification

   if (!userId) {
       return res.status(401).json({ message: 'User authentication is required.' });
   }

   try {
       const soundSql = `SELECT * FROM Sounds WHERE sound_id = ?`;
       const sound = await dbGet(soundSql, [soundId]);

       if (!sound) {
           return res.status(404).json({ message: 'Sound not found.' });
       }

       if (sound.user_id !== parseInt(userId, 10)) {
           return res.status(403).json({ message: 'You are not authorized to delete this sound.' });
       }

       await dbRun("BEGIN TRANSACTION;");

       const deleteSceneSoundsSql = `DELETE FROM SceneSounds WHERE sound_name = ?`;
       await dbRun(deleteSceneSoundsSql, [sound.sound_name]);

       const deleteSoundSql = `DELETE FROM Sounds WHERE sound_id = ?`;
       await dbRun(deleteSoundSql, [soundId]);

       await dbRun("COMMIT;");

       const filePath = path.join(__dirname, sound.file_path);
       fs.unlink(filePath, (err) => {
           if (err) {
               console.error("Error deleting sound file:", err);
               // Don't block response for this, but log it.
           }
       });

       res.status(200).json({ message: 'Sound deleted successfully.' });

   } catch (error) {
       await dbRun("ROLLBACK;");
       console.error('Error deleting sound:', error);
       res.status(500).json({ message: 'Error deleting sound.' });
   }
});

// STATIC FILE SERVING
// Serve static files from the root directory first
app.use(express.static(__dirname));
// Then, serve static files from 'www' directory (for login page assets etc.)
// This order allows /login.style.css to be found in www if not in root.
app.use(express.static(path.join(__dirname, 'www')));
app.use('/sounds', express.static(path.join(__dirname, 'sounds')));


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