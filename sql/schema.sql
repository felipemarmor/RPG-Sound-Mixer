-- Users Table
CREATE TABLE IF NOT EXISTS Users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Scenes Table
CREATE TABLE IF NOT EXISTS Scenes (
    scene_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    scene_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users (user_id) ON DELETE CASCADE
);

-- SceneSounds Table (associates sounds with scenes and their volumes)
CREATE TABLE IF NOT EXISTS SceneSounds (
    scene_sound_id INTEGER PRIMARY KEY AUTOINCREMENT,
    scene_id INTEGER NOT NULL,
    sound_name TEXT NOT NULL, -- matches sound IDs like "rain", "campfire"
    volume REAL NOT NULL, -- values between 0.0 and 1.0
    slot_index INTEGER NOT NULL, -- representing the UI position of the sound in the mixer interface
    FOREIGN KEY (scene_id) REFERENCES Scenes (scene_id) ON DELETE CASCADE
);

-- Sounds Table
CREATE TABLE IF NOT EXISTS Sounds (
    sound_id INTEGER PRIMARY KEY AUTOINCREMENT,
    sound_name TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    icon TEXT, -- e.g., emoji '🎵'
    user_id INTEGER, -- NULL for default sounds, otherwise links to a user
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL -- Or CASCADE if you want to delete sounds when user is deleted
);

-- Optional: Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scenes_user_id ON Scenes (user_id);
CREATE INDEX IF NOT EXISTS idx_scenesounds_scene_id ON SceneSounds (scene_id);
CREATE INDEX IF NOT EXISTS idx_sounds_user_id ON Sounds (user_id);