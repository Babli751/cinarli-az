import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import jwt from "jsonwebtoken";
const { sign, verify } = jwt;
import bcrypt from "bcryptjs";
import { db } from "./db.ts";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import type { Context, Next } from "hono";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || "cinarli_secret_2024";
const PORT = Number(process.env.API_PORT) || 3001;

type Vars = { user: { id: number; email: string; role: string; full_name: string } };
const app = new Hono<{ Variables: Vars }>();

app.use("*", cors({ origin: "*", allowHeaders: ["Content-Type", "Authorization"] }));
app.get("/uploads/:filename", async (c) => {
  const filename = c.req.param("filename");
  const filePath = path.join(__dirname, "uploads", filename);
  if (!fs.existsSync(filePath)) return c.notFound();
  const ext = path.extname(filename).toLowerCase();
  const mime: Record<string, string> = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
    ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
  };
  const data = fs.readFileSync(filePath);
  return new Response(data, { headers: { "Content-Type": mime[ext] || "application/octet-stream", "Cache-Control": "public, max-age=31536000" } });
});

async function authMiddleware(c: Context<{ Variables: Vars }>, next: Next) {
  const header = c.req.header("Authorization");
  if (!header) return c.json({ error: "Unauthorized" }, 401);
  try {
    const token = header.replace("Bearer ", "");
    const payload = verify(token, JWT_SECRET) as Vars["user"];
    c.set("user", payload);
    return next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
}

async function adminMiddleware(c: Context<{ Variables: Vars }>, next: Next) {
  const user = c.get("user");
  if (user?.role !== "admin") return c.json({ error: "Forbidden" }, 403);
  return next();
}

// ─── AUTH ───────────────────────────────────────────────
app.post("/api/auth/login", async (c) => {
  const { email, password } = await c.req.json();
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
  if (!user || !bcrypt.compareSync(password, user.password))
    return c.json({ error: "Email və ya şifrə yanlışdır" }, 401);
  const token = sign({ id: user.id, email: user.email, role: user.role, full_name: user.full_name }, JWT_SECRET, { expiresIn: "7d" });
  return c.json({ token, user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name } });
});

app.post("/api/auth/register", async (c) => {
  const { email, password, full_name } = await c.req.json();
  const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (exists) return c.json({ error: "Bu email artıq mövcuddur" }, 400);
  const hash = bcrypt.hashSync(password, 10);
  const count = (db.prepare("SELECT COUNT(*) as c FROM users").get() as any).c;
  const role = count === 0 ? "admin" : "user";
  const result = db.prepare("INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)").run(email, hash, full_name || "", role);
  const token = sign({ id: result.lastInsertRowid, email, role, full_name: full_name || "" }, JWT_SECRET, { expiresIn: "7d" });
  return c.json({ token, user: { id: result.lastInsertRowid, email, role, full_name: full_name || "" } });
});

app.get("/api/auth/me", authMiddleware, (c) => {
  const u = c.get("user");
  const row = db.prepare("SELECT id, email, full_name, role, created_at FROM users WHERE id=?").get(u.id) as any;
  return c.json({ user: row });
});

app.put("/api/auth/profile", authMiddleware, async (c) => {
  const u = c.get("user");
  const b = await c.req.json();
  if (b.full_name !== undefined) {
    db.prepare("UPDATE users SET full_name=? WHERE id=?").run(b.full_name, u.id);
  }
  if (b.password && b.new_password) {
    const row = db.prepare("SELECT password FROM users WHERE id=?").get(u.id) as any;
    if (!bcrypt.compareSync(b.password, row.password))
      return c.json({ error: "Mövcud şifrə yanlışdır" }, 400);
    db.prepare("UPDATE users SET password=? WHERE id=?").run(bcrypt.hashSync(b.new_password, 10), u.id);
  }
  const updated = db.prepare("SELECT id, email, full_name, role FROM users WHERE id=?").get(u.id) as any;
  return c.json({ user: updated });
});

// ─── MY ORDERS ──────────────────────────────────────────
app.get("/api/me/orders", authMiddleware, (c) => {
  const u = c.get("user");
  return c.json(db.prepare("SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC").all(u.id));
});

