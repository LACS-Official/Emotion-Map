require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10001;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// Emotion APIs

// Emotion APIs
app.get('/api/emotions', (req, res) => {
  const { type } = req.query;
  let query = 'SELECT * FROM emotions';
  const params = [];
  if (type && type !== 'all') {
    query += ' WHERE type = ?';
    params.push(type);
  }
  query += ' ORDER BY timestamp DESC';
  const emotions = db.prepare(query).all(...params);
  res.json(emotions);
});

app.post('/api/mood', upload.single('image'), (req, res) => {
  const { lat, lng, type, message } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const result = db.prepare(`
    INSERT INTO emotions (lat, lng, type, intensity, message, image_url) 
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(lat, lng, type, 100, message, imageUrl);
  res.json({ id: result.lastInsertRowid, image_url: imageUrl });
});

app.get('/api/stats', (req, res) => {
  const stats = db.prepare(`
    SELECT type, COUNT(*) as count 
    FROM emotions 
    GROUP BY type
  `).all();
  res.json(stats);
});

// Admin API - Clear All Data (Publicly accessible for this simplified version)
app.delete('/api/admin/clear-data', (req, res) => {
  db.prepare('DELETE FROM emotions').run();
  res.json({ message: 'All emotion data cleared successfully' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
