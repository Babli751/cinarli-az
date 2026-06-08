# Çınarlı Layihəsi — Claude üçün Qeydlər

## Layihə haqqında
Azerbaycanca online mebel mağazası. TanStack Router SPA + Hono REST API + SQLite.

## Texnoloji Stack
- **Frontend**: React 19 + TanStack Router (SPA mode) + Tailwind CSS v4
- **Backend**: Hono (Node.js) + better-sqlite3 + JWT auth
- **Build**: Vite (plain, Lovable/Cloudflare-siz)
- **Deploy**: DigitalOcean VPS (167.172.191.202)
- **Domain**: https://manqo.az (SSL — Let's Encrypt, avtomatik yenilənir)

---

## 🚨 DEPLOY QAYDASI — HƏR DEPLOY-DAN ƏVVƏL OXU

### Server DB-si TOXUNULMAZ-dır
Server `data.sqlite` real production datadır. Admin hər gün məhsul, kateqoriya, sifariş əlavə edir.
**Lokal DB-ni serverə göndərmək QADAĞANDIR** — bunu etsən bütün real data silinər.

### Deploy zamanı nə göndərilir, nə göndərilmir:

| Nə | Göndərilirmi? |
|----|--------------|
| `dist/client/` (frontend build) | ✅ Həmişə |
| `server/*.ts` (kod faylları) | ✅ Həmişə |
| `data.sqlite` (lokal DB) | ❌ HEÇ VAXT |
| `server/uploads/` (şəkillər) | ❌ HEÇ VAXT |

### Düzgün deploy əmrləri (yalnız bunlar):
```bash
# 1. Build
npm run build

# 2. Frontend deploy
sshpass -p 'Fab1@n2027Yk8nQ' rsync -az --no-perms -e "ssh -o StrictHostKeyChecking=no -o PubkeyAuthentication=no" dist/client/ root@167.172.191.202:/var/www/cinarli-frontend/

# 3. Server kodu deploy (--exclude uploads və --exclude node_modules mütləqdir)
sshpass -p 'Fab1@n2027Yk8nQ' rsync -az --no-perms --exclude node_modules --exclude uploads -e "ssh -o StrictHostKeyChecking=no -o PubkeyAuthentication=no" server/ root@167.172.191.202:/var/www/cinarli-api/server/

# 4. Restart
sshpass -p 'Fab1@n2027Yk8nQ' ssh -o StrictHostKeyChecking=no -o PubkeyAuthentication=no root@167.172.191.202 "pm2 restart cinarli-api"
```

**Bu 4 addımdan başqa heç nə etmə.** `scp data.sqlite`, `scp uploads`, `rsync data.sqlite` — bunların heç biri deploy-a daxil deyil.

---

## Vacib: Lovable/Cloudflare istifadə edilmir
`vite.config.ts` `@lovable.dev/vite-tanstack-config` istifadə ETMİR. Plain `vite` + `@tanstack/router-plugin/vite` istifadə edir. SSR yoxdur — pure SPA.

## Local İnkişaf
```bash
# Terminal 1 — Frontend (port 8080)
npm run dev

# Terminal 2 — Backend API (port 3001)
npm run server
# və ya: npx tsx server/index.ts
```

## Server Məlumatları
- **Server IP**: 167.172.191.202
- **SSH şifrəsi**: Fab1@n2027Yk8nQ
- **SSH**: `sshpass -p 'Fab1@n2027Yk8nQ' ssh -o StrictHostKeyChecking=no -o PubkeyAuthentication=no root@167.172.191.202`
- **Domain**: https://manqo.az
- **Frontend fayl yeri**: `/var/www/cinarli-frontend/`
- **API fayl yeri**: `/var/www/cinarli-api/`
- **Server DB yeri**: `/var/www/cinarli-api/data.sqlite` — TOXUNMA
- **Server uploads yeri**: `/var/www/cinarli-api/server/uploads/` — TOXUNMA
- **Nginx konfig**: `/etc/nginx/sites-available/cinarli`
- **PM2 proses adı**: `cinarli-api`

## Digər proyektlər eyni serverdə var — port 80-a toxunma!

## Admin Panel
- **URL**: https://manqo.az/admin
- **Email**: admin@cinarli.az
- **Şifrə**: Admin1234!

## API Endpoints
- `POST /api/auth/login` — giriş, JWT token qaytarır
- `POST /api/auth/register` — qeydiyyat
- `GET /api/auth/me` — cari istifadəçi (Bearer token)
- `PUT /api/auth/profile` — profil/şifrə yenilə (auth)
- `GET/POST/PUT/DELETE /api/categories` — `featured_product_id` sütunu var (banner üçün)
- `GET/POST/PUT/DELETE /api/products`
- `GET /api/products/featured` — həftənin teklifi (+ _until, _discount, _note)
- `GET /api/products/popular` — populyar məhsullar
- `GET /api/products/most-sold` — çox satılan məhsullar
- `PUT /api/products/:id/popular` — populyar toggle (admin)
- `PUT /api/products/:id/most-sold` — çox satılan toggle (admin)
- `GET/POST/PUT/DELETE /api/campaigns`
- `GET/POST /api/orders`, `PUT /api/orders/:id/status`
- `GET /api/me/orders` — istifadəçinin öz sifarişləri (auth)
- `GET/POST/DELETE /api/me/wishlist` — bəyəndiklərim (auth)
- `GET/POST/DELETE /api/me/compare` — müqayisə (auth, max 4)
- `GET/POST/PUT/DELETE /api/me/addresses` — ünvanlar (auth)
- `GET /api/users`, `PUT /api/users/:id/role`
- `GET /api/stats` — dashboard statistikası
- `POST /api/upload` — şəkil yükləmə (multipart/form-data, max 20MB, bütün formatlar)
- `GET/POST/PUT/DELETE /api/stores` — mağazalar
- `GET /api/featured-settings` — həftənin teklifi parametrləri (admin)
- `PUT /api/featured-settings` — həftənin teklifini yenilə (admin)
- `GET /api/credit-companies/active` — aktiv kredit şirkətləri (public)
- `GET/POST/PUT/DELETE /api/credit-companies` — kredit şirkətləri CRUD (admin)