// ─── WISHLIST ───────────────────────────────────────────
app.get("/api/me/wishlist", authMiddleware, (c) => {
  const u = c.get("user");
  const rows = db.prepare(`
    SELECT p.*, w.id as wishlist_id FROM wishlists w
    JOIN products p ON p.id = w.product_id
    WHERE w.user_id=? ORDER BY w.created_at DESC
  `).all(u.id);
  return c.json(rows);
});

app.post("/api/me/wishlist", authMiddleware, async (c) => {
  const u = c.get("user");
  const { product_id } = await c.req.json();
  try {
    db.prepare("INSERT INTO wishlists (user_id, product_id) VALUES (?,?)").run(u.id, product_id);
  } catch { }
  return c.json({ ok: true });
});

app.delete("/api/me/wishlist/:product_id", authMiddleware, (c) => {
  const u = c.get("user");
  db.prepare("DELETE FROM wishlists WHERE user_id=? AND product_id=?").run(u.id, c.req.param("product_id"));
  return c.json({ ok: true });
});

// ─── COMPARE ────────────────────────────────────────────
app.get("/api/me/compare", authMiddleware, (c) => {
  const u = c.get("user");
  const rows = db.prepare(`
    SELECT p.* FROM compares cp
    JOIN products p ON p.id = cp.product_id
    WHERE cp.user_id=? ORDER BY cp.created_at DESC
  `).all(u.id);
  return c.json(rows);
});

app.post("/api/me/compare", authMiddleware, async (c) => {
  const u = c.get("user");
  const { product_id } = await c.req.json();
  const count = (db.prepare("SELECT COUNT(*) as c FROM compares WHERE user_id=?").get(u.id) as any).c;
  if (count >= 4) return c.json({ error: "Maksimum 4 məhsul müqayisə edilə bilər" }, 400);
  try {
    db.prepare("INSERT INTO compares (user_id, product_id) VALUES (?,?)").run(u.id, product_id);
  } catch { }
  return c.json({ ok: true });
});

app.delete("/api/me/compare/:product_id", authMiddleware, (c) => {
  const u = c.get("user");
  db.prepare("DELETE FROM compares WHERE user_id=? AND product_id=?").run(u.id, c.req.param("product_id"));
  return c.json({ ok: true });
});

// ─── USER ADDRESSES ─────────────────────────────────────
app.get("/api/me/addresses", authMiddleware, (c) => {
  const u = c.get("user");
  return c.json(db.prepare("SELECT * FROM user_addresses WHERE user_id=? ORDER BY is_default DESC, created_at DESC").all(u.id));
});

app.post("/api/me/addresses", authMiddleware, async (c) => {
  const u = c.get("user");
  const b = await c.req.json();
  if (b.is_default) db.prepare("UPDATE user_addresses SET is_default=0 WHERE user_id=?").run(u.id);
  const result = db.prepare("INSERT INTO user_addresses (user_id, title, address, city, is_default) VALUES (?,?,?,?,?)").run(
    u.id, b.title || "", b.address, b.city || "", b.is_default ? 1 : 0
  );
  return c.json({ id: result.lastInsertRowid });
});

app.put("/api/me/addresses/:id", authMiddleware, async (c) => {
  const u = c.get("user");
  const b = await c.req.json();
  if (b.is_default) db.prepare("UPDATE user_addresses SET is_default=0 WHERE user_id=?").run(u.id);
  db.prepare("UPDATE user_addresses SET title=?, address=?, city=?, is_default=? WHERE id=? AND user_id=?").run(
    b.title || "", b.address, b.city || "", b.is_default ? 1 : 0, c.req.param("id"), u.id
  );
  return c.json({ ok: true });
});

app.delete("/api/me/addresses/:id", authMiddleware, (c) => {
  const u = c.get("user");
  db.prepare("DELETE FROM user_addresses WHERE id=? AND user_id=?").run(c.req.param("id"), u.id);
  return c.json({ ok: true });
});

// ─── CATEGORIES ─────────────────────────────────────────
app.get("/api/categories", (c) => {
  return c.json(db.prepare("SELECT * FROM categories WHERE is_hidden=0 ORDER BY position ASC, id ASC").all());
});

app.get("/api/categories/all", authMiddleware, adminMiddleware, (c) => {
  return c.json(db.prepare("SELECT * FROM categories ORDER BY position ASC, id ASC").all());
});

