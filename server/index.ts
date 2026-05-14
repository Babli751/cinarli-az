import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import jwt from "jsonwebtoken";
const { sign, verify } = jwt;
import bcrypt from "bcryptjs";
import { db } from "./db.ts";
import { serveStatic } from "@hono/node-server/serve-static";
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
app.use("/uploads/*", serveStatic({ root: path.join(__dirname, "..") }));

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
  return c.json({ user: c.get("user") });
});

// ─── CATEGORIES ─────────────────────────────────────────
app.get("/api/categories", (c) => {
  return c.json(db.prepare("SELECT * FROM categories ORDER BY created_at DESC").all());
});

app.post("/api/categories", authMiddleware, adminMiddleware, async (c) => {
  const { slug, name, icon, description } = await c.req.json();
  const result = db.prepare("INSERT INTO categories (slug, name, icon, description) VALUES (?, ?, ?, ?)").run(slug, name, icon || "📦", description || "");
  return c.json({ id: result.lastInsertRowid });
});

app.put("/api/categories/:id", authMiddleware, adminMiddleware, async (c) => {
  const { slug, name, icon, description } = await c.req.json();
  db.prepare("UPDATE categories SET slug=?, name=?, icon=?, description=? WHERE id=?").run(slug, name, icon, description, c.req.param("id"));
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
  const p = db.prepare("SELECT * FROM products WHERE is_featured=1 AND is_active=1 LIMIT 1").get();
  if (!p) return c.json(null);
  return c.json(p);
});

app.get("/api/products/:id", (c) => {
  const p = db.prepare("SELECT * FROM products WHERE id=?").get(c.req.param("id"));
  if (!p) return c.json({ error: "Tapılmadı" }, 404);
  return c.json(p);
});

app.post("/api/products", authMiddleware, adminMiddleware, async (c) => {
  const b = await c.req.json();
  const result = db.prepare("INSERT INTO products (name, price, old_price, discount, image, category_slug, stock, is_active, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    b.name, b.price, b.old_price || null, b.discount || 0, b.image || "", b.category_slug || null, b.stock || 0, b.is_active !== false ? 1 : 0, b.description || ""
  );
  return c.json({ id: result.lastInsertRowid });
});

app.put("/api/products/:id", authMiddleware, adminMiddleware, async (c) => {
  const b = await c.req.json();
  db.prepare("UPDATE products SET name=?, price=?, old_price=?, discount=?, image=?, category_slug=?, stock=?, is_active=?, description=? WHERE id=?").run(
    b.name, b.price, b.old_price || null, b.discount || 0, b.image || "", b.category_slug || null, b.stock || 0, b.is_active !== false ? 1 : 0, b.description || "", c.req.param("id")
  );
  return c.json({ ok: true });
});

app.delete("/api/products/:id", authMiddleware, adminMiddleware, (c) => {
  db.prepare("DELETE FROM products WHERE id=?").run(c.req.param("id"));
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
