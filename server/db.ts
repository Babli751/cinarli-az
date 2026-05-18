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
try { db.exec("ALTER TABLE products ADD COLUMN images TEXT DEFAULT '[]'"); } catch {}
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

// Seed categories if empty
const catCount = (db.prepare("SELECT COUNT(*) as c FROM categories").get() as { c: number }).c;
if (catCount === 0) {
  const categories = [
    { name: "Topdansatış", slug: "topdansatis", icon: "🏪", description: "Topdan satış məhsulları" },
    { name: "Tekstil", slug: "tekstil", icon: "👕", description: "Tekstil məhsulları" },
    { name: "Elektronika Məhsulları", slug: "elektronika-mehsullari", icon: "⚡", description: "Elektronik cihazlar" },
    { name: "Mebel Dünyası", slug: "mebel-dunyasi", icon: "🛋️", description: "Mebel və ev dekoru" },
  ];

  for (const cat of categories) {
    db.prepare("INSERT INTO categories (name, slug, icon, description) VALUES (?, ?, ?, ?)").run(
      cat.name, cat.slug, cat.icon, cat.description
    );
  }

  // Get parent IDs for adding subcategories
  const mebel = db.prepare("SELECT id FROM categories WHERE slug = 'mebel-dunyasi'").get() as { id: number };
  const elektronika = db.prepare("SELECT id FROM categories WHERE slug = 'elektronika-mehsullari'").get() as { id: number };

  // Mebel subcategories
  const mebelSubs = [
    { name: "Kondisioner", slug: "kondisioner", icon: "❄️" },
    { name: "Kombi sistemləri", slug: "kombi-sistemleri", icon: "🔧" },
    { name: "Kombi aksesuarları", slug: "kombi-aksesuarlari", icon: "🔩" },
    { name: "Radiatorlar", slug: "radiatorlar", icon: "🌡️" },
    { name: "Su qızdırıcı kalonkalar", slug: "su-qizdiryci", icon: "💧" },
  ];

  for (const sub of mebelSubs) {
    db.prepare("INSERT INTO categories (name, slug, icon, parent_id, description) VALUES (?, ?, ?, ?, ?)").run(
      sub.name, sub.slug, sub.icon, mebel.id, ""
    );
  }

  // Elektronika subcategories
  const elektronikaSubs = [
    { name: "Telefon və aksesuarları", slug: "telefon-aksesuarlari", icon: "📱" },
    { name: "TV və Audio", slug: "tv-audio", icon: "📺" },
    { name: "Foto texnika", slug: "foto-texnika", icon: "📷" },
    { name: "Noutbuk, planşet və kompüter texnikası", slug: "noutbuk-planset-komputer", icon: "💻" },
  ];

  for (const sub of elektronikaSubs) {
    db.prepare("INSERT INTO categories (name, slug, icon, parent_id, description) VALUES (?, ?, ?, ?, ?)").run(
      sub.name, sub.slug, sub.icon, elektronika.id, ""
    );
  }

  console.log("✅ " + (categories.length + mebelSubs.length + elektronikaSubs.length) + " kateqoriya yaradıldı!");
}

// Seed mock products if empty
const prodCount = (db.prepare("SELECT COUNT(*) as c FROM products").get() as { c: number }).c;
if (prodCount === 0) {
  const mockProducts = [
    { name: "Samsung Galaxy A15", price: 4500, category: "telefon-aksesuarlari", discount: 10 },
    { name: "iPhone 15 Pro", price: 8999, category: "telefon-aksesuarlari", discount: 5 },
    { name: "Samsung 55\" 4K Smart TV", price: 3999, category: "tv-audio", discount: 15 },
    { name: "LG QLED 65\" Televizor", price: 6999, category: "tv-audio", discount: 12 },
    { name: "Sony A6700 Kamera", price: 12999, category: "foto-texnika", discount: 8 },
    { name: "Canon EOS R50 Kamera", price: 5999, category: "foto-texnika", discount: 0 },
    { name: "MacBook Pro 14\"", price: 18999, category: "noutbuk-planset-komputer", discount: 5 },
    { name: "Dell XPS 13 Laptop", price: 6999, category: "noutbuk-planset-komputer", discount: 10 },
    { name: "iPad Air 11\"", price: 7999, category: "noutbuk-planset-komputer", discount: 5 },
    { name: "Kondisioner 12000 BTU", price: 2999, category: "kondisioner", discount: 20 },
    { name: "Kombi Boyler 100L", price: 4999, category: "kombi-sistemleri", discount: 15 },
    { name: "Radiator Çelik 30cm", price: 899, category: "radiatorlar", discount: 0 },
  ];

  for (const prod of mockProducts) {
    db.prepare(
      "INSERT INTO products (name, price, discount, category_slug, stock, is_active, description) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(prod.name, prod.price, prod.discount, prod.category, 50, 1, prod.name + " - Yüksək keyfiyyət və etibarlı");
  }

  console.log("✅ " + mockProducts.length + " ərinə yaradıldı!");
}