function autoIcon(name: string): string {
  const n = name.toLowerCase()
    .replace(/ə/g, "e").replace(/ö/g, "o").replace(/ü/g, "u")
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ş/g, "s").replace(/ç/g, "c");
  if (n.includes("divan") || n.includes("kunc") || n.includes("kose") || n.includes("yumsaq") || n.includes("yums")) return "🛋️";
  if (n.includes("yataq") || n.includes("carpay") || n.includes("dosat") || n.includes("baza")) return "🛏️";
  if (n.includes("metbex") || n.includes("metbex") || n.includes("mutfaq") || n.includes("asxana")) return "🍳";
  if (n.includes("masa") || n.includes("stol") || n.includes("sehpa") || n.includes("cofre")) return "🪵";
  if (n.includes("stul") || n.includes("kreslo") || n.includes("oturacaq")) return "💺";
  if (n.includes("skaf") || n.includes("dolap") || n.includes("sifaretci") || n.includes("komod") || n.includes("sandiq")) return "🗄️";
  if (n.includes("usaq") || n.includes("cocuq") || n.includes("kids") || n.includes("bebek")) return "🧸";
  if (n.includes("ofis") || n.includes("is otagi") || n.includes("kabinet") || n.includes("is yeri")) return "💼";
  if (n.includes("hamam") || n.includes("banyo") || n.includes("tualet")) return "🚿";
  if (n.includes("dekor") || n.includes("aksesuar") || n.includes("beze") || n.includes("panel")) return "🏺";
  if (n.includes("isiq") || n.includes("lamp") || n.includes("avize") || n.includes("candel")) return "💡";
  if (n.includes("xalca") || n.includes("hali") || n.includes("kilim") || n.includes("palaz")) return "🟫";
  if (n.includes("bagca") || n.includes("bahce") || n.includes("terras") || n.includes("garden")) return "🌿";
  if (n.includes("perde") || n.includes("pardo") || n.includes("cortain")) return "🪟";
  if (n.includes("yastiq") || n.includes("yorgan") || n.includes("doset")) return "🛌";
  if (n.includes("raf") || n.includes("kitab") || n.includes("kitabxana")) return "📚";
  if (n.includes("ayna") || n.includes("guzu") || n.includes("sergi")) return "🪞";
  if (n.includes("balkon") || n.includes("veranda")) return "🏠";
  if (n.includes("kicik") || n.includes("mini") || n.includes("kompakt")) return "📦";
  return "📦";
}

app.put("/api/categories/:id/reorder", authMiddleware, adminMiddleware, async (c) => {
  const { direction } = await c.req.json<{ direction: "up" | "down" }>();
  const id = Number(c.req.param("id"));
  const current = db.prepare("SELECT * FROM categories WHERE id=?").get(id) as any;
  if (!current) return c.json({ error: "Not found" }, 404);
  const sibling = direction === "up"
    ? db.prepare("SELECT * FROM categories WHERE position < ? AND (parent_id IS ? OR parent_id = ?) ORDER BY position DESC LIMIT 1").get(current.position, current.parent_id, current.parent_id) as any
    : db.prepare("SELECT * FROM categories WHERE position > ? AND (parent_id IS ? OR parent_id = ?) ORDER BY position ASC LIMIT 1").get(current.position, current.parent_id, current.parent_id) as any;
  if (!sibling) return c.json({ ok: true });
  db.prepare("UPDATE categories SET position=? WHERE id=?").run(sibling.position, current.id);
  db.prepare("UPDATE categories SET position=? WHERE id=?").run(current.position, sibling.id);
  return c.json({ ok: true });
});

app.post("/api/categories", authMiddleware, adminMiddleware, async (c) => {
  const { slug, name, description, parent_id, is_hidden } = await c.req.json();
  const icon = autoIcon(name);
  const maxPos = (db.prepare("SELECT MAX(position) as m FROM categories").get() as any)?.m || 0;
  const result = db.prepare("INSERT INTO categories (slug, name, icon, description, parent_id, is_hidden, position) VALUES (?, ?, ?, ?, ?, ?, ?)").run(slug, name, icon, description || "", parent_id || null, is_hidden ? 1 : 0, maxPos + 1);
  return c.json({ id: result.lastInsertRowid });
});

app.put("/api/categories/:id", authMiddleware, adminMiddleware, async (c) => {
  const { slug, name, description, parent_id, is_hidden } = await c.req.json();
  const icon = autoIcon(name);
  db.prepare("UPDATE categories SET slug=?, name=?, icon=?, description=?, parent_id=?, is_hidden=? WHERE id=?").run(slug, name, icon, description, parent_id || null, is_hidden ? 1 : 0, c.req.param("id"));
  return c.json({ ok: true });
});

