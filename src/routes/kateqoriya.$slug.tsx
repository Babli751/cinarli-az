import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Heart, Scale, Zap, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { api, getImageUrl, type Product, type Category } from "@/lib/api";
import { SiteHeader, SiteFooter } from "@/components/SiteLayout";
import { CategoryIcon } from "@/components/CategoryIcon";
import { SpinWheelBanner } from "@/components/SpinWheel";

const searchSchema = z.object({
  sort: fallback(z.enum(["popular", "price-asc", "price-desc", "discount"]), "popular").optional(),
  min: fallback(z.number(), 0).optional(),
  max: fallback(z.number(), 99999).optional(),
});

export const Route = createFileRoute("/kateqoriya/$slug")({
  validateSearch: zodValidator(searchSchema),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { sort: _sort, min: _min, max: _max } = Route.useSearch();
  const sort = _sort ?? "popular";
  const min = _min ?? 0;
  const max = _max ?? 99999;
  const navigate = Route.useNavigate();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catsLoaded, setCatsLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  // null = all products; string = filter by that sub slug
  const [subFilter, setSubFilter] = useState<string | null>(null);

  useEffect(() => {
    api.getProducts({ active: true }).then(setAllProducts).catch(() => {});
    api.getCategories().then((cats) => { setCategories(cats); setCatsLoaded(true); }).catch(() => { setCatsLoaded(true); });
  }, []);

  useEffect(() => { setSubFilter(null); }, [slug]);

  const cat = categories.find((c) => c.slug === slug);
  const subCats = categories.filter((c) => cat && Number(c.parent_id) === Number(cat.id));
  const isParent = catsLoaded && subCats.length > 0;
  // top-level parent (no parent_id) → show subcategory grid, not products
  const isTopLevel = catsLoaded && isParent && !cat?.parent_id;
  const showProducts = !isTopLevel;

  const filtered = useMemo(() => {
    let list: Product[];
    if (isParent) {
      const subSlugs = subCats.map((c) => c.slug);
      const allSlugs = [slug, ...subSlugs];
      list = allProducts.filter((p) => allSlugs.includes(p.category_slug ?? ""));
      if (subFilter) list = list.filter((p) => p.category_slug === subFilter);
    } else {
      list = allProducts.filter((p) => p.category_slug === slug);
    }
    list = list.filter((p) => p.price >= min && p.price <= max);
    if (search.trim()) list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    switch (sort) {
      case "price-asc": list = [...list].sort((a, b) => a.price - b.price); break;
      case "price-desc": list = [...list].sort((a, b) => b.price - a.price); break;
      case "discount": list = [...list].sort((a, b) => b.discount - a.discount); break;
    }
    return list;
  }, [allProducts, slug, sort, min, max, search, subFilter, isParent, subCats]);

  const resetFilters = () => { setSearch(""); navigate({ search: {} }); };

  const FilterPanel = () => (
    <div className="space-y-4">
      <label className="block text-xs font-medium text-muted-foreground">Axtarış</label>
      <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Məhsul adı..."
        className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
      <label className="block text-xs font-medium text-muted-foreground">Qiymət (AZN)</label>
      <div className="flex gap-2">
        <input type="number" value={min || ""} placeholder="Min"
          onChange={(e) => { const v = Number(e.target.value); navigate({ search: (prev: any) => ({ ...prev, min: v || undefined }) }); }}
          className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
        <input type="number" value={max === 99999 ? "" : max} placeholder="Max"
          onChange={(e) => { const v = Number(e.target.value); navigate({ search: (prev: any) => ({ ...prev, max: v || undefined }) }); }}
          className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
      </div>
      <label className="block text-xs font-medium text-muted-foreground">Sıralama</label>
      <select value={sort} onChange={(e) => { const v = e.target.value; navigate({ search: (prev: any) => ({ ...prev, sort: v === "popular" ? undefined : v }) }); }}
        className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]">
        <option value="popular">Populyarlıq</option>
        <option value="price-asc">Qiymət: ucuzdan</option>
        <option value="price-desc">Qiymət: bahadan</option>
        <option value="discount">Ən böyük endirim</option>
      </select>
      <button onClick={resetFilters} className="w-full rounded-lg border border-border py-2 text-sm hover:bg-secondary">
        Filtrləri sıfırla
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-3 py-4 md:px-4 md:py-6">
        <nav className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground md:text-sm">
          <Link to="/" className="hover:text-foreground">Manqo</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{cat?.name ?? slug}</span>
        </nav>
        <h1 className="mt-2 text-2xl font-bold md:mt-3 md:text-3xl">{cat?.name ?? slug}</h1>

        {/* Featured product banner */}
        {(() => {
          if (allProducts.length === 0) return null;
          const slugsInScope = isParent
            ? [slug, ...subCats.map(c => c.slug)]
            : [slug];
          const pool = allProducts.filter(p => slugsInScope.includes(p.category_slug ?? ""));
          if (pool.length === 0) return null;
          const pinned = cat?.featured_product_id
            ? allProducts.find(p => p.id === cat.featured_product_id)
            : null;
          const bannerMonths = cat?.banner_credit_months || null;
          const calcMonthly = (p: typeof pool[0]) => {
            const ap = p.extra_price ?? p.sale_price ?? (p.old_price && p.old_price > p.price ? p.price : p.discount > 0 ? Math.round(p.price * (1 - p.discount / 100)) : p.price);
            const months = bannerMonths || p.credit_months || 12;
            return { p, monthly: Math.ceil(ap / months * 100) / 100, months };
          };
          const cheapest = pinned
            ? calcMonthly(pinned)
            : calcMonthly(pool[Math.floor(Math.random() * pool.length)]);
          const url = getImageUrl(cheapest.p.image);
          return (
            <Link to="/mehsul/$slug" params={{ slug: String(cheapest.p.id) }}
              className="mt-3 flex items-center gap-4 rounded-2xl border border-[var(--brand)]/30 bg-gradient-to-r from-[var(--brand)]/5 to-transparent px-4 py-3 hover:border-[var(--brand)]/60 transition-colors">
              {url && <img src={url} alt="" className="h-14 w-14 flex-shrink-0 rounded-xl object-contain bg-white" />}
              <div className="flex-1 min-w-0">
                <p className="line-clamp-1 text-sm font-semibold">{cheapest.p.name}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs text-muted-foreground">{cheapest.months} aya · ayda cəmi</p>
                <p className="rounded-xl border-2 border-[var(--brand)] px-3 py-1 text-lg font-black text-[var(--brand)]">{cheapest.monthly.toFixed(2)} AZN</p>
              </div>
            </Link>
          );
        })()}        {/* Featured product banner */}
        {(() => {
          if (allProducts.length === 0) return null;
          const slugsInScope = isParent
            ? [slug, ...subCats.map(c => c.slug)]
            : [slug];
          const pool = allProducts.filter(p => slugsInScope.includes(p.category_slug ?? ""));
          if (pool.length === 0) return null;
          const pinned = cat?.featured_product_id
            ? allProducts.find(p => p.id === cat.featured_product_id)
            : null;
          const bannerMonths = cat?.banner_credit_months || null;
          const calcMonthly = (p: typeof pool[0]) => {
            const ap = p.extra_price ?? p.sale_price ?? (p.old_price && p.old_price > p.price ? p.price : p.discount > 0 ? Math.round(p.price * (1 - p.discount / 100)) : p.price);
            const months = bannerMonths || p.credit_months || 12;
            return { p, monthly: Math.ceil(ap / months * 100) / 100, months };
          };
          const cheapest = pinned
            ? calcMonthly(pinned)
            : calcMonthly(pool[Math.floor(Math.random() * pool.length)]);
          const url = getImageUrl(cheapest.p.image);
          return (
            <Link to="/mehsul/$slug" params={{ slug: String(cheapest.p.id) }}
              className="mt-3 flex items-center gap-4 rounded-2xl border border-[var(--brand)]/30 bg-gradient-to-r from-[var(--brand)]/5 to-transparent px-4 py-3 hover:border-[var(--brand)]/60 transition-colors">
              {url && <img src={url} alt="" className="h-14 w-14 flex-shrink-0 rounded-xl object-contain bg-white" />}
              <div className="flex-1 min-w-0">
                <p className="line-clamp-1 text-sm font-semibold">{cheapest.p.name}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs text-muted-foreground">{cheapest.months} aya · ayda cəmi</p>
                <p className="rounded-xl border-2 border-[var(--brand)] px-3 py-1 text-lg font-black text-[var(--brand)]">{cheapest.monthly.toFixed(2)} AZN</p>
              </div>
            </Link>
          );
        })()}

        {/* Category chips — only parent categories, horizontal scroll on mobile */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none md:flex-wrap md:overflow-visible">
          {categories.filter(c => !c.parent_id).map((c) => (
            <Link key={c.slug} to="/kateqoriya/$slug" params={{ slug: c.slug }}
              className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm ${c.slug === slug || categories.find(s => s.slug === slug)?.parent_id === c.id
                ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)]"
                : "border-border bg-card hover:border-[var(--brand)] hover:text-[var(--brand)]"}`}>
              {c.name}
            </Link>
          ))}
        </div>

        {/* Mobile filter bar — only for non-top-level */}
        {showProducts && (
          <div className="mt-4 flex items-center justify-between lg:hidden">
            <p className="text-sm text-muted-foreground">{filtered.length} məhsul</p>
            <button onClick={() => setFilterOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary">
              <SlidersHorizontal className="h-4 w-4" /> Filtrlər
            </button>
          </div>
        )}

        {/* Mobile filter drawer */}
        {filterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setFilterOpen(false)}>
            <div className="absolute inset-0 bg-black/50" />
            <div onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-background p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold">Filtrlər</h3>
                <button onClick={() => setFilterOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-secondary">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <FilterPanel />
              <button onClick={() => setFilterOpen(false)}
                className="mt-4 w-full rounded-xl bg-[var(--brand)] py-3 font-semibold text-[var(--brand-foreground)]">
                Tətbiq et
              </button>
            </div>
          </div>
        )}

        {/* Spin wheel — only on top-level */}
        {isTopLevel && (
          <SpinWheelBanner onLogin={() => navigate({ to: "/kabinet" })} />
        )}

        {/* Top-level parent: subcategory card grid */}
        {isTopLevel && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {subCats.map((s) => (
              <Link
                key={s.slug}
                to="/kateqoriya/$slug"
                params={{ slug: s.slug }}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card px-3 py-5 text-center transition hover:border-[var(--brand)] hover:shadow-md active:scale-95">
                <CategoryIcon slug={s.slug} className="h-10 w-10 text-[var(--brand)]" />
                <span className="text-sm font-semibold leading-tight">{s.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(() => {
                    const childSlugs = categories.filter(c => Number(c.parent_id) === Number(s.id)).map(c => c.slug);
                    return allProducts.filter(p => [s.slug, ...childSlugs].includes(p.category_slug ?? "")).length;
                  })()} məhsul
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Sub-category filter chips — only for non-top-level parents */}
        {isParent && !isTopLevel && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSubFilter(null)}
              className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                subFilter === null
                  ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)]"
                  : "border-border bg-card hover:border-[var(--brand)] hover:text-[var(--brand)]"
              }`}>
              Hamısı
            </button>
            {subCats.map((s) => {
              const hasChildren = categories.some(c => Number(c.parent_id) === Number(s.id));
              return hasChildren ? (
                <Link
                  key={s.slug}
                  to="/kateqoriya/$slug"
                  params={{ slug: s.slug }}
                  className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    subFilter === s.slug
                      ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)]"
                      : "border-border bg-card hover:border-[var(--brand)] hover:text-[var(--brand)]"
                  }`}>
                  {s.name}
                </Link>
              ) : (
                <button
                  key={s.slug}
                  onClick={() => setSubFilter(s.slug)}
                  className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    subFilter === s.slug
                      ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)]"
                      : "border-border bg-card hover:border-[var(--brand)] hover:text-[var(--brand)]"
                  }`}>
                  {s.name}
                </button>
              );
            })}
          </div>
        )}

        {showProducts && <div className="mt-4 grid grid-cols-1 gap-4 lg:mt-8 lg:grid-cols-[260px_1fr] lg:gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden rounded-2xl border border-border bg-card p-5 lg:block">
            <h3 className="mb-4 font-bold">Filtrlər</h3>
            <FilterPanel />
          </aside>

          <div>
            <p className="mb-3 hidden text-sm text-muted-foreground lg:block">{filtered.length} məhsul tapıldı</p>
            {filtered.length === 0 ? null : (
              <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3">
                {filtered.map((p) => {
                  const { activePrice, originalPrice } = (() => {
                    if (p.extra_price != null) return { activePrice: p.extra_price, originalPrice: p.price };
                    if (p.sale_price != null) return { activePrice: p.sale_price, originalPrice: p.price };
                    if (p.old_price && p.old_price > p.price) return { activePrice: p.price, originalPrice: p.old_price };
                    if (p.discount > 0) return { activePrice: Math.round(p.price * (1 - p.discount / 100)), originalPrice: p.price };
                    return { activePrice: p.price, originalPrice: null as number | null };
                  })();
                  const discountPct = originalPrice ? Math.round((1 - activePrice / originalPrice) * 100) : 0;
                  const savingAmt = originalPrice ? (originalPrice - activePrice) : 0;
                  const months = p.credit_months || 12;
                  return (
                  <article key={p.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-xl">
                    {discountPct > 0 && (
                      <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1 md:right-3 md:top-3">
                        <div className="rounded-lg bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-yellow-900 shadow-md md:text-xs">−{discountPct}%</div>
                        <div className="rounded-lg bg-yellow-400 px-2 py-0.5 text-[9px] font-semibold text-yellow-900 shadow-md md:text-[10px]">−{savingAmt.toFixed(0)} AZN</div>
                      </div>
                    )}
                    <div className="absolute left-2 top-2 z-10 flex flex-col gap-1.5 md:left-3 md:top-3 md:gap-2">
                      <button className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-muted-foreground shadow hover:text-[var(--brand)] md:h-8 md:w-8"><Heart className="h-3.5 w-3.5 md:h-4 md:w-4" /></button>
                      <button className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-muted-foreground shadow hover:text-[var(--brand)] md:h-8 md:w-8"><Scale className="h-3.5 w-3.5 md:h-4 md:w-4" /></button>
                    </div>
                    <Link to="/mehsul/$slug" params={{ slug: String(p.id) }} className="relative aspect-[4/3] overflow-hidden bg-white block">
                      <ProductImg p={p} />
                      {(p.credit_months == null || p.credit_months > 0) && (
                        <div className="absolute left-2 bottom-2 z-10">
                          <div className="rounded-xl bg-[var(--brand)] text-white text-center px-2 py-1 leading-tight shadow-lg">
                            <div className="text-[11px] font-black">{p.credit_months || 24} AYA</div>
                            <div className="text-[9px] font-bold">FAİZSİZ</div>
                          </div>
                        </div>
                      )}
                    </Link>
                    <div className="flex flex-1 flex-col p-3 md:p-4">
                      
                      <Link to="/mehsul/$slug" params={{ slug: String(p.id) }} className="line-clamp-2 min-h-[2.5rem] text-xs font-medium hover:text-[var(--brand)] md:text-sm">{p.name}</Link>
                      <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-base font-black md:text-xl">{activePrice} AZN</span>
                        {originalPrice && <span className="text-xs text-muted-foreground line-through md:text-sm">{originalPrice} AZN</span>}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-yellow-500 md:text-xs truncate"><Zap className="h-3 w-3 flex-shrink-0" /><span className="truncate">{p.interest_free !== 0 ? "Faizsiz " : ""}{months} aya {(Math.ceil(activePrice / months * 100) / 100).toFixed(2)} AZN/ay</span></div>
                      <button className="mt-2 w-full rounded-lg bg-[var(--brand)] py-1.5 text-xs font-semibold text-[var(--brand-foreground)] hover:opacity-90 md:mt-3 md:py-2 md:text-sm">
                        Səbətə əlavə et
                      </button>
                    </div>
                  </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>}
      </div>
      <SiteFooter />
    </div>
  );
}

function ProductImg({ p }: { p: Product }) {
  const url = getImageUrl(p.image);
  if (url) {
    return <img src={url} alt={p.name} className="h-full w-full object-contain transition duration-500 group-hover:scale-105" loading="lazy" />;
  }
  return <div className="flex h-full w-full items-center justify-center text-5xl">{p.image || "📦"}</div>;
}
