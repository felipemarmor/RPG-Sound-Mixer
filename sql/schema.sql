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
    sound_identifier TEXT NOT NULL, -- e.g., 'sounds/music/battle_theme.mp3'
    volume REAL NOT NULL DEFAULT 1.0, -- Volume from 0.0 to 1.0
    is_playing BOOLEAN DEFAULT FALSE, -- Or other playback state info
    loop_sound BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (scene_id) REFERENCES Scenes (scene_id) ON DELETE CASCADE
);

-- Optional: Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scenes_user_id ON Scenes (user_id);
CREATE INDEX IF NOT EXISTS idx_scenesounds_scene_id ON SceneSounds (scene_id);