## Fayl Strukturu
```
server/
  db.ts        — SQLite schema + migrations + admin seed
  index.ts     — Hono server (port 3001)
  uploads/     — yüklənmiş şəkillər (serverə göndərilmir)

src/
  lib/api.ts       — frontend API client + bütün tiplər (CreditCompany, CreditPlan interfeysləri var)
  hooks/useAuth.ts — auth hook (JWT, localStorage) — setUser export edir
  hooks/useCart.ts — cart hook (CartItem: id,name,price,image,qty,credit_months)
  components/
    AdminLayout.tsx  — Admin sidebar nav (CreditCard ikonu ilə "Kredit şirkətləri" linki var)
    CategoryIcon.tsx — SVG ikonları slug-a görə seçir
    SpinWheel.tsx    — Şans çarxı komponenti (localStorage ilə)
  routes/
    __root.tsx                  — SPA root (SSR yoxdur)
    index.tsx                   — Ana səhifə (hero, featured, carousel, brand_slug göstərilir)
    admin.tsx                   — Admin layout wrapper (Outlet)
    admin.index.tsx             — Dashboard (AZ visitor stats, hourly chart)
    admin.mehsullar.tsx         — Məhsullar (components functional update ilə, colors editor, specs editor)
    admin.kateqoriyalar.tsx     — Kateqoriyalar (featured_product_id banner seçimi var)
    admin.kampaniyalar.tsx      — Kampaniyalar
    admin.heftenin-teklifi.tsx  — Həftənin teklifi
    admin.sifarisler.tsx        — Sifarişlər
    admin.magazalar.tsx         — Mağazalar CRUD
    admin.brendler.tsx          — Brendlər CRUD
    admin.bannerler.tsx         — Bannerlər CRUD
    admin.kreditler.tsx         — Kredit şirkətləri CRUD (plans JSON: [{months,rate,label}])
    admin.istifadeciler.tsx     — İstifadəçilər
    kabinet.tsx                 — Şəxsi kabinet
    magazalar.tsx               — Mağazalar siyahısı
    kampaniyalar.tsx            — Kampaniyalar səhifəsi
    kateqoriya.$slug.tsx        — Kateqoriya səhifəsi (top-level=subcat grid+ikonlar, banner, subfilter chips)
    mehsul.$slug.tsx            — Məhsul səhifəsi (InlineCredit, CreditModal DB-dən, ColorSwatches, ProductTabs)
    mehsullar.$filter.tsx       — Filter catalog (popular/new/bestseller/discount)
    privacy.tsx / terms.tsx / korporativ.tsx / elaqe.tsx / haqqimizda.tsx
```

## DB Cədvəlləri
- `users` — istifadəçilər
- `categories` — kateqoriyalar (parent_id hierarxiya, featured_product_id banner üçün)
- `products` — məhsullar (sale_price, extra_price, components JSON, specifications JSON, colors JSON, in_stock override)
- `campaigns` — kampaniyalar
- `orders` — sifarişlər (user_id sütunu var)
- `stores` — mağazalar
- `brands` — brendlər (logo, slug)
- `banners` — bannerlər (image, position, is_active)
- `featured_settings` — həftənin teklifi (product_id, until, discount, note)
- `wishlists` — bəyəndiklərim (user_id + product_id, UNIQUE)
- `compares` — müqayisə (user_id + product_id, max 4)
- `user_addresses` — istifadəçi ünvanları (is_default dəstəklənir)
- `visitor_logs` — ziyarətçi loqları (path, user_agent, hour, country_code)
- `credit_companies` — kredit şirkətləri (name, logo, plans JSON, is_active, position)

## Vacib Qeydlər
- Məhsul URL-i ID əsaslıdır: `/mehsul/42` (slug = id)
- Admin panel TanStack Router layout pattern: `admin.tsx` = layout + `<Outlet />`, `admin.index.tsx` = dashboard
- JWT secret: `cinarli_secret_2024`
- Node v20 serverdə — `--experimental-strip-types` işləmir, `npx tsx` istifadə et
- `.env.production` içində `VITE_API_URL=https://manqo.az` (nginx `/api/` proxy edir → localhost:3001)
- SSH key ilə giriş olmur — sshpass + şifrə istifadə et, `-o PubkeyAuthentication=no` flag mütləqdir
- nginx reload lazım olsa: `systemctl reload nginx`
- nginx `client_max_body_size 20M` konfiqurə edilib (PNG upload üçün)
- Rəng sistemi: `oklch()` → `hex` çevrildi (köhnə Chrome dəstəyi üçün), `₼` → `AZN`
- SSH push üçün: `ssh-add ~/.ssh/id_ed25519_babli751` + remote `git@github-babli:Babli751/cinarli-az.git`
- `components` sahəsi admin formada functional `setEditing(prev=>...)` pattern istifadə edir (stale closure bug fix)
- Kredit şirkətləri admin-dən əlavə edilir, `CreditModal` DB-dən oxuyur (hardcode `BANKS` yoxdur)
- Qiymət priority: `extra_price → sale_price → old_price > price → discount → price`

## DB Admin User Seed
`server/db.ts` ilk işə salındığında `admin@cinarli.az` / `Admin1234!` yaradır (users cədvəli boşdursa).