app.delete("/api/categories/:id", authMiddleware, adminMiddleware, (c) => {
  db.prepare("DELETE FROM categories WHERE id=?").run(c.req.param("id"));
  return c.json({ ok: true });
});

// ─── PRODUCTS ───────────────────────────────────────────
app.get("/api/products", (c) => {
  const { category, active } = c.req.query();
  let q = "SELECT * FROM products WHERE 1=1";
  const params: any[] = [];
  if (category) { q += " AND category_slug=?"; params.push(category); }
  if (active !== undefined) { q += " AND is_active=?"; params.push(active === "true" ? 1 : 0); }
  q += " ORDER BY created_at DESC";
  return c.json(db.prepare(q).all(...params));
});

app.get("/api/products/featured", (c) => {
  const fs = db.prepare("SELECT * FROM featured_settings WHERE id=1").get() as any;
  const items: { id: number; discount?: number; credit_months?: number; until?: string | null }[] = (() => {
    try {
      const parsed = JSON.parse(fs?.product_ids || "[]");
      if (Array.isArray(parsed) && parsed.length && typeof parsed[0] === "object") return parsed;
      if (Array.isArray(parsed) && parsed.length && typeof parsed[0] === "number") {
        return parsed.map((id: number) => ({ id, discount: fs?.discount || 0, credit_months: fs?.credit_months || 24, until: fs?.until || null }));
      }
      return [];
    } catch { return []; }
  })();
  if (items.length > 0) {
    const ids = items.map(i => i.id);
    const placeholders = ids.map(() => "?").join(",");
    const rows = db.prepare(`SELECT * FROM products WHERE id IN (${placeholders}) AND is_active=1`).all(...ids) as any[];
    return c.json(rows.map(p => {
      const item = items.find(i => i.id === p.id) || {};
      return Object.assign({}, p, {
        _discount: (item as any).discount ?? 0,
        _credit_months: (item as any).credit_months ?? 24,
        _until: (item as any).until ?? null,
        _note: fs?.note || "",
      });
    }));
  }
  return c.json([]);
});

app.get("/api/products/most-sold", (c) => {
  const limit = Number(c.req.query("limit") || 12);
  return c.json(db.prepare("SELECT * FROM products WHERE is_active=1 AND most_sold=1 ORDER BY created_at DESC LIMIT ?").all(limit));
});

app.put("/api/products/:id/most-sold", authMiddleware, adminMiddleware, async (c) => {
  const { most_sold } = await c.req.json();
  db.prepare("UPDATE products SET most_sold=? WHERE id=?").run(most_sold ? 1 : 0, c.req.param("id"));
  return c.json({ ok: true });
});

app.get("/api/products/popular", (c) => {
  const limit = Number(c.req.query("limit") || 12);
  return c.json(db.prepare("SELECT * FROM products WHERE is_active=1 AND is_popular=1 ORDER BY created_at DESC LIMIT ?").all(limit));
});

app.put("/api/products/:id/popular", authMiddleware, adminMiddleware, async (c) => {
  const { is_popular } = await c.req.json();
  db.prepare("UPDATE products SET is_popular=? WHERE id=?").run(is_popular ? 1 : 0, c.req.param("id"));
  return c.json({ ok: true });
});

app.get("/api/products/:id", (c) => {
  const p = db.prepare("SELECT * FROM products WHERE id=?").get(c.req.param("id"));
  if (!p) return c.json({ error: "Tapılmadı" }, 404);
  return c.json(p);
});

app.post("/api/products", authMiddleware, adminMiddleware, async (c) => {
  const b = await c.req.json();
  const images = Array.isArray(b.images) ? JSON.stringify(b.images) : "[]";
  const result = db.prepare("INSERT INTO products (name, price, old_price, discount, image, images, category_slug, stock, is_active, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    b.name, b.price, b.old_price || null, b.discount || 0, b.image || "", images, b.category_slug || null, b.stock || 0, b.is_active !== false ? 1 : 0, b.description || ""
  );
  return c.json({ id: result.lastInsertRowid });
});

