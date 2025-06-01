// db.js
const Database = require('better-sqlite3');
const db = new Database('data.db'); // creates file if not exists
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');


// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );
`);

// Create admin table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS admin (
    user_uuid TEXT PRIMARY KEY
  );
`);

// Create restaurant table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS restaurant (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
  );
`);

// ...existing code...

// Create manager table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS manager (
    user_uuid TEXT NOT NULL,
    restaurant_uuid TEXT NOT NULL,
    PRIMARY KEY (user_uuid, restaurant_uuid)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS reservations (
    reservation_id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    reservation_date TEXT NOT NULL,
    reservation_time TEXT NOT NULL,
    nr_of_people INTEGER NOT NULL,
    additional_comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);


const defaultUserName = 'admin';
const defaultPassword = 'password'; // <-- set your password here
const defaultUserId = uuidv4();

const userExists = db.prepare('SELECT id FROM users WHERE name = ?').get(defaultUserName);
if (!userExists) {
  const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
  db.prepare('INSERT INTO users (id, name, password) VALUES (?, ?, ?)').run(defaultUserId, defaultUserName, hashedPassword);
  db.prepare('INSERT INTO admin (user_uuid) VALUES (?)').run(defaultUserId);

  // Create a default restaurant
  const defaultRestaurantId = uuidv4();
  const defaultRestaurantName = 'Default Restaurant';
  const defaultRestaurantDescription = 'This is the default restaurant.';
  db.prepare('INSERT INTO restaurant (id, name, description) VALUES (?, ?, ?)').run(
    defaultRestaurantId,
    defaultRestaurantName,
    defaultRestaurantDescription
  );

  // Assign the admin user as manager of the default restaurant
  db.prepare('INSERT INTO manager (user_uuid, restaurant_uuid) VALUES (?, ?)').run(
    defaultUserId,
    defaultRestaurantId
  );
  // Create a dummy reservation for this user and restaurant
  const reservationId = uuidv4();
  db.prepare(`INSERT INTO reservations (
    reservation_id,
    restaurant_id,
    user_id,
    status,
    reservation_date,
    reservation_time,
    nr_of_people,
    additional_comment
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    reservationId,
    defaultRestaurantId,
    defaultUserId,
    'pending',
    '2025-06-01',
    '18:00',
    2,
    'Test reservation'
  );
}
module.exports = db;