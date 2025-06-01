// db.js
const Database = require('better-sqlite3');
const db = new Database('data.db'); // creates file if not exists
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');


// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    password TEXT NOT NULL,
    profile_picture TEXT
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
    description TEXT,
    address TEXT,
    phone TEXT,
    image_url TEXT,
    open_time TEXT,    -- ex: '08:00'
    close_time TEXT,   -- ex: '22:00'
    cuisine TEXT,      -- ex: 'Italian, Pizza'
    rating REAL DEFAULT 0,
    rating_count INTEGER DEFAULT 0
  );
`);

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

db.exec(`
  CREATE TABLE IF NOT EXISTS menu (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image_url TEXT,
    available INTEGER DEFAULT 1,
    FOREIGN KEY (restaurant_id) REFERENCES restaurant(id)
  );
`);

const defaultFirstName = 'Admin';
const defaultLastName = 'Admin';
const defaultEmail = 'admin@example.com';
const defaultPhone = '0700000000';
const defaultPassword = 'password';
const defaultUserId = uuidv4();

const userExists = db.prepare('SELECT id FROM users WHERE email = ?').get(defaultEmail);
if (!userExists) {
  const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
  db.prepare('INSERT INTO users (id, first_name, last_name, email, phone, password, profile_picture) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    defaultUserId,
    defaultFirstName,
    defaultLastName,
    defaultEmail,
    defaultPhone,
    hashedPassword,
    null
  );
  db.prepare('INSERT INTO admin (user_uuid) VALUES (?)').run(defaultUserId);

  // Create a default restaurant
  const defaultRestaurantId = uuidv4();
  db.prepare(`INSERT INTO restaurant (
    id, name, description, address, phone, image_url, open_time, close_time, cuisine, rating, rating_count
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    defaultRestaurantId,
    'Default Restaurant',
    'This is the default restaurant.',
    'Strada Exemplu 1',
    '0700000000',
    null,
    '08:00',
    '22:00',
    'Pizza, Italian',
    5.0,
    1
  );

  // Assign the admin user as manager of the default restaurant
  db.prepare('INSERT INTO manager (user_uuid, restaurant_uuid) VALUES (?, ?)').run(
    defaultUserId,
    defaultRestaurantId
  );

  // Adaugă produse demo în meniu
  db.prepare('INSERT INTO menu (id, restaurant_id, name, description, price, image_url) VALUES (?, ?, ?, ?, ?, ?)').run(
    uuidv4(),
    defaultRestaurantId,
    'Pizza Margherita',
    'Classic pizza with tomato, mozzarella, and basil.',
    32.5,
    null
  );
  db.prepare('INSERT INTO menu (id, restaurant_id, name, description, price, image_url) VALUES (?, ?, ?, ?, ?, ?)').run(
    uuidv4(),
    defaultRestaurantId,
    'Spaghetti Carbonara',
    'Pasta with eggs, cheese, pancetta, and pepper.',
    29.0,
    null
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