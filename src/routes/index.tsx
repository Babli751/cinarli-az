import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Scale, Heart, Store, Sofa, Truck, ShieldCheck, Gift, Zap, ArrowRight, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { api, getImageUrl, type Product, type Campaign } from "@/lib/api";
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
  const [popular, setPopular] = useState<Product[]>([]);
  const [mostSold, setMostSold] = useState<Product[]>([]);
  const [featuredList, setFeaturedList] = useState<(Product & { _until?: string | null; _note?: string; _discount?: number; _credit_months?: number })[] | undefined>(undefined);
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    api.getProducts({ active: true }).then(setProducts).catch(() => {});
    api.getPopularProducts(24).then(setPopular).catch(() => {});
    api.getMostSoldProducts(24).then(setMostSold).catch(() => {});
    api.getFeaturedProduct().then((arr) => setFeaturedList(arr)).catch(() => setFeaturedList([]));
    api.getCampaigns().then((c) => setCampaigns(c.filter(x => x.is_active))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!featuredList || featuredList.length <= 1) return;
    const id = setInterval(() => setFeaturedIdx(i => (i + 1) % featuredList.length), 3000);
    return () => clearInterval(id);
  }, [featuredList]);

  useEffect(() => {
    if (campaigns.length <= 1) return;
    const id = setInterval(() => setHeroIdx(i => (i + 1) % campaigns.length), 4000);
    return () => clearInterval(id);
  }, [campaigns]);

  const featured = featuredList === undefined ? undefined : (featuredList[featuredIdx] ?? null);

  const list1 = tab1 === "popular"
    ? popular
    : [...products].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 24);

  const list2 = tab2 === "bestseller"
    ? mostSold
    : [...products].filter(p => p.discount > 0).sort((a, b) => b.discount - a.discount).slice(0, 24);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-3 px-4 py-4 lg:grid-cols-3 lg:py-5">
        <div className="relative col-span-2 overflow-hidden rounded-2xl bg-neutral-900 text-white">
          {/* Campaign background slides */}
          {campaigns.length > 0 ? (
            campaigns.map((camp, i) => {
              const url = getImageUrl(camp.image);
              return url ? (
                <img key={camp.id} src={url} alt={camp.title}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${i === heroIdx ? "opacity-100" : "opacity-0"}`} />
              ) : null;
            })
          ) : (
            <img src={heroLiving} alt="Hero" className="absolute inset-0 h-full w-full object-cover opacity-90 saturate-150" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="relative z-10 flex h-full min-h-[300px] flex-col justify-end p-4 md:min-h-[360px] md:p-8">
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link to="/kampaniyalar" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-neutral-900 shadow-lg hover:bg-white/90">
                Kampaniyalar <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link to="/kateqoriya/$slug" params={{ slug: "mebel-dunyasi" }} className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/10">
                Yeni kolleksiya
              </Link>
            </div>
            {campaigns.length > 1 && (
              <div className="mt-3 flex gap-1.5">
                {campaigns.map((_, i) => (
                  <button key={i} onClick={() => setHeroIdx(i)}
                    className={`h-1.5 rounded-full transition-all ${i === heroIdx ? "w-4 bg-white" : "w-1.5 bg-white/40"}`} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Featured — compact irshad.az style */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm flex flex-col">
          <div className="flex items-center justify-between bg-[var(--accent-orange)] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-base">★</span>
              <span className="text-sm font-bold text-white tracking-wide">HƏFTƏNİN TƏKLİFİ</span>
              {featuredList && featuredList.length > 1 && (
                <div className="flex items-center gap-1 ml-1">
                  {featuredList.map((_, i) => (
                    <button key={i} onClick={() => setFeaturedIdx(i)}
                      className={`h-1.5 rounded-full transition-all ${i === featuredIdx ? "w-3 bg-white" : "w-1.5 bg-white/50"}`} />
                  ))}
                </div>
              )}
            </div>
            <FeaturedCountdown until={featured?._until} />
          </div>
          {featured === undefined ? (
            <div className="flex-1 p-6 text-center text-muted-foreground text-sm flex items-center justify-center">Yüklənir...</div>
          ) : featured ? (
            <Link to="/mehsul/$slug" params={{ slug: String(featured.id) }} className="flex flex-col flex-1 group">
              {(() => {
                const activeDiscount = featured._discount || featured.discount || 0;
                const discountedPrice = activeDiscount > 0
                  ? Math.round(featured.price * (1 - activeDiscount / 100) * 100) / 100
                  : null;
                const showOriginal = discountedPrice !== null;
                return (
                  <>
                    <div className="relative bg-secondary/20 px-4 pt-3 pb-2">
                      {activeDiscount > 0 && (
                        <div className="absolute right-3 top-3 z-10 flex h-11 w-11 flex-col items-center justify-center rounded-full border-2 border-[var(--accent-orange)] bg-white shadow">
                          <div className="text-sm font-black text-[var(--accent-orange)]">−{activeDiscount}%</div>
                        </div>
                      )}
                      <ProductImg p={featured} className="mx-auto h-40 w-full rounded-lg object-cover transition duration-300 group-hover:scale-105" />
                    </div>
                    <div className="px-4 py-3 flex flex-col flex-1">
                      <h3 className="text-sm font-bold leading-snug line-clamp-2 text-foreground">{featured.name}</h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {featured.stock > 0 ? (
                          <span className="rounded border border-[var(--brand)] px-2 py-0.5 text-xs font-semibold text-[var(--brand)]">
                            Stokda var · {featured.stock} ədəd
                          </span>
                        ) : (
                          <span className="rounded border border-red-300 px-2 py-0.5 text-xs font-semibold text-red-600">Stokda yoxdur</span>
                        )}
                        {activeDiscount > 0 && (
                          <span className="rounded bg-[var(--accent-orange)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--accent-orange)]">−{activeDiscount}% endirim</span>
                        )}
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        {showOriginal ? (
                          <>
                            <span className="text-xs text-muted-foreground line-through">{featured.price} ₼</span>
                            <span className="text-2xl font-black text-[var(--accent-orange)]">{discountedPrice} ₼</span>
                          </>
                        ) : (
                          <>
                            {featured.old_price && <span className="text-xs text-muted-foreground line-through">{featured.old_price} ₼</span>}
                            <span className="text-2xl font-black">{featured.price} ₼</span>
                          </>
                        )}
                      </div>
                      <div className="mt-1.5 rounded-lg bg-secondary/50 px-3 py-2">
                        <span className="text-xs text-muted-foreground">Faizsiz aylıq ödəniş · </span>
                        <span className="text-xs font-bold text-[var(--accent-orange)]">{Math.round((discountedPrice ?? featured.price) / (featured._credit_months || 24))} ₼</span>
                        <span className="text-xs text-muted-foreground"> / {featured._credit_months || 24} ay</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button onClick={(e) => e.preventDefault()}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--accent-orange)] py-2.5 text-sm font-bold text-white hover:opacity-90">
                          <ShoppingCart className="h-4 w-4" /> Bir kliklə al
                        </button>
                        <button onClick={(e) => e.preventDefault()}
                          className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-[var(--brand)] text-white hover:opacity-90"
                          title="Səbətə əlavə et">
                          <ShoppingCart className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </Link>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <p className="text-muted-foreground text-sm">Admin paneldən həftənin teklifini seçin</p>
            </div>
          )}
        </div>
      </section>

      {/* Feature strip */}
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-6 md:grid-cols-6">
          {[
            { icon: Store, label: "Ölkədaxili Xidmət" },
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
  const tripled = [...items, ...items, ...items];

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", dragFree: false }
  );

  useEffect(() => {
    if (!emblaApi) return;
    const id = setInterval(() => emblaApi.scrollNext(), 3000);
    return () => clearInterval(id);
  }, [emblaApi]);


  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

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
          <button onClick={scrollPrev}
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card hover:bg-secondary transition">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={scrollNext}
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card hover:bg-secondary transition">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">{emptyText}</div>
      ) : (
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-3">
            {tripled.map((p, i) => (
              <div key={`${p.id}-${i}`} className="w-[155px] flex-none sm:w-[185px] md:w-[210px] lg:w-[230px]">
                <ProductCard p={p} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function FeaturedCountdown({ until }: { until?: string | null }) {
  const calc = () => {
    if (!until) return null;
    const d = new Date(until).getTime() - Date.now();
    if (d <= 0) return null;
    return {
      days: Math.floor(d / 86400000),
      hours: Math.floor((d % 86400000) / 3600000),
      minutes: Math.floor((d % 3600000) / 60000),
      seconds: Math.floor((d % 60000) / 1000),
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [until]);
  if (!t) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex items-center gap-1 text-white text-sm font-black">
      {t.days > 0 && <><span>{pad(t.days)}</span><span className="text-white/60 text-xs font-normal">Gün</span><span className="opacity-60">:</span></>}
      <span>{pad(t.hours)}</span><span className="opacity-60">:</span>
      <span>{pad(t.minutes)}</span><span className="opacity-60">:</span>
      <span>{pad(t.seconds)}</span>
    </div>
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
