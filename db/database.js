const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dataPath = process.env.NODE_ENV === 'production' ? '/data' : __dirname;
const dbPath = path.join(dataPath, 'rpg-mixer.db');
const schemaPath = path.join(__dirname, '../sql/schema.sql');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Erro ao conectar:', err.message);
  else {
    console.log('✅ Banco conectado em', dbPath);
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema, (err) => {
      if (err) {
          console.error('Erro ao aplicar schema:', err.message);
      } else {
          console.log('✅ Schema aplicado com sucesso!');
          insertDefaultSounds();
      }
    });
  }
});

function insertDefaultSounds() {
   const defaultSounds = [
       { name: 'rain', icon: '🌧️', file: 'sounds/Light Rain.mp3' },
       { name: 'wind', icon: '🌬️', file: 'sounds/Wind Sound.mp3' },
       { name: 'city', icon: '🏙️', file: 'sounds/city sound.mp3' },
       { name: 'battle', icon: '⚔️', file: 'sounds/Medieval Battle Sound.mp3' },
       { name: 'forest', icon: '🌲', file: 'sounds/Forest Sound.mp3' },
       { name: 'campfire', icon: '🔥', file: 'sounds/Campfire Sound.mp3' },
       { name: 'tavern', icon: '🍺', file: 'sounds/Tavern Sound.mp3' },
       { name: 'cave', icon: '🦇', file: 'sounds/Cave Sound.mp3' }
   ];

   const sql = `INSERT OR IGNORE INTO Sounds (sound_name, icon, file_path, user_id) VALUES (?, ?, ?, NULL)`;

   db.serialize(() => {
       const stmt = db.prepare(sql);
       let insertedCount = 0;
       defaultSounds.forEach(sound => {
           stmt.run(sound.name, sound.icon, sound.file, function(err) {
               if (this.changes > 0) {
                   insertedCount++;
               }
           });
       });
       stmt.finalize((err) => {
           if (err) {
               console.error('Error inserting default sounds:', err.message);
           } else if (insertedCount > 0) {
               console.log(`✅ Inserted ${insertedCount} new default sounds.`);
           } else {
               console.log('✅ Default sounds already exist.');
           }
       });
   });
}

function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                console.error('Error running sql ' + sql);
                console.error(err);
                reject(err);
            } else {
                resolve({ lastID: this.lastID, changes: this.changes });
            }
        });
    });
}

function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, result) => {
            if (err) {
                console.error('Error running sql ' + sql);
                console.error(err);
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error('Error running sql ' + sql);
                console.error(err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}


module.exports = {
    db,
    dbRun,
    dbGet,
    dbAll
};