app.put("/api/products/:id", authMiddleware, adminMiddleware, async (c) => {
  const b = await c.req.json();
  let images: string;
  if (Array.isArray(b.images)) {
    images = JSON.stringify(b.images);
  } else if (typeof b.images === "string" && b.images.startsWith("[")) {
    images = b.images;
  } else {
    const existing = db.prepare("SELECT images FROM products WHERE id=?").get(c.req.param("id")) as any;
    images = existing?.images || "[]";
  }
  db.prepare("UPDATE products SET name=?, price=?, old_price=?, discount=?, image=?, images=?, category_slug=?, stock=?, is_active=?, description=? WHERE id=?").run(
    b.name, b.price, b.old_price || null, b.discount || 0, b.image || "", images, b.category_slug || null, b.stock || 0, b.is_active !== false ? 1 : 0, b.description || "", c.req.param("id")
  );
  return c.json({ ok: true });
});

app.delete("/api/products/:id", authMiddleware, adminMiddleware, (c) => {
  db.prepare("DELETE FROM products WHERE id=?").run(c.req.param("id"));
  return c.json({ ok: true });
});

app.get("/api/featured-settings", authMiddleware, adminMiddleware, (c) => {
  const fs = db.prepare("SELECT * FROM featured_settings WHERE id=1").get() as any;
  const items: { id: number; discount?: number; credit_months?: number; until?: string | null }[] = (() => {
    try {
      const parsed = JSON.parse(fs?.product_ids || "[]");
      if (Array.isArray(parsed) && parsed.length && typeof parsed[0] === "object") return parsed;
      if (Array.isArray(parsed) && parsed.length && typeof parsed[0] === "number")
        return parsed.map((id: number) => ({ id }));
      return [];
    } catch { return []; }
  })();
  const ids = items.map(i => i.id);
  const featured_products = ids.length
    ? db.prepare(`SELECT id, name, price, old_price, discount, image, stock FROM products WHERE id IN (${ids.map(() => "?").join(",")})`).all(...ids)
    : [];
  return c.json({ ...(fs || {}), product_items: items, featured_products });
});

app.put("/api/featured-settings", authMiddleware, adminMiddleware, async (c) => {
  const b = await c.req.json();
  const items: { id: number; discount?: number; credit_months?: number; until?: string | null }[] =
    Array.isArray(b.product_items) ? b.product_items : [];
  const ids = items.map(i => i.id);
  db.prepare("UPDATE featured_settings SET product_ids=?, until=?, note=?, discount=?, credit_months=? WHERE id=1").run(
    JSON.stringify(items), b.until || null, b.note || "", 0, 24
  );
  db.prepare("UPDATE products SET is_featured=0").run();
  if (ids.length) {
    const ph = ids.map(() => "?").join(",");
    db.prepare(`UPDATE products SET is_featured=1 WHERE id IN (${ph})`).run(...ids);
  }
  return c.json({ ok: true });
});

app.put("/api/products/:id/featured", authMiddleware, adminMiddleware, async (c) => {
  const { is_featured } = await c.req.json();
  if (is_featured) db.prepare("UPDATE products SET is_featured=0").run();
  db.prepare("UPDATE products SET is_featured=? WHERE id=?").run(is_featured ? 1 : 0, c.req.param("id"));
  return c.json({ ok: true });
});

// ─── CAMPAIGNS ──────────────────────────────────────────
app.get("/api/campaigns", (c) => {
  return c.json(db.prepare("SELECT * FROM campaigns ORDER BY created_at DESC").all());
});

app.post("/api/campaigns", authMiddleware, adminMiddleware, async (c) => {
  const b = await c.req.json();
  const result = db.prepare("INSERT INTO campaigns (title, description, discount_percent, image, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    b.title, b.description || "", b.discount_percent || 0, b.image || "", b.start_date || null, b.end_date || null, b.is_active !== false ? 1 : 0
  );
  return c.json({ id: result.lastInsertRowid });
});

app.put("/api/campaigns/:id", authMiddleware, adminMiddleware, async (c) => {
  const b = await c.req.json();
  db.prepare("UPDATE campaigns SET title=?, description=?, discount_percent=?, image=?, start_date=?, end_date=?, is_active=? WHERE id=?").run(
    b.title, b.description || "", b.discount_percent || 0, b.image || "", b.start_date || null, b.end_date || null, b.is_active !== false ? 1 : 0, c.req.param("id")
  );
  return c.json({ ok: true });
});

app.delete("/api/campaigns/:id", authMiddleware, adminMiddleware, (c) => {
  db.prepare("DELETE FROM campaigns WHERE id=?").run(c.req.param("id"));
  return c.json({ ok: true });
});

