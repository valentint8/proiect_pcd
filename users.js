const express = require('express');
const db = require('./db');
const { authenticateJWT, requireAdminOrManager, requireAdminOrAnyManager } = require('./middleware');
const router = express.Router();

router.get('/users', authenticateJWT, requireAdminOrAnyManager, (req, res) => {
  const users = db.prepare('SELECT id, name FROM users').all();

  const stmt = db.prepare('SELECT 1 FROM manager WHERE user_uuid = ? LIMIT 1');
  const usersWithManagerFlag = users.map(user => ({
    ...user,
    isManager: !!stmt.get(user.id)
  }));

  res.json(usersWithManagerFlag);
});

router.get('/user/me', authenticateJWT, (req, res) => {
  const user = db.prepare('SELECT id, first_name, last_name, email, phone, profile_picture FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.put('/user/update', authenticateJWT, (req, res) => {
  const { first_name, last_name, phone, profile_picture } = req.body;
  db.prepare(
    'UPDATE users SET first_name = ?, last_name = ?, phone = ?, profile_picture = ? WHERE id = ?'
  ).run(
    first_name,
    last_name,
    phone,
    profile_picture,
    req.user.id
  );
  res.json({ message: 'Profile updated!' });
});

module.exports = router;