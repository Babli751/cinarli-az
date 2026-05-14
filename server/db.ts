import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../data.sqlite");

export const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT DEFAULT '',
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '📦',
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    old_price REAL,
    discount INTEGER DEFAULT 0,
    image TEXT DEFAULT '',
    category_slug TEXT REFERENCES categories(slug) ON DELETE SET NULL,
    stock INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    discount_percent INTEGER DEFAULT 0,
    image TEXT DEFAULT '',
    start_date TEXT,
    end_date TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT DEFAULT '',
    total REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    items TEXT NOT NULL DEFAULT '[]',
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Migrate: add is_featured column if not exists
try { db.exec("ALTER TABLE products ADD COLUMN is_featured INTEGER DEFAULT 0"); } catch {}

// Seed admin if no users exist
const userCount = (db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c;
if (userCount === 0) {
  const bcrypt = await import("bcryptjs");
  const hash = bcrypt.hashSync("Admin1234!", 10);
  db.prepare("INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)").run(
    "admin@cinarli.az", hash, "Admin", "admin"
  );
  console.log("✅ Admin yaradıldı: admin@cinarli.az / Admin1234!");
}
