import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useCart } from "@/hooks/useCart";
import { Scale, Heart, Store, Sofa, Truck, ShieldCheck, Gift, Zap, ArrowRight, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { api, getImageUrl, type Product, type Campaign, type Brand, type Banner } from "@/lib/api";
import { SiteHeader, SiteFooter } from "@/components/SiteLayout";
import heroLiving from "@/assets/hero-living.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Manqo — Onlayn Ticarət Mərkəzi" },
      { name: "description", content: "Divan, çarpayı, masa, şkaf və daha çoxu. Sürətli çatdırılma, faizsiz aylıq ödəniş." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [tab1, setTab1] = useState<"popular" | "new">("popular");
  const [tab2, setTab2] = useState<"bestseller" | "discount">("bestseller");
  const [products, setProducts] = useState<Product[]>([]);
  const [popular, setPopular] = useState<Product[]>([]);
  const [mostSold, setMostSold] = useState<Product[]>([]);
  const [featuredList, setFeaturedList] = useState<(Product & { _until?: string | null; _note?: string; _discount?: number; _credit_months?: number })[] | undefined>(undefined);
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoaded, setCampaignsLoaded] = useState(false);
  const [heroIdx, setHeroIdx] = useState(0);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerIdx, setBannerIdx] = useState(0);

  useEffect(() => {
    api.getProducts({ active: true }).then(setProducts).catch(() => {});
    api.getPopularProducts(24).then(setPopular).catch(() => {});
    api.getMostSoldProducts(24).then(setMostSold).catch(() => {});
    api.getFeaturedProduct().then((arr) => setFeaturedList(arr)).catch(() => setFeaturedList([]));
    api.getCampaigns().then((c) => { setCampaigns(c.filter(x => x.is_active)); setCampaignsLoaded(true); }).catch(() => setCampaignsLoaded(true));
    api.getBrands().then(setBrands).catch(() => {});
    api.getBanners().then(setBanners).catch(() => {});
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

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => setBannerIdx(i => (i + 1) % banners.length), 4000);
    return () => clearInterval(id);
  }, [banners]);

  const featured = featuredList === undefined ? undefined : (featuredList[featuredIdx] ?? null);

  const byNewest = (arr: Product[]) => [...arr].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  const list1 = tab1 === "popular"
    ? byNewest(popular)
    : byNewest(products).slice(0, 24);

  const hasDiscount = (p: Product) => p.extra_price != null || p.sale_price != null || (p.old_price && p.old_price > p.price) || p.discount > 0;
  const list2 = tab2 === "bestseller"
    ? byNewest(mostSold)
    : byNewest(products).filter(hasDiscount).slice(0, 24);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-3 px-4 py-4 lg:grid-cols-3 lg:py-5">
        <div className="relative col-span-2 overflow-hidden rounded-2xl bg-neutral-900 text-white">
          {/* Carousel track */}
          <div className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${heroIdx * 100}%)` }}>
            {campaignsLoaded && campaigns.length === 0 ? (
              <div className="w-full flex-shrink-0 aspect-[16/9] sm:aspect-[2/1]">
                <img src={heroLiving} alt="Hero" className="w-full h-full object-cover opacity-90 saturate-150" />
              </div>
            ) : campaigns.map((camp) => {
              const url = getImageUrl(camp.image);
              if (!url) return null;
              const imgEl = (
                <div className="w-full aspect-[16/9] sm:aspect-[2/1] overflow-hidden">
                  <img src={url} alt={camp.title} className="w-full h-full object-cover" />
                </div>
              );
              return (
                <div key={camp.id} className="w-full flex-shrink-0">
                  {camp.link ? <a href={camp.link}>{imgEl}</a> : imgEl}
                </div>
              );
            })}
          </div>
          {campaigns.length > 1 && (
            <div className="absolute bottom-3 left-4 flex gap-1.5 z-10">
              {campaigns.map((_, i) => (
                <button key={i} onClick={() => setHeroIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === heroIdx ? "w-4 bg-white" : "w-1.5 bg-white/40"}`} />
              ))}
            </div>
          )}
        </div>

        {/* Featured — compact irshad.az style */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm flex flex-col group/featured">
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
            <div className="flex items-center gap-1">
              {featuredList && featuredList.length > 1 && (
                <>
                  <button onClick={() => setFeaturedIdx(i => (i - 1 + (featuredList?.length ?? 1)) % (featuredList?.length ?? 1))}
                    className="rounded-full bg-white/20 p-1 text-white hover:bg-white/40 transition opacity-0 group-hover/featured:opacity-100">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => setFeaturedIdx(i => (i + 1) % (featuredList?.length ?? 1))}
                    className="rounded-full bg-white/20 p-1 text-white hover:bg-white/40 transition opacity-0 group-hover/featured:opacity-100">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
            <FeaturedCountdown until={featured?._until} />
          </div>
          {featured === undefined ? (
            <div className="flex-1 p-6 text-center text-muted-foreground text-sm flex items-center justify-center">Yüklənir...</div>
          ) : featured ? (
            <Link to="/mehsul/$slug" params={{ slug: String(featured.id) }} className="flex flex-col flex-1 group">
              {(() => {
                const { activePrice, originalPrice } = calcPrice(featured);
                const discountPct = originalPrice ? Math.round((1 - activePrice / originalPrice) * 100) : 0;
                const savingAmt = originalPrice ? (originalPrice - activePrice) : 0;
                const months = featured._credit_months || 12;
                return (
                  <>
                    <div className="bg-secondary/20 px-4 pt-3 pb-2">
                      <ProductImg p={featured} className="mx-auto h-40 w-full rounded-lg object-contain transition duration-300 group-hover:scale-105" />
                    </div>
                    <div className="px-3 py-2.5 flex flex-col flex-1">
                      <h3 className="text-sm font-bold leading-snug line-clamp-2 text-foreground">{featured.name}</h3>
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <span className="text-xl font-black text-[var(--accent-orange)]">{activePrice} AZN</span>
                        {originalPrice && <span className="text-xs text-muted-foreground line-through">{originalPrice} AZN</span>}
                        {discountPct > 0 && <span className="rounded-full bg-[var(--accent-orange)] px-2 py-0.5 text-[10px] font-bold text-white">−{discountPct}%</span>}
                      </div>
                      {savingAmt > 0 && (
                        <div className="text-xs font-semibold text-green-600">{savingAmt.toFixed(0)} AZN qənaət</div>
                      )}
                      <div className="mt-1 text-xs text-muted-foreground">
                        Faizsiz · <span className="font-bold text-[var(--accent-orange)]">{(Math.ceil(activePrice / months * 100) / 100).toFixed(2)} AZN</span> / {months} ay
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button onClick={(e) => {
                          e.preventDefault();
                          addItem({ id: featured.id!, name: featured.name, price: activePrice, image: featured.image, qty: 1 });
                          navigate({ to: "/sebet" });
                        }}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--accent-orange)] py-2.5 text-sm font-bold text-white hover:opacity-90">
                          <ShoppingCart className="h-4 w-4" /> Bir kliklə al
                        </button>
                        <button onClick={(e) => {
                          e.preventDefault();
                          addItem({ id: featured.id!, name: featured.name, price: activePrice, image: featured.image, qty: 1 });
                        }}
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
              <div className="grid h-12 w-12 place-items-center rounded-full" style={{ backgroundColor: "rgba(20,184,166,0.1)" }}>
                <Icon className="h-6 w-6 text-[var(--brand)]" />
              </div>
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Banner Carousel */}
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <div className="relative overflow-hidden rounded-2xl">
          {banners.length > 0 ? (
            <>
              <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${bannerIdx * 100}%)` }}>
                {banners.map((b) => {
                  const url = getImageUrl(b.image);
                  return (
                    <div key={b.id} className="w-full flex-shrink-0">
                      {url
                        ? <div className="w-full aspect-[3/1] sm:aspect-[4/1] overflow-hidden rounded-2xl"><img src={url} alt="" className="w-full h-full object-cover block" /></div>
                        : <div className="h-48 bg-secondary rounded-2xl" />}
                    </div>
                  );
                })}
              </div>
              {banners.length > 1 && (
                <>
                  <button onClick={() => setBannerIdx(i => (i - 1 + banners.length) % banners.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-white/80 shadow hover:bg-white">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => setBannerIdx(i => (i + 1) % banners.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-white/80 shadow hover:bg-white">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {banners.map((_, i) => (
                      <button key={i} onClick={() => setBannerIdx(i)}
                        className={`h-1.5 rounded-full transition-all ${i === bannerIdx ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <AdPlaceholder />
          )}
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

      {/* Brand slider — footer üstündə */}
      {brands.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-6 pb-2">
          <div className="overflow-hidden rounded-2xl border border-border bg-card px-4 py-5">
            <div className="flex animate-marquee gap-8 items-center">
              {[...brands, ...brands].map((b, i) => {
                const url = getImageUrl(b.logo);
                return (
                  <a key={i} href={`/brend/${b.slug}`}
                    className="flex-shrink-0 flex h-16 w-36 items-center justify-center transition-all duration-300 hover:scale-105">
                    {url
                      ? <img src={url} alt={b.name} className="max-h-14 max-w-full object-contain" />
                      : <span className="text-sm font-bold text-muted-foreground">{b.name}</span>
                    }
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}

function AdPlaceholder() {
  const [dot, setDot] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDot(d => (d + 1) % 3), 800);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="relative flex h-48 md:h-64 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-secondary/60 via-secondary/30 to-secondary/60">
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "repeating-linear-gradient(45deg,currentColor 0,currentColor 1px,transparent 0,transparent 50%)", backgroundSize: "16px 16px" }} />
      <div className="relative flex flex-col items-center gap-3 text-center px-6">
        <div className="flex gap-2">
          {[0,1,2].map(i => (
            <div key={i} className={`h-2 w-2 rounded-full transition-all duration-300 ${i === dot ? "bg-[var(--brand)] scale-125" : "bg-muted-foreground/30"}`} />
          ))}
        </div>
        <p className="text-base font-semibold text-muted-foreground md:text-lg">Bura reklam yerləşdirə bilərsiniz</p>
        <p className="text-xs text-muted-foreground/60">Admin paneldən banner əlavə edin</p>
      </div>
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
        <div className="flex items-center gap-2">
          <Link to="/mehsullar/$filter" params={{ filter: activeTab }}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary transition-colors">
            Hamısı <ArrowRight className="h-3 w-3" />
          </Link>
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
    return <img src={url} alt={p.name} className={className ?? "h-full w-full object-contain"} loading="lazy" />;
  }
  return <div className="flex h-full w-full items-center justify-center text-5xl">{p.image || "📦"}</div>;
}

function calcPrice(p: Product) {
  // new system: sale_price / extra_price
  if (p.extra_price != null) return { activePrice: p.extra_price, originalPrice: p.price };
  if (p.sale_price != null) return { activePrice: p.sale_price, originalPrice: p.price };
  // legacy: old_price or discount
  if (p.old_price && p.old_price > p.price) return { activePrice: p.price, originalPrice: p.old_price };
  if (p.discount > 0) return { activePrice: Math.round(p.price * (1 - p.discount / 100)), originalPrice: p.price };
  return { activePrice: p.price, originalPrice: null };
}

function ProductCard({ p }: { p: Product }) {
  const { activePrice, originalPrice } = calcPrice(p);
  const discountPct = originalPrice ? Math.round((1 - activePrice / originalPrice) * 100) : 0;
  const savingAmt = originalPrice ? (originalPrice - activePrice) : 0;
  const months = p.credit_months || 12;

  return (
    <Link to="/mehsul/$slug" params={{ slug: String(p.id) }}
      className="group relative flex flex-col overflow-hidden rounded-xl md:rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-xl">
      {discountPct > 0 && (
        <div className="absolute right-2 top-2 md:right-3 md:top-3 z-10 flex flex-col items-end gap-1">
          <div className="rounded-lg bg-[var(--accent-orange)] px-2 py-0.5 text-xs font-bold text-white shadow-md">−{discountPct}%</div>
          <div className="rounded-lg bg-[var(--accent-orange)]/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-md">−{savingAmt.toFixed(0)} AZN</div>
        </div>
      )}
      <div className="absolute left-2 top-2 md:left-3 md:top-3 z-10 hidden md:flex flex-col gap-2">
        <button className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-muted-foreground shadow hover:text-[var(--brand)]"><Heart className="h-4 w-4" /></button>
        <button className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-muted-foreground shadow hover:text-[var(--brand)]"><Scale className="h-4 w-4" /></button>
      </div>
      <div className="aspect-[4/3] overflow-hidden bg-white">
        <ProductImg p={p} className="h-full w-full object-contain transition duration-500 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col p-3 md:p-4">
        
        <h3 className="line-clamp-2 min-h-[2.5rem] text-xs md:text-sm font-semibold">{p.name}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5 md:gap-2">
          {(p.stock > 0 || p.in_stock === 1) ? (
            <span className="inline-block rounded-md border border-[var(--brand)] px-1.5 md:px-2 py-0.5 text-xs font-semibold text-[var(--brand)]">Stokda var</span>
          ) : (
            <span className="inline-block rounded-md border border-red-300 px-1.5 md:px-2 py-0.5 text-xs font-semibold text-red-600">Stokda yoxdur</span>
          )}
        </div>
        <div className="mt-2 md:mt-3 flex items-baseline gap-2 flex-wrap">
          <span className="text-xl md:text-2xl font-black">{activePrice} AZN</span>
          {originalPrice && <span className="text-xs md:text-sm text-muted-foreground line-through">{originalPrice} AZN</span>}
        </div>
        {savingAmt > 0 && (
          <div className="mt-0.5 text-xs font-semibold text-[var(--accent-orange)]">
            {savingAmt.toFixed(2)} AZN qənaət · -{discountPct}%
          </div>
        )}
        {(p.ideal_credit_months ?? 0) > 0 ? (
          <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-[var(--brand)]">
            <Zap className="h-3 w-3" />{p.ideal_credit_months} aya kredit · {Math.ceil(activePrice * (1 + 0.176) / (p.ideal_credit_months || 12))} AZN/ay
          </div>
        ) : months > 0 ? (
          <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-[var(--brand)]">
            <Zap className="h-3 w-3" />{p.interest_free !== 0 ? "Faizsiz " : ""}{months} aya {(Math.ceil(activePrice / months * 100) / 100).toFixed(2)} AZN/ay
          </div>
        ) : null}
        {(p.stock > 0 || p.in_stock === 1) && (
          <button className="mt-3 md:mt-4 w-full rounded-lg bg-[var(--accent-orange)] py-2 md:py-2.5 text-center font-semibold text-white text-sm md:text-base transition hover:opacity-90">
            Səbətə əlavə et
          </button>
        )}
      </div>
    </Link>
  );
}
