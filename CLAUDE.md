# Çınarlı Layihəsi — Claude üçün Qeydlər

## Layihə haqqında
Azerbaycanca online mebel mağazası. TanStack Router SPA + Hono REST API + SQLite.

## Texnoloji Stack
- **Frontend**: React 19 + TanStack Router (SPA mode) + Tailwind CSS v4
- **Backend**: Hono (Node.js) + better-sqlite3 + JWT auth
- **Build**: Vite (plain, Lovable/Cloudflare-siz)
- **Deploy**: DigitalOcean VPS (167.172.191.202)
- **Domain**: https://chinarli.store (SSL — Let's Encrypt, avtomatik yenilənir)

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

## Build və Deploy
```bash
# 1. Production build (API URL .env.production-dan oxunur)
npm run build
# dist/client/ qovluğuna çıxır

# 2. Frontend-i serverə yüklə
rsync -az dist/client/ root@167.172.191.202:/var/www/cinarli-frontend/

# 3. API kodunu yüklə
rsync -az --exclude node_modules --exclude uploads server/ root@167.172.191.202:/var/www/cinarli-api/server/

# 4. Server PM2 restart
ssh root@167.172.191.202 "pm2 restart cinarli-api"
```

## Server Məlumatları
- **Server IP**: 167.172.191.202
- **SSH**: `ssh root@167.172.191.202`
- **Domain**: https://chinarli.store
- **Frontend URL**: http://167.172.191.202:8080 (birbaşa IP)
- **API URL**: http://167.172.191.202:3001
- **Frontend fayl yeri**: `/var/www/cinarli-frontend/`
- **API fayl yeri**: `/var/www/cinarli-api/`
- **Nginx konfig**: `/etc/nginx/sites-available/cinarli` (port 8080)
- **PM2 proses adı**: `cinarli-api`

## Digər proyektlər eyni serverdə var — port 80-a toxunma!

## Admin Panel
- **URL**: https://chinarli.store/admin
- **Email**: admin@cinarli.az
- **Şifrə**: Admin1234!

## API Endpoints
- `POST /api/auth/login` — giriş, JWT token qaytarır
- `POST /api/auth/register` — qeydiyyat
- `GET /api/auth/me` — cari istifadəçi (Bearer token)
- `GET/POST/PUT/DELETE /api/categories`
- `GET/POST/PUT/DELETE /api/products`
- `GET/POST/PUT/DELETE /api/campaigns`
- `GET/POST /api/orders`, `PUT /api/orders/:id/status`
- `GET /api/users`, `PUT /api/users/:id/role`
- `GET /api/stats` — dashboard statistikası
- `POST /api/upload` — şəkil yükləmə (multipart/form-data)

## Fayl Strukturu
```
server/
  db.ts        — SQLite schema + admin seed
  index.ts     — Hono server (port 3001)
  uploads/     — yüklənmiş şəkillər

src/
  lib/api.ts       — frontend API client
  hooks/useAuth.ts — auth hook (JWT, localStorage)
  routes/
    __root.tsx              — SPA root (SSR yoxdur)
    index.tsx               — Ana səhifə
    admin.tsx               — Admin layout wrapper (Outlet)
    admin.index.tsx         — Dashboard
    admin.mehsullar.tsx     — Məhsullar idarəetməsi
    admin.kateqoriyalar.tsx — Kateqoriyalar
    admin.kampaniyalar.tsx  — Kampaniyalar
    admin.sifarisler.tsx    — Sifarişlər
    admin.istifadeciler.tsx — İstifadəçilər
    kabinet.tsx             — Şəxsi kabinet + login
    kateqoriya.$slug.tsx    — Kateqoriya səhifəsi
    mehsul.$slug.tsx        — Məhsul səhifəsi (slug = product ID)
```

## Vacib Qeydlər
- Məhsul URL-i ID əsaslıdır: `/mehsul/42` (slug = id)
- Admin panel TanStack Router layout pattern: `admin.tsx` = layout + `<Outlet />`, `admin.index.tsx` = dashboard
- JWT secret: `cinarli_secret_2024`
- SQLite: serverdə `/var/www/cinarli-api/data.sqlite`
- Node v20 serverdə — `--experimental-strip-types` işləmir, `npx tsx` istifadə et
- `.env.production` içində `VITE_API_URL=https://chinarli.store` (nginx `/api/` proxy edir → localhost:3001)

## DB Admin User Seed
`server/db.ts` ilk işə salındığında `admin@cinarli.az` / `Admin1234!` yaradır (users cədvəli boşdursa).
