const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { authenticateJWT, requireAdmin, requireAdminOrManager} = require('./middleware');
const router = express.Router();

// List all restaurants
router.get('/restaurant', authenticateJWT, (req, res) => {
  const restaurants = db.prepare('SELECT * FROM restaurant').all();
  res.json(restaurants);
});

// Create a restaurant
router.post('/restaurant', authenticateJWT, requireAdmin, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const id = uuidv4();
  db.prepare('INSERT INTO restaurant (id, name, description) VALUES (?, ?, ?)').run(id, name, description || null);

  res.status(201).json({ id, name, description });
});

// Delete a restaurant
router.delete('/restaurant/:id', authenticateJWT, requireAdmin, (req, res) => {
  const { id } = req.params;
  const info = db.prepare('DELETE FROM restaurant WHERE id = ?').run(id);

  if (info.changes === 0) {
    return res.status(404).json({ error: 'Restaurant not found' });
  }

  res.json({ message: 'Restaurant deleted' });
});

// Update restaurant data (admin or manager)
router.put('/restaurant/manager/:id', authenticateJWT, requireAdminOrManager, (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const restaurant = db.prepare('SELECT * FROM restaurant WHERE id = ?').get(id);
  if (!restaurant) {
    return res.status(404).json({ error: 'Restaurant not found' });
  }

  db.prepare('UPDATE restaurant SET name = ?, description = ? WHERE id = ?')
    .run(name || restaurant.name, description || restaurant.description, id);

  res.json({ message: 'Restaurant updated' });
});

// Add a user as store manager to a restaurant
router.post('/restaurant/manager', authenticateJWT, requireAdminOrManager, (req, res) => {
  const { user_uuid, restaurant_uuid } = req.body;
  if (!user_uuid || !restaurant_uuid) {
    return res.status(400).json({ error: 'user_uuid and restaurant_uuid are required' });
  }

  // Check if restaurant exists
  const restaurant = db.prepare('SELECT * FROM restaurant WHERE id = ?').get(restaurant_uuid);
  if (!restaurant) {
    return res.status(404).json({ error: 'Restaurant not found' });
  }

  // Check if user exists
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(user_uuid);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check if already manager
  const exists = db.prepare('SELECT 1 FROM manager WHERE user_uuid = ? AND restaurant_uuid = ?').get(user_uuid, restaurant_uuid);
  if (exists) {
    return res.status(409).json({ error: 'User is already a manager for this restaurant' });
  }

  db.prepare('INSERT INTO manager (user_uuid, restaurant_uuid) VALUES (?, ?)').run(user_uuid, restaurant_uuid);

  res.json({ message: 'User added as manager for the restaurant' });
});


module.exports = router;