const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = '02181a73c0f2d0039683252759b4e4ea744a4ac37dd87a2664a71f56e444e85d22027b1946e5ef43440fc5e50b03336e0598ec5ee415f803a7591b3b8cd35ff1'; // Use env variable in production

// REGISTER endpoint
router.post('/register', async (req, res) => {
  const { first_name, last_name, email, phone, password, profile_picture } = req.body;
  if (!first_name || !last_name || !email || !phone || !password) {
    return res.status(400).json({ error: 'First name, last name, email, phone, and password are required' });
  }

  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'User with this email already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const id = uuidv4();
  db.prepare(
    'INSERT INTO users (id, first_name, last_name, email, phone, password, profile_picture) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, first_name, last_name, email, phone, hashedPassword, profile_picture || null);

  res.status(201).json({ id, first_name, last_name, email, phone, profile_picture: profile_picture || null });
});

// LOGIN endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  res.json({ token });
});

// CHANGE PASSWORD endpoint
router.post('/change-password', async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;
  if (!email || !oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Email, old password, and new password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const valid = await bcrypt.compare(oldPassword, user.password);
  if (!valid) return res.status(401).json({ error: 'Old password is incorrect' });

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashedNewPassword, email);

  res.json({ message: 'Password changed successfully' });
});

module.exports = router;