import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Scale, Heart, Store, Sofa, Truck, ShieldCheck, Gift, Zap, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { categories, products } from "@/data/catalog";
import { slugify } from "@/lib/slug";
import { SiteHeader, SiteFooter } from "@/components/SiteLayout";
import heroLiving from "@/assets/hero-living.jpg";
import bannerBedroom from "@/assets/banner-bedroom.jpg";
import bannerSoft from "@/assets/banner-soft.jpg";
import bannerOffice from "@/assets/banner-office.jpg";
import featuredBed from "@/assets/p-bed.jpg";

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
  const [tab, setTab] = useState<"popular" | "new">("popular");
  const list = tab === "popular"
    ? products.slice(0, 12)
    : [...products].sort((a, b) => b.discount - a.discount).slice(0, 12);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-3">
        <div className="relative col-span-2 overflow-hidden rounded-2xl bg-neutral-900 text-white">
          <img
            src={heroLiving}
            alt="Modern living room"
            width={1920}
            height={1080}
            className="absolute inset-0 h-full w-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="relative z-10 flex h-full min-h-[420px] flex-col justify-end p-8 md:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">Mövsüm kampaniyası</p>
            <h1 className="mt-3 font-black leading-[0.9] tracking-tight">
              <span className="block text-5xl md:text-7xl">Yaşıl cümə</span>
              <span className="mt-2 block text-emerald-300 text-3xl md:text-5xl italic font-light">70%-dək endirim</span>
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/80 md:text-base">
              Premium mebel kolleksiyasını məhdud müddətdə xüsusi qiymətlərlə əldə edin.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to="/kampaniyalar" className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3 font-bold text-neutral-900 shadow-lg hover:bg-white/90">
                İndi alış-veriş et <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/yeni" className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-7 py-3 font-semibold text-white backdrop-blur hover:bg-white/10">
                Yeni kolleksiya
              </Link>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between bg-[var(--accent-orange)]/10 px-4 py-2 text-sm">
            <span className="font-semibold">Həftənin təklifi</span>
            <div className="flex items-center gap-1 font-mono text-xs">
              {["05", "09", "44", "35"].map((v, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="rounded bg-[var(--accent-orange)] px-1.5 py-0.5 font-bold text-white">{v}</span>
                  {i < 3 && <span className="text-[var(--accent-orange)]">:</span>}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-secondary/30 p-4">
            <img src={featuredBed} alt="Lüks Yataq Dəsti Royal" width={768} height={768} loading="lazy" className="mx-auto h-44 w-full rounded-lg object-cover" />
          </div>
          <div className="p-5">
            <h3 className="text-lg font-bold">Lüks Yataq Dəsti Royal</h3>
            <span className="mt-1 inline-block rounded-md border border-[var(--brand)] px-2 py-0.5 text-xs text-[var(--brand)]">Stokda var</span>
            <div className="mt-4 text-sm text-muted-foreground line-through">2 999 ₼</div>
            <div className="text-3xl font-black">2 299 ₼</div>
            <div className="mt-1 text-xs font-semibold text-[var(--accent-orange)]">−700 ₼ · Faizsiz 24 ay</div>
            <button className="mt-4 w-full rounded-lg bg-[var(--accent-orange)] py-3 font-semibold text-white hover:opacity-90">Bir kliklə al</button>
          </div>
        </div>
      </section>

      {/* Promo banners */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 md:grid-cols-3">
        {[
          { t: "Yataq otağı dəstləri", d: "30%-dək endirim", img: bannerBedroom, slug: "carpayilar" },
          { t: "Yumşaq mebel həftəsi", d: "Faizsiz 24 ay", img: bannerSoft, slug: "yumsaq-mebel" },
          { t: "Ofis komfortu", d: "İş üçün ən yaxşısı", img: bannerOffice, slug: "ofis-mebel" },
        ].map((b) => (
          <Link
            key={b.slug}
            to="/kateqoriya/$slug"
            params={{ slug: b.slug }}
            className="group relative h-56 overflow-hidden rounded-2xl"
          >
            <img src={b.img} alt={b.t} width={1024} height={768} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5 text-white">
              <div className="text-xs font-bold uppercase tracking-wider text-white/80">{b.d}</div>
              <div className="mt-1 text-2xl font-black">{b.t}</div>
              <div className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-white/90">
                Kəşf et <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </Link>
        ))}
      </section>

      {/* Feature strip */}
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-6 md:grid-cols-6">
          {[
            { icon: Store, label: "56 mağaza" },
            { icon: Sofa, label: "40 mindən çox seçim" },
            { icon: Truck, label: "Sürətli çatdırılma" },
            { icon: ShieldCheck, label: "Rəsmi zəmanət" },
            { icon: Gift, label: "Bonus proqramı" },
            { icon: Zap, label: "Sürətli alış-veriş" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--brand)]/10">
                <Icon className="h-6 w-6 text-[var(--brand)]" />
              </div>
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold md:text-3xl">Kateqoriyalar</h2>
          <Link to="/yeni" className="text-sm text-muted-foreground hover:text-foreground">Hamısına bax →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/kateqoriya/$slug"
              params={{ slug: c.slug }}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center transition hover:-translate-y-1 hover:border-[var(--brand)] hover:shadow-md"
            >
              <div className="aspect-square w-full overflow-hidden rounded-xl bg-secondary/40">
                <img src={c.image} alt={c.name} width={768} height={768} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
              </div>
              <span className="text-xs font-semibold md:text-sm">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <div className="flex items-baseline gap-6">
            <h2 className="text-2xl font-bold md:text-3xl">Populyar məhsullar</h2>
            <Link to="/yeni" className="hidden text-lg text-muted-foreground hover:text-foreground md:inline">Yeni məhsullar</Link>
          </div>
          <div className="flex gap-2">
            <button className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card hover:bg-secondary"><ChevronLeft className="h-5 w-5" /></button>
            <button className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card hover:bg-secondary"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.slice(0, 12).map((p) => (
            <Link
              to="/mehsul/$slug"
              params={{ slug: slugify(p.name) }}
              key={p.name}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-[var(--accent-orange)] text-xs font-bold text-white shadow-md">−{p.discount}%</div>
              <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
                <button className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-muted-foreground shadow hover:text-[var(--brand)]"><Heart className="h-4 w-4" /></button>
                <button className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-muted-foreground shadow hover:text-[var(--brand)]"><Scale className="h-4 w-4" /></button>
              </div>
              <div className="aspect-square overflow-hidden bg-secondary/30">
                <img src={p.image} alt={p.name} width={768} height={768} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl font-black">{p.price} ₼</span>
                  <span className="text-sm text-muted-foreground line-through">{p.old} ₼</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-[var(--brand)]"><Zap className="h-3 w-3" /> Aylıq {Math.round(p.price / 12)} ₼-dan</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
