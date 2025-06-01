const express = require('express');
const db = require('./db');
const { authenticateJWT, requireAdminOrManager, requireAdminOrAnyManager } = require('./middleware');
const router = express.Router();

// Get all users (only for admin or store managers)
router.get('/users', authenticateJWT, requireAdminOrAnyManager, (req, res) => {
  // Select all users except the password
  const users = db.prepare('SELECT id, name FROM users').all();

  // For each user, check if they are a manager
  const stmt = db.prepare('SELECT 1 FROM manager WHERE user_uuid = ? LIMIT 1');
  const usersWithManagerFlag = users.map(user => ({
    ...user,
    isManager: !!stmt.get(user.id)
  }));

  res.json(usersWithManagerFlag);
});

module.exports = router;