// ─── ORDERS ─────────────────────────────────────────────
app.get("/api/orders", authMiddleware, adminMiddleware, (c) => {
  return c.json(db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all());
});

app.post("/api/orders", async (c) => {
  const b = await c.req.json();
  const result = db.prepare("INSERT INTO orders (customer_name, phone, address, total, items, notes) VALUES (?, ?, ?, ?, ?, ?)").run(
    b.customer_name, b.phone, b.address || "", b.total, JSON.stringify(b.items || []), b.notes || ""
  );
  return c.json({ id: result.lastInsertRowid });
});

app.put("/api/orders/:id/status", authMiddleware, adminMiddleware, async (c) => {
  const { status } = await c.req.json();
  db.prepare("UPDATE orders SET status=? WHERE id=?").run(status, c.req.param("id"));
  return c.json({ ok: true });
});

app.delete("/api/orders/:id", authMiddleware, adminMiddleware, (c) => {
  db.prepare("DELETE FROM orders WHERE id=?").run(c.req.param("id"));
  return c.json({ ok: true });
});

// ─── USERS ──────────────────────────────────────────────
app.get("/api/users", authMiddleware, adminMiddleware, (c) => {
  return c.json(db.prepare("SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC").all());
});

app.put("/api/users/:id/role", authMiddleware, adminMiddleware, async (c) => {
  const { role } = await c.req.json();
  db.prepare("UPDATE users SET role=? WHERE id=?").run(role, c.req.param("id"));
  return c.json({ ok: true });
});

// ─── UPLOAD ─────────────────────────────────────────────
const uploadsDir = path.join(__dirname, "../server/uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.post("/api/upload", authMiddleware, adminMiddleware, async (c) => {
  const nodeEnv = c.env as any;
  const req = nodeEnv?.incoming ?? (c as any).req.raw;
  const res = nodeEnv?.outgoing;
  return new Promise<Response>((resolve) => {
    upload.single("file")(req, res, (err: any) => {
      if (err || !req.file) {
        resolve(c.json({ error: "Yükləmə xətası" }, 400) as any);
        return;
      }
      const url = `/uploads/${req.file.filename}`;
      resolve(c.json({ url }) as any);
    });
  });
});

// ─── STORES ─────────────────────────────────────────────
app.get("/api/stores", (c) => {
  return c.json(db.prepare("SELECT * FROM stores ORDER BY city ASC, created_at ASC").all());
});

app.post("/api/stores", authMiddleware, adminMiddleware, async (c) => {
  const b = await c.req.json();
  const result = db.prepare("INSERT INTO stores (city, name, address, phone, hours) VALUES (?, ?, ?, ?, ?)").run(
    b.city || "", b.name, b.address || "", b.phone || "*0171", b.hours || "10:00 — 22:00"
  );
  return c.json({ id: result.lastInsertRowid });
});

app.put("/api/stores/:id", authMiddleware, adminMiddleware, async (c) => {
  const b = await c.req.json();
  db.prepare("UPDATE stores SET city=?, name=?, address=?, phone=?, hours=? WHERE id=?").run(
    b.city || "", b.name, b.address || "", b.phone || "*0171", b.hours || "10:00 — 22:00", c.req.param("id")
  );
  return c.json({ ok: true });
});

app.delete("/api/stores/:id", authMiddleware, adminMiddleware, (c) => {
  db.prepare("DELETE FROM stores WHERE id=?").run(c.req.param("id"));
  return c.json({ ok: true });
});

// ─── STATS ──────────────────────────────────────────────
app.get("/api/stats", authMiddleware, adminMiddleware, (c) => {
  const products = (db.prepare("SELECT COUNT(*) as c FROM products").get() as any).c;
  const orders = (db.prepare("SELECT COUNT(*) as c FROM orders").get() as any).c;
  const users = (db.prepare("SELECT COUNT(*) as c FROM users").get() as any).c;
  const revenue = (db.prepare("SELECT COALESCE(SUM(total),0) as s FROM orders WHERE status != 'cancelled'").get() as any).s;
  const pending = (db.prepare("SELECT COUNT(*) as c FROM orders WHERE status='pending'").get() as any).c;
  return c.json({ products, orders, users, revenue, pending });
});

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`API server: http://localhost:${PORT}`);
});
