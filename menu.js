const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { authenticateJWT, requireAdminOrManager } = require('./middleware');
const router = express.Router();

router.get('/restaurant/:id/menu', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const menu = db.prepare('SELECT * FROM menu WHERE restaurant_id = ?').all(id);
  res.json(menu);
});

router.post('/restaurant/:id/menu', authenticateJWT, requireAdminOrManager, (req, res) => {
  const { id } = req.params;
  const { name, description, price, image_url, available } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Name and price are required' });
  }
  const menuId = uuidv4();
  db.prepare(
    'INSERT INTO menu (id, restaurant_id, name, description, price, image_url, available) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    menuId,
    id,
    name,
    description || null,
    price,
    image_url || null,
    available !== undefined ? available : 1
  );
  res.status(201).json({ id: menuId, name, description, price, image_url, available });
});

router.put('/menu/:id', authenticateJWT, requireAdminOrManager, (req, res) => {
  const { id } = req.params;
  const { name, description, price, image_url, available } = req.body;
  const menuItem = db.prepare('SELECT * FROM menu WHERE id = ?').get(id);
  if (!menuItem) return res.status(404).json({ error: 'Menu item not found' });

  db.prepare(
    'UPDATE menu SET name = ?, description = ?, price = ?, image_url = ?, available = ? WHERE id = ?'
  ).run(
    name || menuItem.name,
    description || menuItem.description,
    price !== undefined ? price : menuItem.price,
    image_url || menuItem.image_url,
    available !== undefined ? available : menuItem.available,
    id
  );
  res.json({ message: 'Menu item updated' });
});

router.delete('/menu/:id', authenticateJWT, requireAdminOrManager, (req, res) => {
  const { id } = req.params;
  const info = db.prepare('DELETE FROM menu WHERE id = ?').run(id);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Menu item not found' });
  }
  res.json({ message: 'Menu item deleted' });
});

module.exports = router;