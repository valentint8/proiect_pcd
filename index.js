// index.js
const express = require('express');
const db = require('./db');
const app = express();
const port = 3000;
const cors = require('cors');

app.use(cors());
app.use(express.json());

const authRoutes = require('./auth');
app.use(authRoutes);

const restaurantRoutes = require('./restaurant');
app.use(restaurantRoutes);

const reservationRoutes = require('./reservation');
app.use(reservationRoutes);

const userRoutes = require('./users');
app.use(userRoutes);

const menuRoutes = require('./menu');
app.use(menuRoutes);

// Start server
app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});
