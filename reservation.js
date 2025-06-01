const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const router = express.Router();
const { authenticateJWT, requireAdmin, requireAdminOrManager } = require('./middleware');

router.post('/reservation', authenticateJWT, (req, res) => {
  const { restaurant_id, reservation_date, reservation_time, nr_of_people, additional_comment } = req.body;
  const user_id = req.user.id;

  if (!restaurant_id || !reservation_date || !reservation_time || !nr_of_people) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const reservation_id = uuidv4();
  db.prepare(`
    INSERT INTO reservations (reservation_id, restaurant_id, user_id, status, reservation_date, reservation_time, nr_of_people, additional_comment)
    VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)
  `).run(reservation_id, restaurant_id, user_id, reservation_date, reservation_time, nr_of_people, additional_comment || null);

  res.status(201).json({ reservation_id, status: 'pending' });
});


// Approve or decline a reservation
router.post('/reservation/:id/decision', authenticateJWT, requireAdminOrManager, (req, res) => {
  const { id } = req.params;
  const { decision } = req.body; // 'approved' or 'declined'

  if (!['approved', 'declined'].includes(decision)) {
    return res.status(400).json({ error: 'Invalid decision' });
  }

  const result = db.prepare(`
    UPDATE reservations
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE reservation_id = ?
  `).run(decision, id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Reservation not found' });
  }

  res.json({ message: `Reservation ${decision}` });
});

// Get all reservations (admin only)
router.get('/reservations', authenticateJWT, requireAdmin, (req, res) => {
  const reservations = db.prepare(`
    SELECT * FROM reservations
  `).all();
  res.json(reservations);
});

// Get reservations for a specific restaurant (admin or manager for that restaurant)
router.get('/reservations/restaurant/:restaurant_id', authenticateJWT, requireAdminOrManager, (req, res) => {
  const { restaurant_id } = req.params;
  // Optionally, you can check if the user is manager for this restaurant in the middleware

  const reservations = db.prepare(`
    SELECT * FROM reservations WHERE restaurant_id = ?
  `).all(restaurant_id);

  res.json(reservations);
});


module.exports = router;