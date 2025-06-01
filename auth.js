const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = '02181a73c0f2d0039683252759b4e4ea744a4ac37dd87a2664a71f56e444e85d22027b1946e5ef43440fc5e50b03336e0598ec5ee415f803a7591b3b8cd35ff1'; // Use env variable in production

// REGISTER endpoint
router.post('/register', async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ error: 'Name and password are required' });

  const existing = db.prepare('SELECT * FROM users WHERE name = ?').get(name);
  if (existing) return res.status(409).json({ error: 'User already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const id = uuidv4();
  const insert = db.prepare('INSERT INTO users (id, name, password) VALUES (?, ?, ?)');
  const result = insert.run(id, name, hashedPassword);

  res.status(201).json({ id, name });
});

// LOGIN endpoint
router.post('/login', async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ error: 'Name and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE name = ?').get(name);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// CHANGE PASSWORD endpoint
router.post('/change-password', async (req, res) => {
  const { name, oldPassword, newPassword } = req.body;
  if (!name || !oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Name, old password, and new password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE name = ?').get(name);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const valid = await bcrypt.compare(oldPassword, user.password);
  if (!valid) return res.status(401).json({ error: 'Old password is incorrect' });

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE name = ?').run(hashedNewPassword, name);

  res.json({ message: 'Password changed successfully' });
});


module.exports = router;