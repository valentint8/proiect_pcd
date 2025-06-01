// index.js
const express = require('express');
const db = require('./db');
const app = express();
const port = 3000;

app.use(express.json());

const authRoutes = require('./auth');
app.use(authRoutes);

const restaurantRoutes = require('./restaurant');
app.use(restaurantRoutes);

const userRoutes = require('./users');

const reservationRoutes = require('./reservation');
app.use(reservationRoutes);

app.use(userRoutes);
// Start server
app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});
