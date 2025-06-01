const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = '02181a73c0f2d0039683252759b4e4ea744a4ac37dd87a2664a71f56e444e85d22027b1946e5ef43440fc5e50b03336e0598ec5ee415f803a7591b3b8cd35ff1'; // Use env variable in production

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Malformed token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  const admin = db.prepare('SELECT 1 FROM admin WHERE user_uuid = ?').get(req.user.id);
  if (!admin) return res.status(403).json({ error: 'Admin access required' });
  next();
}

// Middleware to check if user is admin or manager for a specific restaurant
function requireAdminOrManager(req, res, next) {
  const userId = req.user.id;
  const restaurantId = req.params.id;

  // Check admin
  const isAdmin = db.prepare('SELECT 1 FROM admin WHERE user_uuid = ?').get(userId);
  console.log(`User ID: ${userId}, Restaurant ID: ${restaurantId}, Is Admin: ${isAdmin}`);
  if (isAdmin) return next();
  
  // Check manager
  const isManager = db.prepare('SELECT 1 FROM manager WHERE user_uuid = ? AND restaurant_uuid = ?').get(userId, restaurantId);
  console.log(`User ID: ${userId}, Restaurant ID: ${restaurantId}, Is Manager: ${isManager}`);
  if (isManager) return next();

  return res.status(403).json({ error: 'Admin or manager access required.' });
}

function requireAdminOrAnyManager(req, res, next) {
  const userId = req.user.id;

  // Check admin
  const isAdmin = db.prepare('SELECT 1 FROM admin WHERE user_uuid = ?').get(userId);
  if (isAdmin) return next();

  // Check if user is manager for any restaurant
  const isManager = db.prepare('SELECT 1 FROM manager WHERE user_uuid = ?').get(userId);
  if (isManager) return next();

  return res.status(403).json({ error: 'Admin or store manager access required.' });
}
module.exports = { authenticateJWT, requireAdmin, requireAdminOrManager, requireAdminOrAnyManager };