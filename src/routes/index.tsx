import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Scale, Heart, Store, Sofa, Truck, ShieldCheck, Gift, Zap, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { api, getImageUrl, type Product } from "@/lib/api";
import { SiteHeader, SiteFooter } from "@/components/SiteLayout";
import heroLiving from "@/assets/hero-living.jpg";
import bannerBedroom from "@/assets/banner-bedroom.jpg";
import bannerSoft from "@/assets/banner-soft.jpg";
import bannerOffice from "@/assets/banner-office.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Çınarlı — Onlayn mebel mağazası" },
      { name: "description", content: "Divan, çarpayı, masa, şkaf və daha çoxu. Sürətli çatdırılma, faizsiz aylıq ödəniş." },
    ],
  }),
  component: Index,
});

function Index() {
  const [tab1, setTab1] = useState<"popular" | "new">("popular");
  const [tab2, setTab2] = useState<"bestseller" | "discount">("bestseller");
  const [products, setProducts] = useState<Product[]>([]);
  const [mostSold, setMostSold] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product | null | undefined>(undefined);

  useEffect(() => {
    api.getProducts({ active: true }).then(setProducts).catch(() => {});
    api.getMostSoldProducts(12).then(setMostSold).catch(() => {});
    api.getFeaturedProduct().then(setFeatured).catch(() => setFeatured(null));
  }, []);

  const list1 = tab1 === "popular"
    ? products.slice(0, 12)
    : [...products].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 12);

  const list2 = tab2 === "bestseller"
    ? mostSold.slice(0, 12)
    : [...products].filter(p => p.discount > 0).sort((a, b) => b.discount - a.discount).slice(0, 12);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-3">
        <div className="relative col-span-2 overflow-hidden rounded-2xl bg-neutral-900 text-white">
          <img src={heroLiving} alt="Modern living room" width={1920} height={1080} className="absolute inset-0 h-full w-full object-cover opacity-75 saturate-150" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
          <div className="relative z-10 flex h-full min-h-[420px] flex-col justify-end p-8 md:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">Mövsüm kampaniyası</p>
            <h1 className="mt-3 font-black leading-[0.9] tracking-tight">
              <span className="block text-5xl md:text-7xl">Çınarlı</span>
              <span className="mt-2 block text-emerald-300 text-3xl md:text-5xl italic font-light">Keyfiyyətli mebel</span>
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/80 md:text-base">Premium mebel kolleksiyasını əldə edin.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to="/kampaniyalar" className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3 font-bold text-neutral-900 shadow-lg hover:bg-white/90">
                Kampaniyalar <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/yeni" className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-7 py-3 font-semibold text-white backdrop-blur hover:bg-white/10">
                Yeni kolleksiya
              </Link>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between bg-[var(--accent-orange)] px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">★</span>
              <span className="font-bold text-white">Həftənin teklifi</span>
            </div>
            <div className="text-xs font-semibold text-white/90">Bu hafta bitir</div>
          </div>
          {featured === undefined ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Yüklənir...</div>
          ) : featured ? (
            <Link to="/mehsul/$slug" params={{ slug: String(featured.id) }} className="block group">
              <div className="relative bg-secondary/30 p-6">
                {featured.discount > 0 && (
                  <div className="absolute right-4 top-4 z-10 flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 border-[var(--accent-orange)] bg-white shadow-md">
                    <div className="text-lg font-black text-[var(--accent-orange)]">−{featured.discount}%</div>
                  </div>
                )}
                <ProductImg p={featured} className="mx-auto h-56 w-full rounded-lg object-cover transition duration-300 group-hover:scale-105" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold leading-snug line-clamp-2 text-foreground">{featured.name}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {featured.stock > 0 ? (
                    <span className="inline-block rounded-md border border-[var(--brand)] px-2.5 py-1 text-xs font-semibold text-[var(--brand)]">
                      Stokda var
                    </span>
                  ) : (
                    <span className="inline-block rounded-md border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-600">
                      Stokda yoxdur
                    </span>
                  )}
                  {featured.discount > 0 && (
                    <span className="inline-block rounded-md bg-[var(--accent-orange)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--accent-orange)]">
                      Faizsiz təklif
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  {featured.old_price && <div className="text-sm font-semibold text-muted-foreground line-through">{featured.old_price} ₼</div>}
                  <div className="text-4xl font-black text-foreground">{featured.price} ₼</div>
                </div>
                <div className="mt-3 rounded-lg bg-secondary/50 p-3">
                  <div className="text-xs text-muted-foreground mb-1">Faizsiz aylıq ödəniş</div>
                  <div className="text-sm font-bold text-foreground">24 ay · Aylıq <span className="text-[var(--accent-orange)]">{Math.round(featured.price / 24)} ₼</span></div>
                </div>
                {featured.stock > 0 && (
                  <button className="mt-5 w-full rounded-lg bg-[var(--accent-orange)] py-3 text-center font-bold text-white transition hover:opacity-90">
                    Bir kliklə al
                  </button>
                )}
              </div>
            </Link>
          ) : (
            <div className="p-12 text-center">
              <p className="text-muted-foreground text-sm font-medium">Admin paneldən həftənin teklifini seçin</p>
              <p className="mt-1 text-xs text-muted-foreground/60">Məhsulu öz seçin və "featured" işarəsi qoyun ★</p>
            </div>
          )}
        </div>
      </section>

      {/* Promo banners */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 md:grid-cols-3">
        {[
          { t: "Yataq otağı dəstləri", d: "30%-dək endirim", img: bannerBedroom, slug: "carpayilar" },
          { t: "Yumşaq mebel həftəsi", d: "Faizsiz 24 ay", img: bannerSoft, slug: "yumsaq-mebel" },
          { t: "Ofis komfortu", d: "İş üçün ən yaxşısı", img: bannerOffice, slug: "ofis-mebel" },
        ].map((b) => (
          <Link key={b.slug} to="/kateqoriya/$slug" params={{ slug: b.slug }}
            className="group relative h-56 overflow-hidden rounded-2xl">
            <img src={b.img} alt={b.t} width={1024} height={768} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5 text-white">
              <div className="text-xs font-bold uppercase tracking-wider text-white/80">{b.d}</div>
              <div className="mt-1 text-2xl font-black">{b.t}</div>
              <div className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-white/90">Kəşf et <ArrowRight className="h-3.5 w-3.5" /></div>
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

      {/* Products Section 1 */}
      <ProductCarousel
        items={list1}
        emptyText="Admin paneldən məhsul əlavə edin"
        tabs={[
          { key: "popular", label: "Populyar" },
          { key: "new", label: "Yeni" },
        ]}
        activeTab={tab1}
        onTabChange={(t) => setTab1(t as "popular" | "new")}
      />

      {/* Products Section 2 */}
      <ProductCarousel
        items={list2}
        emptyText={tab2 === "discount" ? "Endirimli məhsul yoxdur" : "Admin paneldən məhsul əlavə edin"}
        tabs={[
          { key: "bestseller", label: "Çox satılan" },
          { key: "discount", label: "Endirimli" },
        ]}
        activeTab={tab2}
        onTabChange={(t) => setTab2(t as "bestseller" | "discount")}
        isLast
      />

      <SiteFooter />
    </div>
  );
}

function ProductCarousel({
  items, emptyText, tabs, activeTab, onTabChange, isLast,
}: {
  items: Product[];
  emptyText: string;
  tabs: { key: string; label: string }[];
  activeTab: string;
  onTabChange: (t: string) => void;
  isLast?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!ref.current) return;
    const card = ref.current.querySelector("[data-card]") as HTMLElement | null;
    const amount = card ? card.offsetWidth + 16 : 260;
    ref.current.scrollBy({ left: dir === "right" ? amount * 2 : -amount * 2, behavior: "smooth" });
  };

  // Auto-scroll: hər 3.5s-də bir kart irəli, sona çatanda başa qayıt
  useEffect(() => {
    if (items.length === 0) return;
    const el = ref.current;
    if (!el) return;
    const timer = setInterval(() => {
      const card = el.querySelector("[data-card]") as HTMLElement | null;
      const amount = card ? card.offsetWidth + 16 : 260;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: amount, behavior: "smooth" });
      }
    }, 3500);
    return () => clearInterval(timer);
  }, [items]);

  return (
    <section className={`mx-auto max-w-7xl px-4 py-6 md:py-10 ${isLast ? "pb-16" : ""}`}>
      <div className="mb-4 md:mb-5 flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-3 md:gap-6 flex-wrap">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => onTabChange(t.key)}
              className={`text-lg md:text-2xl lg:text-3xl font-bold transition ${activeTab === t.key ? "text-foreground" : "text-muted-foreground/40 hover:text-muted-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => scroll("left")}
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card hover:bg-secondary transition">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => scroll("right")}
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card hover:bg-secondary transition">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">{emptyText}</div>
      ) : (
        <div
          ref={ref}
          className="flex gap-3 overflow-x-auto scroll-smooth pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((p) => (
            <div key={p.id} data-card className="w-[155px] flex-none sm:w-[185px] md:w-[210px] lg:w-[230px]">
              <ProductCard p={p} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ProductImg({ p, className }: { p: Product; className?: string }) {
  const url = getImageUrl(p.image);
  if (url) {
    return <img src={url} alt={p.name} className={className ?? "h-full w-full object-cover"} loading="lazy" />;
  }
  return <div className="flex h-full w-full items-center justify-center text-5xl">{p.image || "📦"}</div>;
}

function ProductCard({ p }: { p: Product }) {
  return (
    <Link to="/mehsul/$slug" params={{ slug: String(p.id) }}
      className="group relative flex flex-col overflow-hidden rounded-xl md:rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-xl">
      {p.discount > 0 && (
        <div className="absolute right-2 top-2 md:right-3 md:top-3 z-10 flex h-10 w-10 md:h-12 md:w-12 place-items-center justify-center rounded-full border-2 border-[var(--accent-orange)] bg-white text-xs font-bold text-[var(--accent-orange)] shadow-md">
          −{p.discount}%
        </div>
      )}
      <div className="absolute left-2 top-2 md:left-3 md:top-3 z-10 hidden md:flex flex-col gap-2">
        <button className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-muted-foreground shadow hover:text-[var(--brand)]"><Heart className="h-4 w-4" /></button>
        <button className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-muted-foreground shadow hover:text-[var(--brand)]"><Scale className="h-4 w-4" /></button>
      </div>
      <div className="aspect-square overflow-hidden bg-secondary/30">
        <ProductImg p={p} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
      </div>
      <div className="flex flex-1 flex-col p-3 md:p-4">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-xs md:text-sm font-semibold">{p.name}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5 md:gap-2">
          {p.stock > 0 ? (
            <span className="inline-block rounded-md border border-[var(--brand)] px-1.5 md:px-2 py-0.5 text-xs font-semibold text-[var(--brand)]">
              Stokda var
            </span>
          ) : (
            <span className="inline-block rounded-md border border-red-300 px-1.5 md:px-2 py-0.5 text-xs font-semibold text-red-600">
              Stokda yoxdur
            </span>
          )}
          {p.discount > 0 && (
            <span className="hidden md:inline-block rounded-md bg-[var(--accent-orange)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--accent-orange)]">
              Faizsiz təklif
            </span>
          )}
        </div>
        <div className="mt-2 md:mt-3 flex items-baseline gap-2">
          <span className="text-xl md:text-2xl font-black">{p.price} ₼</span>
          {p.old_price && <span className="text-xs md:text-sm text-muted-foreground line-through">{p.old_price} ₼</span>}
        </div>
        <div className="mt-1 text-xs font-semibold text-[var(--accent-orange)]">
          Faizsiz 12 ay
        </div>
        {p.stock > 0 && (
          <button className="mt-3 md:mt-4 w-full rounded-lg bg-[var(--accent-orange)] py-2 md:py-2.5 text-center font-semibold text-white text-sm md:text-base transition hover:opacity-90">
            Səbətə əlavə et
          </button>
        )}
      </div>
    </Link>
  );
}
