import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Search, Heart, ShoppingCart, Scale, User, Menu, Store, Sofa, Truck, ShieldCheck, Gift, Zap, ChevronLeft, ChevronRight, X } from "lucide-react";
import { categories, products } from "@/data/catalog";

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
      {/* Top bar */}
      <div className="border-b border-border bg-secondary/40 text-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
          <div className="flex items-center gap-5 text-muted-foreground">
            <a href="#">Kampaniyalar</a>
            <a href="#">Mağazalar</a>
            <a href="#">Korporativ</a>
            <a href="#">Outlet</a>
            <span className="rounded-md border border-[var(--accent-orange)] px-2 py-0.5 font-medium text-[var(--accent-orange)]">Künc divanlar</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-bold text-[var(--brand)]">*0171</span>
            <span>🇦🇿 Azərbaycan dili</span>
            <a href="#" className="flex items-center gap-1"><User className="h-4 w-4" /> Şəxsi kabinet</a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
          <a href="/" className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--brand)] text-[var(--brand-foreground)] font-black">M</div>
            <span className="text-xl font-extrabold tracking-tight">MebelMart</span>
          </a>

          <Link to="/kataloq" className="ml-2 flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-3 font-semibold text-[var(--brand-foreground)] hover:opacity-90">
            <Menu className="h-5 w-5" /> Kataloq
          </Link>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Məhsul axtar..."
              className="w-full rounded-lg border border-border bg-secondary/50 py-3 pl-10 pr-4 outline-none focus:border-[var(--brand)]"
            />
          </div>

          <div className="flex items-center gap-5 text-muted-foreground">
            <button className="flex flex-col items-center text-xs hover:text-foreground"><Scale className="h-5 w-5" />Müqayisə</button>
            <button className="flex flex-col items-center text-xs hover:text-foreground"><Heart className="h-5 w-5" />Bəyəndim</button>
            <button className="flex flex-col items-center text-xs hover:text-foreground"><ShoppingCart className="h-5 w-5" />Səbət</button>
          </div>

          <button className="flex items-center gap-2 rounded-lg border-2 border-[var(--brand)] px-4 py-3 font-semibold text-[var(--brand)] hover:bg-[var(--brand)]/10">
            💳 Aylıq ödəniş
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-3">
        <div className="relative col-span-2 overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--brand)] to-emerald-600 p-10 text-white">
          <p className="text-sm font-semibold uppercase tracking-widest opacity-90">Mövsüm endirimləri</p>
          <h1 className="mt-3 text-5xl font-black leading-tight md:text-6xl">70%-dək<br />ENDİRİMLƏR</h1>
          <p className="mt-4 max-w-md text-white/90">Minlərlə məhsulda möhtəşəm qiymətlər. Yalnız bu həftə.</p>
          <button className="mt-6 rounded-lg bg-white px-6 py-3 font-bold text-[var(--brand)] hover:bg-white/90">İndi alış-veriş et</button>
          <div className="absolute -bottom-10 -right-10 text-[14rem] opacity-20">🛋️</div>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            <span className="h-1.5 w-8 rounded-full bg-white"></span>
            <span className="h-1.5 w-2 rounded-full bg-white/50"></span>
            <span className="h-1.5 w-2 rounded-full bg-white/50"></span>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-[var(--accent-orange)]/30 bg-card p-5">
          <div className="mb-3 flex items-center justify-between rounded-lg bg-[var(--accent-orange)]/10 px-3 py-2 text-sm">
            <span className="font-semibold">Həftənin təklifi</span>
            <span className="font-mono text-[var(--accent-orange)]">05 : 09 : 44 : 35</span>
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

      {/* Feature strip */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-4 rounded-2xl bg-secondary/40 p-6 md:grid-cols-5">
          {[
            { icon: Store, label: "56 mağaza" },
            { icon: Sofa, label: "10 mindən çox model" },
            { icon: Truck, label: "Sürətli çatdırılma" },
            { icon: ShieldCheck, label: "Rəsmi zəmanət" },
            { icon: Gift, label: "Bonus proqramı" },
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
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link key={c.slug} to="/kateqoriya/$slug" params={{ slug: c.slug }} className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-[var(--brand)] hover:text-[var(--brand)]">
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <div className="flex items-baseline gap-6">
            <h2 className="text-2xl font-bold">Populyar məhsullar</h2>
            <a href="#" className="text-lg text-muted-foreground hover:text-foreground">Yeni məhsullar</a>
          </div>
          <div className="flex gap-2">
            <button className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card hover:bg-secondary"><ChevronLeft className="h-5 w-5" /></button>
            <button className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card hover:bg-secondary"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <article key={p.name} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition hover:shadow-lg">
              <div className="absolute right-3 top-3 grid h-12 w-12 place-items-center rounded-full bg-[var(--accent-orange)] text-sm font-bold text-white">−{p.discount}%</div>
              <div className="absolute left-3 top-3 flex gap-2 text-muted-foreground">
                <button className="hover:text-[var(--brand)]"><Scale className="h-4 w-4" /></button>
                <button className="hover:text-[var(--accent-orange)]"><Heart className="h-4 w-4" /></button>
              </div>
              <div className="my-6 grid h-40 place-items-center text-7xl">{p.img}</div>
              <h3 className="line-clamp-2 min-h-[3rem] text-sm font-medium">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-xl font-black">{p.price} ₼</span>
                <span className="text-sm text-muted-foreground line-through">{p.old} ₼</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-[var(--brand)]"><Zap className="h-3 w-3" /> Aylıq {Math.round(p.price / 12)} ₼-dan</div>
              <button className="mt-3 w-full rounded-lg bg-[var(--brand)] py-2 text-sm font-semibold text-[var(--brand-foreground)] opacity-0 transition group-hover:opacity-100">
                Səbətə əlavə et
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/30">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded bg-[var(--brand)] font-black text-[var(--brand-foreground)]">M</div>
              <span className="font-extrabold">MebelMart</span>
            </div>
            <p className="text-sm text-muted-foreground">Etibarlı mebel mağazası. 24/7 dəstək.</p>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">Şirkət</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#">Haqqımızda</a></li><li><a href="#">Mağazalar</a></li><li><a href="#">Karyera</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">Kömək</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#">Çatdırılma</a></li><li><a href="#">Geri qaytarma</a></li><li><a href="#">Zəmanət</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">Əlaqə</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>*0171</li><li>info@mebelmart.az</li><li>Bakı, Azərbaycan</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">© 2026 MebelMart</div>
      </footer>
    </div>
  );
}
