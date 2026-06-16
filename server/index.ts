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
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || "cinarli_secret_2024";
const PORT = Number(process.env.API_PORT) || 3001;

type Vars = { user: { id: number; email: string; role: string; full_name: string } };
const app = new Hono<{ Variables: Vars }>();

app.use("*", cors({ origin: "*", allowHeaders: ["Content-Type", "Authorization"] }));

// IP geo cache — avoid hammering ip-api.com
const geoCache = new Map<string, { country: string; country_code: string }>();

async function getGeo(ip: string) {
  if (geoCache.has(ip)) return geoCache.get(ip)!;
  try {
    const r = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode`, { signal: AbortSignal.timeout(2000) });
    const d = await r.json() as { country?: string; countryCode?: string };
    const geo = { country: d.country || "", country_code: d.countryCode || "" };
    geoCache.set(ip, geo);
    return geo;
  } catch {
    return { country: "", country_code: "" };
  }
}

// Page view tracker — frontend calls this
app.post("/api/track", async (c) => {
  try {
    const { path: reqPath } = await c.req.json<{ path: string }>();
    if (!reqPath || reqPath.startsWith("/api") || reqPath.startsWith("/uploads")) return c.json({ ok: true });
    const date = new Date().toISOString().slice(0, 10);

    // Page views count
    db.prepare(`
      INSERT INTO page_views (path, date, count) VALUES (?, ?, 1)
      ON CONFLICT(path, date) DO UPDATE SET count = count + 1
    `).run(reqPath, date);

    // Visitor log with geo (fire-and-forget)
    const ip = c.req.header("x-forwarded-for")?.split(",")[0].trim()
      || c.req.header("x-real-ip")
      || "unknown";
    const ua = c.req.header("user-agent") || "";
    const hour = new Date().getHours();
    if (ip !== "unknown" && ip !== "127.0.0.1" && ip !== "::1") {
      getGeo(ip).then(geo => {
        db.prepare("INSERT INTO visitor_logs (ip, country, country_code, date, user_agent, hour) VALUES (?, ?, ?, ?, ?, ?)")
          .run(ip, geo.country, geo.country_code, date, ua, hour);
      }).catch(() => {});
    }
  } catch {}
  return c.json({ ok: true });
});
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
  const { email, password, full_name, phone } = await c.req.json();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) return c.json({ error: "Düzgün email daxil edin" }, 400);
  if (!phone || !/^\+?[0-9]{7,15}$/.test(phone.replace(/\s/g, ""))) return c.json({ error: "Mobil nömrə tələb olunur" }, 400);
  const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (exists) return c.json({ error: "Bu email artıq mövcuddur" }, 400);
  const hash = bcrypt.hashSync(password, 10);
  const count = (db.prepare("SELECT COUNT(*) as c FROM users").get() as any).c;
  const role = count === 0 ? "admin" : "user";
  const result = db.prepare("INSERT INTO users (email, password, full_name, role, phone) VALUES (?, ?, ?, ?, ?)").run(email, hash, full_name || "", role, phone);
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

app.get("/api/categories/search-index", (c) => {
  return c.json(db.prepare("SELECT id, slug, name, parent_id FROM categories ORDER BY id ASC").all());
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
  try {
    const result = db.prepare("INSERT INTO categories (slug, name, icon, description, parent_id, is_hidden, position) VALUES (?, ?, ?, ?, ?, ?, ?)").run(slug, name, icon, description || "", parent_id || null, is_hidden ? 1 : 0, maxPos + 1);
    return c.json({ id: result.lastInsertRowid });
  } catch (e: any) {
    if (e.message?.includes("UNIQUE")) return c.json({ error: "Bu slug artıq mövcuddur" }, 400);
    return c.json({ error: e.message }, 400);
  }
});

app.put("/api/categories/:id", authMiddleware, adminMiddleware, async (c) => {
  const { slug, name, description, parent_id, is_hidden, featured_product_id } = await c.req.json();
  const icon = autoIcon(name);
  try {
    db.prepare("UPDATE categories SET slug=?, name=?, icon=?, description=?, parent_id=?, is_hidden=?, featured_product_id=? WHERE id=?").run(slug, name, icon, description || "", parent_id || null, is_hidden ? 1 : 0, featured_product_id || null, c.req.param("id"));
    return c.json({ ok: true });
  } catch (e: any) {
    if (e.message?.includes("UNIQUE")) return c.json({ error: "Bu slug artıq mövcuddur" }, 400);
    return c.json({ error: e.message }, 400);
  }
});

app.delete("/api/categories/:id", authMiddleware, adminMiddleware, (c) => {
  db.prepare("DELETE FROM categories WHERE id=?").run(c.req.param("id"));
  return c.json({ ok: true });
});

// ─── PRODUCTS ───────────────────────────────────────────
app.get("/api/products", (c) => {
  const { category, active, brand } = c.req.query();
  let q = "SELECT * FROM products WHERE 1=1";
  const params: any[] = [];
  if (category) { q += " AND category_slug=?"; params.push(category); }
  if (active !== undefined) { q += " AND is_active=?"; params.push(active === "true" ? 1 : 0); }
  if (brand) { q += " AND brand_slug=?"; params.push(brand); }
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
  // manual is_popular OR top view_count — union, dedup, capped at limit
  return c.json(db.prepare(`
    SELECT * FROM products WHERE is_active=1 AND (
      is_popular=1 OR id IN (
        SELECT id FROM products WHERE is_active=1 ORDER BY view_count DESC LIMIT ?
      )
    ) ORDER BY is_popular DESC, view_count DESC LIMIT ?
  `).all(limit, limit));
});

app.put("/api/products/:id/popular", authMiddleware, adminMiddleware, async (c) => {
  const { is_popular } = await c.req.json();
  db.prepare("UPDATE products SET is_popular=? WHERE id=?").run(is_popular ? 1 : 0, c.req.param("id"));
  return c.json({ ok: true });
});

app.get("/api/products/:id", (c) => {
  const id = c.req.param("id");
  const p = db.prepare("SELECT * FROM products WHERE id=?").get(id);
  if (!p) return c.json({ error: "Tapılmadı" }, 404);
  db.prepare("UPDATE products SET view_count = COALESCE(view_count,0) + 1 WHERE id=?").run(id);
  return c.json(p);
});

app.post("/api/products", authMiddleware, adminMiddleware, async (c) => {
  const b = await c.req.json();
  const images = Array.isArray(b.images) ? JSON.stringify(b.images) : (b.images ?? "[]");
  const components = Array.isArray(b.components) ? JSON.stringify(b.components) : (b.components ?? "[]");
  const specifications = Array.isArray(b.specifications) ? JSON.stringify(b.specifications) : (b.specifications ?? "[]");
  const colors = Array.isArray(b.colors) ? JSON.stringify(b.colors) : (b.colors ?? "[]");
  const result = db.prepare("INSERT INTO products (name, price, old_price, discount, sale_price, extra_price, image, images, category_slug, brand_slug, stock, is_active, description, credit_months, interest_free, interest_rate, components, commission_free, ideal_credit_months, in_stock, specifications, colors, commission_free_months) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    b.name, b.price, b.old_price || null, b.discount || 0, b.sale_price ?? null, b.extra_price ?? null, b.image || "", images, b.category_slug || null, b.brand_slug || null, b.stock || 0, b.is_active !== false ? 1 : 0, b.description || "", b.credit_months ?? 12, b.interest_free ?? 1, b.interest_rate || 0, components, b.commission_free ? 1 : 0, b.ideal_credit_months || 0, b.in_stock ?? null, specifications, colors, b.commission_free_months || 0
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
  const components2 = Array.isArray(b.components) ? JSON.stringify(b.components) : (b.components ?? "[]");
  const specifications2 = Array.isArray(b.specifications) ? JSON.stringify(b.specifications) : (b.specifications ?? "[]");
  const colors2 = Array.isArray(b.colors) ? JSON.stringify(b.colors) : (b.colors ?? "[]");
  db.prepare("UPDATE products SET name=?, price=?, old_price=?, discount=?, sale_price=?, extra_price=?, image=?, images=?, category_slug=?, brand_slug=?, stock=?, is_active=?, description=?, credit_months=?, interest_free=?, interest_rate=?, components=?, commission_free=?, ideal_credit_months=?, in_stock=?, specifications=?, colors=?, commission_free_months=? WHERE id=?").run(
    b.name, b.price, b.old_price || null, b.discount || 0, b.sale_price ?? null, b.extra_price ?? null, b.image || "", images, b.category_slug || null, b.brand_slug || null, b.stock || 0, b.is_active !== false ? 1 : 0, b.description || "", b.credit_months ?? 12, b.interest_free ?? 1, b.interest_rate || 0, components2, b.commission_free ? 1 : 0, b.ideal_credit_months || 0, b.in_stock ?? null, specifications2, colors2, b.commission_free_months || 0, c.req.param("id")
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
  const result = db.prepare("INSERT INTO campaigns (title, description, discount_percent, image, start_date, end_date, is_active, link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
    b.title, b.description || "", b.discount_percent || 0, b.image || "", b.start_date || null, b.end_date || null, b.is_active !== false ? 1 : 0, b.link || ""
  );
  return c.json({ id: result.lastInsertRowid });
});

app.put("/api/campaigns/:id", authMiddleware, adminMiddleware, async (c) => {
  const b = await c.req.json();
  db.prepare("UPDATE campaigns SET title=?, description=?, discount_percent=?, image=?, start_date=?, end_date=?, is_active=?, link=? WHERE id=?").run(
    b.title, b.description || "", b.discount_percent || 0, b.image || "", b.start_date || null, b.end_date || null, b.is_active !== false ? 1 : 0, b.link || "", c.req.param("id")
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
  // validate promo if provided and increment usage
  let promoDiscount = 0;
  let promoCode = b.promo_code || "";
  if (promoCode) {
    const promo = db.prepare("SELECT * FROM promo_codes WHERE code=? AND is_active=1").get(promoCode.toUpperCase().trim()) as any;
    if (promo) {
      promoDiscount = promo.type === "percent" ? Math.round(b.total * promo.value / 100 * 100) / 100 : Math.min(promo.value, b.total);
      db.prepare("UPDATE promo_codes SET used_count=used_count+1 WHERE id=?").run(promo.id);
      promoCode = promo.code;
    }
  }
  const finalTotal = Math.max(0, b.total - promoDiscount);
  const result = db.prepare("INSERT INTO orders (customer_name, phone, address, total, items, notes, payment_type, credit_months, promo_code, promo_discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    b.customer_name, b.phone, b.address || "", finalTotal, JSON.stringify(b.items || []), b.notes || "", b.payment_type || "cash", b.credit_months || 0, promoCode, promoDiscount
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
  return c.json(db.prepare("SELECT id, email, full_name, role, phone, created_at FROM users ORDER BY created_at DESC").all());
});

app.delete("/api/users/:id", authMiddleware, adminMiddleware, (c) => {
  const id = Number(c.req.param("id"));
  const u = c.get("user");
  if (u.id === id) return c.json({ error: "Özünüzü silə bilməzsiniz" }, 400);
  db.prepare("DELETE FROM wishlists WHERE user_id=?").run(id);
  db.prepare("DELETE FROM compares WHERE user_id=?").run(id);
  db.prepare("DELETE FROM user_addresses WHERE user_id=?").run(id);
  db.prepare("DELETE FROM users WHERE id=?").run(id);
  return c.json({ ok: true });
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
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

app.post("/api/upload", authMiddleware, adminMiddleware, async (c) => {
  const nodeEnv = c.env as any;
  const req = nodeEnv?.incoming ?? (c as any).req.raw;
  const res = nodeEnv?.outgoing;
  return new Promise<Response>((resolve) => {
    upload.single("file")(req, res, async (err: any) => {
      if (err || !req.file) {
        resolve(c.json({ error: "Yükləmə xətası" }, 400) as any);
        return;
      }
      const filePath = req.file.path;
      try {
        const img = sharp(filePath);
        const meta = await img.metadata();
        const w = meta.width || 800;
        const h = meta.height || 600;
        // zoom 5%: resize to 105% then crop back to original
        const zoomedW = Math.round(w * 1.05);
        const zoomedH = Math.round(h * 1.05);
        const left = Math.round((zoomedW - w) / 2);
        const top = Math.round((zoomedH - h) / 2);
        const zoomed = await sharp(filePath)
          .resize(zoomedW, zoomedH, { fit: "fill" })
          .extract({ left, top, width: w, height: h })
          .toBuffer();
        const fontSize = Math.max(16, Math.round(w * 0.045));
        const text = "manqo.az";
        const svgWatermark = Buffer.from(
          `<svg width="${w}" height="${h}">
            <style>.wm { font-family: Arial, sans-serif; font-size: ${fontSize}px; font-weight: bold; fill: rgba(255,255,255,0.45); }</style>
            <text x="${w / 2}" y="${h / 2 + fontSize / 3}" text-anchor="middle" class="wm">${text}</text>
          </svg>`
        );
        const tmpPath = filePath + "_wm.jpg";
        await sharp(zoomed).composite([{ input: svgWatermark, blend: "over" }]).toFile(tmpPath);
        fs.renameSync(tmpPath, filePath);
      } catch (_) {}
      const url = `/uploads/${req.file.filename}`;
      resolve(c.json({ url }) as any);
    });
  });
});

// Promo Codes
app.get("/api/promo-codes", authMiddleware, adminMiddleware, (c) => {
  return c.json(db.prepare("SELECT * FROM promo_codes ORDER BY created_at DESC").all());
});
app.post("/api/promo-codes/validate", async (c) => {
  const { code, total } = await c.req.json();
  if (!code) return c.json({ error: "Kod daxil edin" }, 400);
  const promo = db.prepare("SELECT * FROM promo_codes WHERE code=? AND is_active=1").get(code.toUpperCase().trim()) as any;
  if (!promo) return c.json({ error: "Promokod tapılmadı və ya aktiv deyil" }, 404);
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) return c.json({ error: "Promokodun müddəti bitib" }, 400);
  if (promo.max_uses > 0 && promo.used_count >= promo.max_uses) return c.json({ error: "Promokod limiti dolub" }, 400);
  if (promo.min_order > 0 && total < promo.min_order) return c.json({ error: `Minimum sifariş məbləği ${promo.min_order} AZN` }, 400);
  const discount = promo.type === "percent" ? Math.round(total * promo.value / 100 * 100) / 100 : Math.min(promo.value, total);
  return c.json({ ok: true, code: promo.code, type: promo.type, value: promo.value, discount });
});
app.post("/api/promo-codes", authMiddleware, adminMiddleware, async (c) => {
  const d = await c.req.json();
  const code = (d.code || "").toUpperCase().trim();
  if (!code) return c.json({ error: "Kod mütləqdir" }, 400);
  const r = db.prepare("INSERT INTO promo_codes (code,type,value,min_order,max_uses,is_active,expires_at) VALUES (?,?,?,?,?,?,?)").run(
    code, d.type || "percent", d.value || 0, d.min_order || 0, d.max_uses || 0, d.is_active ?? 1, d.expires_at || null
  );
  return c.json({ id: r.lastInsertRowid });
});
app.put("/api/promo-codes/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = Number(c.req.param("id"));
  const d = await c.req.json();
  const code = d.code ? d.code.toUpperCase().trim() : undefined;
  db.prepare("UPDATE promo_codes SET code=COALESCE(?,code), type=COALESCE(?,type), value=COALESCE(?,value), min_order=COALESCE(?,min_order), max_uses=COALESCE(?,max_uses), is_active=COALESCE(?,is_active), expires_at=? WHERE id=?")
    .run(code ?? null, d.type ?? null, d.value ?? null, d.min_order ?? null, d.max_uses ?? null, d.is_active ?? null, d.expires_at ?? null, id);
  return c.json({ ok: true });
});
app.delete("/api/promo-codes/:id", authMiddleware, adminMiddleware, (c) => {
  db.prepare("DELETE FROM promo_codes WHERE id=?").run(Number(c.req.param("id")));
  return c.json({ ok: true });
});

// Credit Companies
app.get("/api/credit-companies", (c) => {
  const rows = db.prepare("SELECT * FROM credit_companies ORDER BY position, id").all();
  return c.json(rows);
});
app.get("/api/credit-companies/active", (c) => {
  const rows = db.prepare("SELECT * FROM credit_companies WHERE is_active=1 ORDER BY position, id").all();
  return c.json(rows);
});
app.post("/api/credit-companies", authMiddleware, adminMiddleware, async (c) => {
  const b = await c.req.json();
  const plans = Array.isArray(b.plans) ? JSON.stringify(b.plans) : "[]";
  const r = db.prepare("INSERT INTO credit_companies (name, logo, plans, is_active, position, type) VALUES (?,?,?,?,?,?)").run(
    b.name, b.logo || "", plans, b.is_active !== false ? 1 : 0, b.position || 0, b.type || "credit"
  );
  return c.json({ id: r.lastInsertRowid });
});
app.put("/api/credit-companies/:id", authMiddleware, adminMiddleware, async (c) => {
  const b = await c.req.json();
  const plans = Array.isArray(b.plans) ? JSON.stringify(b.plans) : "[]";
  db.prepare("UPDATE credit_companies SET name=?,logo=?,plans=?,is_active=?,position=?,type=? WHERE id=?").run(
    b.name, b.logo || "", plans, b.is_active !== false ? 1 : 0, b.position || 0, b.type || "credit", c.req.param("id")
  );
  return c.json({ ok: true });
});
app.delete("/api/credit-companies/:id", authMiddleware, adminMiddleware, (c) => {
  db.prepare("DELETE FROM credit_companies WHERE id=?").run(c.req.param("id"));
  return c.json({ ok: true });
});

// ─── STORES ─────────────────────────────────────────────
app.get("/api/stores", (c) => {
  return c.json(db.prepare("SELECT * FROM stores ORDER BY city ASC, created_at ASC").all());
});

app.post("/api/stores", authMiddleware, adminMiddleware, async (c) => {
  const b = await c.req.json();
  const result = db.prepare("INSERT INTO stores (city, name, address, phone, hours, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    b.city || "", b.name, b.address || "", b.phone || "*0171", b.hours || "10:00 — 22:00", b.lat ?? null, b.lng ?? null
  );
  return c.json({ id: result.lastInsertRowid });
});

app.put("/api/stores/:id", authMiddleware, adminMiddleware, async (c) => {
  const b = await c.req.json();
  db.prepare("UPDATE stores SET city=?, name=?, address=?, phone=?, hours=?, lat=?, lng=? WHERE id=?").run(
    b.city || "", b.name, b.address || "", b.phone || "*0171", b.hours || "10:00 — 22:00", b.lat ?? null, b.lng ?? null, c.req.param("id")
  );
  return c.json({ ok: true });
});

app.delete("/api/stores/:id", authMiddleware, adminMiddleware, (c) => {
  db.prepare("DELETE FROM stores WHERE id=?").run(c.req.param("id"));
  return c.json({ ok: true });
});

// ─── BRANDS ─────────────────────────────────────────────
app.get("/api/brands", (c) => {
  return c.json(db.prepare("SELECT * FROM brands WHERE is_active=1 ORDER BY position ASC, id ASC").all());
});

app.get("/api/brands/all", authMiddleware, adminMiddleware, (c) => {
  return c.json(db.prepare("SELECT * FROM brands ORDER BY position ASC, id ASC").all());
});

app.post("/api/brands", authMiddleware, adminMiddleware, async (c) => {
  const b = await c.req.json();
  if (!b.name) return c.json({ error: "Ad mütləqdir" }, 400);
  const slug = b.slug || b.name.toLowerCase()
    .replace(/ə/g, "e").replace(/ö/g, "o").replace(/ü/g, "u")
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ş/g, "s").replace(/ç/g, "c")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const maxPos = (db.prepare("SELECT COALESCE(MAX(position),0) as m FROM brands").get() as any).m;
  const r = db.prepare("INSERT INTO brands (slug, name, logo, position, is_active) VALUES (?, ?, ?, ?, ?)").run(slug, b.name, b.logo || "", maxPos + 1, b.is_active ?? 1);
  return c.json({ id: r.lastInsertRowid });
});

app.put("/api/brands/:id", authMiddleware, adminMiddleware, async (c) => {
  const b = await c.req.json();
  db.prepare("UPDATE brands SET name=?, logo=?, is_active=?, slug=? WHERE id=?").run(b.name, b.logo || "", b.is_active ?? 1, b.slug, Number(c.req.param("id")));
  return c.json({ ok: true });
});

app.delete("/api/brands/:id", authMiddleware, adminMiddleware, (c) => {
  db.prepare("DELETE FROM brands WHERE id=?").run(c.req.param("id"));
  return c.json({ ok: true });
});

// ─── BANNERS ────────────────────────────────────────────
app.get("/api/banners", (c) => {
  return c.json(db.prepare("SELECT * FROM banners WHERE is_active=1 ORDER BY position ASC").all());
});

app.get("/api/banners/all", authMiddleware, adminMiddleware, (c) => {
  return c.json(db.prepare("SELECT * FROM banners ORDER BY position ASC").all());
});

app.post("/api/banners", authMiddleware, adminMiddleware, async (c) => {
  const { image } = await c.req.json<{ image: string }>();
  const pos = (db.prepare("SELECT COALESCE(MAX(position),0)+1 as p FROM banners").get() as any).p;
  const r = db.prepare("INSERT INTO banners (image, position) VALUES (?,?)").run(image, pos);
  return c.json(db.prepare("SELECT * FROM banners WHERE id=?").get(r.lastInsertRowid));
});

app.put("/api/banners/:id", authMiddleware, adminMiddleware, async (c) => {
  const { image, position, is_active } = await c.req.json<{ image?: string; position?: number; is_active?: number }>();
  const id = c.req.param("id");
  if (image !== undefined) db.prepare("UPDATE banners SET image=? WHERE id=?").run(image, id);
  if (position !== undefined) db.prepare("UPDATE banners SET position=? WHERE id=?").run(position, id);
  if (is_active !== undefined) db.prepare("UPDATE banners SET is_active=? WHERE id=?").run(is_active, id);
  return c.json(db.prepare("SELECT * FROM banners WHERE id=?").get(id));
});

app.delete("/api/banners/:id", authMiddleware, adminMiddleware, (c) => {
  db.prepare("DELETE FROM banners WHERE id=?").run(c.req.param("id"));
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

app.get("/api/page-views", authMiddleware, adminMiddleware, (c) => {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);

  const todayViews = (db.prepare("SELECT COALESCE(SUM(count),0) as s FROM page_views WHERE date=?").get(today) as any).s;
  const weekViews = (db.prepare("SELECT COALESCE(SUM(count),0) as s FROM page_views WHERE date>=?").get(weekAgo) as any).s;
  const totalViews = (db.prepare("SELECT COALESCE(SUM(count),0) as s FROM page_views").get() as any).s;

  const topPages = db.prepare(`
    SELECT path, SUM(count) as total FROM page_views
    WHERE date >= ? GROUP BY path ORDER BY total DESC LIMIT 10
  `).all(weekAgo) as { path: string; total: number }[];

  const daily = db.prepare(`
    SELECT date, SUM(count) as total FROM page_views
    WHERE date >= ? GROUP BY date ORDER BY date ASC
  `).all(weekAgo) as { date: string; total: number }[];

  // Unique visitors
  const todayUnique = (db.prepare("SELECT COUNT(DISTINCT ip) as c FROM visitor_logs WHERE date=?").get(today) as any).c;
  const weekUnique = (db.prepare("SELECT COUNT(DISTINCT ip) as c FROM visitor_logs WHERE date>=?").get(weekAgo) as any).c;
  const totalUnique = (db.prepare("SELECT COUNT(DISTINCT ip) as c FROM visitor_logs").get() as any).c;

  // Top countries (last 7 days)
  const topCountries = db.prepare(`
    SELECT country, country_code, COUNT(DISTINCT ip) as visitors FROM visitor_logs
    WHERE date >= ? AND country != '' GROUP BY country ORDER BY visitors DESC LIMIT 8
  `).all(weekAgo) as { country: string; country_code: string; visitors: number }[];

  // Azerbaijan stats
  const azToday = (db.prepare("SELECT COUNT(DISTINCT ip) as c FROM visitor_logs WHERE date=? AND country_code='AZ'").get(today) as any).c;
  const azWeek = (db.prepare("SELECT COUNT(DISTINCT ip) as c FROM visitor_logs WHERE date>=? AND country_code='AZ'").get(weekAgo) as any).c;
  const azTotal = (db.prepare("SELECT COUNT(DISTINCT ip) as c FROM visitor_logs WHERE country_code='AZ'").get() as any).c;

  // Hourly traffic today (0-23)
  const hourlyRaw = db.prepare(`
    SELECT hour, COUNT(DISTINCT ip) as visitors FROM visitor_logs
    WHERE date=? GROUP BY hour ORDER BY hour ASC
  `).all(today) as { hour: number; visitors: number }[];
  const hourly: number[] = Array(24).fill(0);
  for (const r of hourlyRaw) hourly[r.hour] = r.visitors;

  // Device breakdown (last 7 days) — user_agent heuristic
  const uaRows = db.prepare(`
    SELECT user_agent FROM visitor_logs WHERE date>=? AND user_agent!=''
  `).all(weekAgo) as { user_agent: string }[];
  let mobile = 0, tablet = 0, desktop = 0;
  for (const { user_agent: ua } of uaRows) {
    const u = ua.toLowerCase();
    if (/tablet|ipad/.test(u)) tablet++;
    else if (/mobile|android|iphone|ipod/.test(u)) mobile++;
    else desktop++;
  }

  // Monthly revenue (last 30 days)
  const monthlyRevenue = db.prepare(`
    SELECT date(created_at) as day, SUM(total) as revenue
    FROM orders WHERE date(created_at)>=? AND status!='cancelled'
    GROUP BY day ORDER BY day ASC
  `).all(monthAgo) as { day: string; revenue: number }[];

  // New users
  const newUsersToday = (db.prepare("SELECT COUNT(*) as c FROM users WHERE date(created_at)=?").get(today) as any).c;
  const newUsersWeek = (db.prepare("SELECT COUNT(*) as c FROM users WHERE date(created_at)>=?").get(weekAgo) as any).c;

  // Conversion rate (orders this week / unique visitors this week)
  const ordersWeek = (db.prepare("SELECT COUNT(*) as c FROM orders WHERE date(created_at)>=?").get(weekAgo) as any).c;
  const conversionRate = weekUnique > 0 ? +((ordersWeek / weekUnique) * 100).toFixed(1) : 0;

  return c.json({
    todayViews, weekViews, totalViews,
    topPages, daily,
    todayUnique, weekUnique, totalUnique,
    topCountries,
    azToday, azWeek, azTotal,
    hourly,
    devices: { mobile, tablet, desktop },
    monthlyRevenue,
    newUsersToday, newUsersWeek,
    conversionRate,
    ordersWeek,
  });
});

// ─── REVIEWS ─────────────────────────────────────────────
app.get("/api/products/:id/reviews", (c) => {
  const rows = db.prepare("SELECT * FROM product_reviews WHERE product_id=? AND is_approved=1 ORDER BY created_at DESC").all(c.req.param("id"));
  return c.json(rows);
});

app.post("/api/products/:id/reviews", async (c) => {
  const b = await c.req.json();
  if (!b.body?.trim()) return c.json({ error: "Rəy mətni boşdur" }, 400);
  const rating = Math.min(5, Math.max(1, Number(b.rating) || 5));
  const result = db.prepare("INSERT INTO product_reviews (product_id, author_name, rating, body) VALUES (?, ?, ?, ?)").run(
    c.req.param("id"), b.author_name?.trim() || "Anonim", rating, b.body.trim()
  );
  return c.json({ id: result.lastInsertRowid });
});

app.delete("/api/reviews/:id", authMiddleware, adminMiddleware, (c) => {
  db.prepare("DELETE FROM product_reviews WHERE id=?").run(Number(c.req.param("id")));
  return c.json({ ok: true });
});

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`API server: http://localhost:${PORT}`);
});
