import { createFileRoute, Link } from "@tanstack/react-router";
import { Scale, Heart, Store, Sofa, Truck, ShieldCheck, Gift, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { categories, products } from "@/data/catalog";
import { SiteHeader, SiteFooter } from "@/components/SiteLayout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MebelMart — Onlayn mebel mağazası" },
      { name: "description", content: "Divan, çarpayı, masa, şkaf və daha çoxu. Sürətli çatdırılma, faizsiz aylıq ödəniş." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-3">
        <div className="relative col-span-2 overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--brand)] via-emerald-500 to-emerald-700 p-10 text-white">
          <div className="relative z-10">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/80">Mövsüm kampaniyası</p>
            <h1 className="mt-3 font-black leading-none tracking-tight">
              <span className="block text-6xl md:text-7xl">Yaşıl</span>
              <span className="block -mt-1 text-6xl italic md:text-7xl">cümə</span>
            </h1>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold backdrop-blur">📅 8 — 11 may</div>
            <div className="mt-6 flex items-end gap-2">
              <span className="text-7xl font-black md:text-8xl">70%</span>
              <span className="mb-2 text-2xl font-bold">-dək<br/>ENDİRİMLƏR</span>
            </div>
            <Link to="/kampaniyalar" className="mt-6 inline-block rounded-lg bg-white px-7 py-3 font-bold text-[var(--brand)] shadow-lg hover:bg-white/90">İndi alış-veriş et →</Link>
          </div>
          <div className="absolute -bottom-6 -right-6 flex items-end gap-2 text-7xl opacity-40 md:text-8xl">
            <span>🛋️</span><span>🛏️</span><span>🪑</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--accent-orange)]/40 bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between rounded-lg bg-[var(--accent-orange)]/10 px-3 py-2 text-sm">
            <span className="font-semibold">Həftənin təklifi</span>
            <div className="flex items-center gap-1 font-mono text-xs">
              {["05","09","44","35"].map((v, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="rounded bg-[var(--accent-orange)] px-1.5 py-0.5 font-bold text-white">{v}</span>
                  {i < 3 && <span className="text-[var(--accent-orange)]">:</span>}
                </span>
              ))}
            </div>
          </div>
          <h3 className="text-lg font-bold">Lüks Yataq Dəsti Royal</h3>
          <span className="mt-1 inline-block rounded-md border border-[var(--brand)] px-2 py-0.5 text-xs text-[var(--brand)]">Stokda var</span>
          <div className="my-4 grid place-items-center text-7xl">🛏️</div>
          <div className="mb-1 text-sm text-muted-foreground line-through">299.99 AZN</div>
          <div className="text-3xl font-black">229.99 AZN</div>
          <div className="mt-1 text-xs font-semibold text-[var(--accent-orange)]">−70 AZN · Faizsiz təklif</div>
          <button className="mt-4 w-full rounded-lg bg-[var(--accent-orange)] py-3 font-semibold text-white hover:opacity-90">Bir kliklə al</button>
        </div>
      </section>

      {/* Promo banners */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 md:grid-cols-3">
        {[
          { t: "Yataq otağı dəstləri", d: "30%-dək endirim", emoji: "🛏️", slug: "carpayilar", color: "from-rose-500 to-pink-600" },
          { t: "Yumşaq mebel həftəsi", d: "Faizsiz 24 ay", emoji: "🛋️", slug: "yumsaq-mebel", color: "from-amber-500 to-orange-600" },
          { t: "Ofis komfortu", d: "İş üçün ən yaxşısı", emoji: "🖥️", slug: "ofis-mebel", color: "from-sky-500 to-blue-600" },
        ].map((b) => (
          <Link key={b.slug} to="/kateqoriya/$slug" params={{ slug: b.slug }} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${b.color} p-6 text-white transition hover:opacity-95`}>
            <div className="text-xs font-bold uppercase tracking-wider opacity-80">{b.d}</div>
            <div className="mt-2 text-2xl font-black">{b.t}</div>
            <div className="absolute -bottom-4 -right-2 text-7xl opacity-30">{b.emoji}</div>
          </Link>
        ))}
      </section>

      {/* Feature strip */}
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <div className="grid grid-cols-2 gap-4 rounded-2xl bg-secondary/40 p-6 md:grid-cols-6">
          {[
            { icon: Store, label: "56 mağaza" },
            { icon: Sofa, label: "40 mindən çox seçim" },
            { icon: Truck, label: "Sürətli çatdırılma" },
            { icon: ShieldCheck, label: "Rəsmi zəmanət" },
            { icon: Gift, label: "Bonus proqramı" },
            { icon: Zap, label: "Sürətli alış-veriş" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <Icon className="h-8 w-8 text-[var(--brand)]" />
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="mb-5 text-2xl font-bold">Kateqoriyalar</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-8">
          {categories.map((c) => (
            <Link key={c.slug} to="/kateqoriya/$slug" params={{ slug: c.slug }} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition hover:border-[var(--brand)] hover:shadow-md">
              <span className="text-3xl">{c.icon}</span>
              <span className="text-xs font-medium">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <div className="flex items-baseline gap-6">
            <h2 className="text-2xl font-bold">Populyar məhsullar</h2>
            <Link to="/yeni" className="text-lg text-muted-foreground hover:text-foreground">Yeni məhsullar</Link>
          </div>
          <div className="flex gap-2">
            <button className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card hover:bg-secondary"><ChevronLeft className="h-5 w-5" /></button>
            <button className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card hover:bg-secondary"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.slice(0, 12).map((p) => (
            <Link to="/kateqoriya/$slug" params={{ slug: p.category }} key={p.name} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition hover:shadow-lg">
              <div className="absolute right-3 top-3 grid h-12 w-12 place-items-center rounded-full bg-[var(--accent-orange)] text-sm font-bold text-white">−{p.discount}%</div>
              <div className="absolute left-3 top-3 flex gap-2 text-muted-foreground">
                <Scale className="h-4 w-4" />
                <Heart className="h-4 w-4" />
              </div>
              <div className="my-6 grid h-40 place-items-center text-7xl">{p.img}</div>
              <h3 className="line-clamp-2 min-h-[3rem] text-sm font-medium">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-xl font-black">{p.price} ₼</span>
                <span className="text-sm text-muted-foreground line-through">{p.old} ₼</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-[var(--brand)]"><Zap className="h-3 w-3" /> Aylıq {Math.round(p.price / 12)} ₼-dan</div>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
