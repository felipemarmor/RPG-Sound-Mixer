const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'rpg-mixer.db');
const schemaPath = path.join(__dirname, '../sql/schema.sql');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Erro ao conectar:', err.message);
  else {
    console.log('✅ Banco conectado em', dbPath);
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema, (err) => {
      if (err) console.error('Erro ao aplicar schema:', err.message);
      else console.log('✅ Schema aplicado com sucesso!');
    });
  }
});

module.exports = db;