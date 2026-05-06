const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'emotions.db');
const uploadDir = path.join(__dirname, 'uploads');

// Function to reset database
function resetDatabase() {
  console.log('Starting database reset...');

  // 1. Delete the database file if it exists to start fresh
  if (fs.existsSync(dbPath)) {
    console.log('Deleting existing database file...');
    // We close the connection if it was open, but here we are starting fresh
    fs.unlinkSync(dbPath);
  }

  // 2. Clear uploads directory
  if (fs.existsSync(uploadDir)) {
    console.log('Clearing uploads directory...');
    const files = fs.readdirSync(uploadDir);
    for (const file of files) {
      fs.unlinkSync(path.join(uploadDir, file));
    }
  } else {
    fs.mkdirSync(uploadDir);
  }

  const db = new Database(dbPath);

  // 3. Create tables
  console.log('Creating tables...');
  db.exec(`
    CREATE TABLE emotions (
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

  // 4. Seed initial data
  console.log('Seeding initial data...');
  const insert = db.prepare('INSERT INTO emotions (lat, lng, type, intensity, message) VALUES (?, ?, ?, ?, ?)');
  const types = ['happy', 'stress', 'sad', 'calm'];
  const messages = [
    '感觉今天阳光很好！',
    '有点压力，需要休息。',
    '心情一般般。',
    '很平静的一天。',
    '这里的风景不错。',
    '打卡成功！'
  ];
  
  const centerLat = 39.984120;
  const centerLng = 116.307484;

  db.transaction(() => {
    for (let i = 0; i < 50; i++) {
      const lat = centerLat + (Math.random() - 0.5) * 0.1;
      const lng = centerLng + (Math.random() - 0.5) * 0.1;
      const type = types[Math.floor(Math.random() * types.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];
      insert.run(lat, lng, type, 100, message);
    }
  })();

  db.close();
  console.log('Database reset and initialization complete!');
}

resetDatabase();
