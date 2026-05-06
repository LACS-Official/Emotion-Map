const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'emotions.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS emotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    type TEXT NOT NULL,
    intensity INTEGER NOT NULL,
    message TEXT,
    image_url TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Check and add columns if missing (migrations)
try { db.exec('ALTER TABLE emotions ADD COLUMN image_url TEXT'); } catch(e) {}

// Seed initial emotion data if empty
const count = db.prepare('SELECT COUNT(*) as count FROM emotions').get().count;
if (count === 0) {
  console.log('Seeding initial emotion data...');
  const insert = db.prepare('INSERT INTO emotions (lat, lng, type, intensity, message) VALUES (?, ?, ?, ?, ?)');
  const types = ['happy', 'stress', 'sad', 'calm'];
  const messages = [
    '今天心情不错！',
    '感觉压力有点大。',
    '天气很好，很开心。',
    '需要一点安静的时间。',
    '这里很有氛围。',
    '记录一下现在的心情。'
  ];
  const centerLat = 39.984120;
  const centerLng = 116.307484;
  for (let i = 0; i < 50; i++) {
    const lat = centerLat + (Math.random() - 0.5) * 0.1;
    const lng = centerLng + (Math.random() - 0.5) * 0.1;
    const type = types[Math.floor(Math.random() * types.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];
    insert.run(lat, lng, type, 100, message);
  }
}

module.exports = db;
