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

// Migrations
try { db.exec("ALTER TABLE products ADD COLUMN is_featured INTEGER DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE products ADD COLUMN most_sold INTEGER DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE products ADD COLUMN is_popular INTEGER DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE categories ADD COLUMN parent_id INTEGER DEFAULT NULL REFERENCES categories(id) ON DELETE SET NULL"); } catch {}
try { db.exec(`CREATE TABLE IF NOT EXISTS stores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '*0171',
  hours TEXT DEFAULT '10:00 — 22:00',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`); } catch {}
try { db.exec("ALTER TABLE orders ADD COLUMN user_id INTEGER DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL"); } catch {}
try { db.exec(`CREATE TABLE IF NOT EXISTS featured_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  until TEXT DEFAULT NULL,
  note TEXT DEFAULT '',
  discount INTEGER DEFAULT 0
)`); } catch {}
try { db.exec("INSERT OR IGNORE INTO featured_settings (id) VALUES (1)"); } catch {}
try { db.exec("ALTER TABLE featured_settings ADD COLUMN discount INTEGER DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE featured_settings ADD COLUMN product_ids TEXT DEFAULT '[]'"); } catch {}
try { db.exec("ALTER TABLE featured_settings ADD COLUMN credit_months INTEGER DEFAULT 24"); } catch {}
try { db.exec("ALTER TABLE categories ADD COLUMN is_hidden INTEGER DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE categories ADD COLUMN position INTEGER DEFAULT 0"); } catch {}
try { db.exec("UPDATE categories SET position = id WHERE position = 0 OR position IS NULL"); } catch {}
try { db.exec("ALTER TABLE products ADD COLUMN images TEXT DEFAULT '[]'"); } catch {}
try { db.exec("ALTER TABLE products ADD COLUMN view_count INTEGER DEFAULT 0"); } catch {}
try { db.exec(`CREATE TABLE IF NOT EXISTS wishlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, product_id)
)`); } catch {}
try { db.exec(`CREATE TABLE IF NOT EXISTS compares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, product_id)
)`); } catch {}
try { db.exec(`CREATE TABLE IF NOT EXISTS user_addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL,
  city TEXT DEFAULT '',
  is_default INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`); } catch {}

try { db.exec(`CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  date TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  UNIQUE(path, date)
)`); } catch {}
try { db.exec(`CREATE TABLE IF NOT EXISTS visitor_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  country TEXT DEFAULT '',
  country_code TEXT DEFAULT '',
  date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`); } catch {}

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
