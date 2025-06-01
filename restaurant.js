const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { authenticateJWT, requireAdmin, requireAdminOrManager} = require('./middleware');
const router = express.Router();

router.get('/restaurant', authenticateJWT, (req, res) => {
  const restaurants = db.prepare('SELECT * FROM restaurant').all();
  res.json(restaurants);
});

router.post('/restaurant', authenticateJWT, requireAdmin, (req, res) => {
  const {
    name,
    description,
    address,
    phone,
    image_url,
    open_time,
    close_time,
    cuisine
  } = req.body;

  if (!name) return res.status(400).json({ error: 'Name is required' });

  const id = uuidv4();
  db.prepare(`INSERT INTO restaurant (
    id, name, description, address, phone, image_url, open_time, close_time, cuisine, rating, rating_count
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id,
    name,
    description || null,
    address || null,
    phone || null,
    image_url || null,
    open_time || null,
    close_time || null,
    cuisine || null,
    0,
    0
  );

  res.status(201).json({ id, name, description, address, phone, image_url, open_time, close_time, cuisine });
});

router.delete('/restaurant/:id', authenticateJWT, requireAdmin, (req, res) => {
  const { id } = req.params;
  const info = db.prepare('DELETE FROM restaurant WHERE id = ?').run(id);

  if (info.changes === 0) {
    return res.status(404).json({ error: 'Restaurant not found' });
  }

  res.json({ message: 'Restaurant deleted' });
});

router.put('/restaurant/manager/:id', authenticateJWT, requireAdminOrManager, (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    address,
    phone,
    image_url,
    open_time,
    close_time,
    cuisine
  } = req.body;

  const restaurant = db.prepare('SELECT * FROM restaurant WHERE id = ?').get(id);
  if (!restaurant) {
    return res.status(404).json({ error: 'Restaurant not found' });
  }

  db.prepare(`UPDATE restaurant SET
    name = ?,
    description = ?,
    address = ?,
    phone = ?,
    image_url = ?,
    open_time = ?,
    close_time = ?,
    cuisine = ?
    WHERE id = ?`).run(
      name || restaurant.name,
      description || restaurant.description,
      address || restaurant.address,
      phone || restaurant.phone,
      image_url || restaurant.image_url,
      open_time || restaurant.open_time,
      close_time || restaurant.close_time,
      cuisine || restaurant.cuisine,
      id
    );

  res.json({ message: 'Restaurant updated' });
});

router.post('/restaurant/manager', authenticateJWT, requireAdminOrManager, (req, res) => {
  const { user_uuid, restaurant_uuid } = req.body;
  if (!user_uuid || !restaurant_uuid) {
    return res.status(400).json({ error: 'user_uuid and restaurant_uuid are required' });
  }

  const restaurant = db.prepare('SELECT * FROM restaurant WHERE id = ?').get(restaurant_uuid);
  if (!restaurant) {
    return res.status(404).json({ error: 'Restaurant not found' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(user_uuid);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const exists = db.prepare('SELECT 1 FROM manager WHERE user_uuid = ? AND restaurant_uuid = ?').get(user_uuid, restaurant_uuid);
  if (exists) {
    return res.status(409).json({ error: 'User is already a manager for this restaurant' });
  }

  db.prepare('INSERT INTO manager (user_uuid, restaurant_uuid) VALUES (?, ?)').run(user_uuid, restaurant_uuid);

  res.json({ message: 'User added as manager for the restaurant' });
});

router.get('/restaurant/:id/menu', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const menu = db.prepare('SELECT * FROM menu WHERE restaurant_id = ?').all(id);
  res.json(menu);
});

module.exports = router;