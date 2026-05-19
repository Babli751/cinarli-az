import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Heart, Scale, Zap, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { api, getImageUrl, type Product, type Category } from "@/lib/api";
import { SiteHeader, SiteFooter } from "@/components/SiteLayout";

const searchSchema = z.object({
  sort: fallback(z.enum(["popular", "price-asc", "price-desc", "discount"]), "popular").default("popular"),
  min: fallback(z.number(), 0).default(0),
  max: fallback(z.number(), 99999).default(99999),
});

export const Route = createFileRoute("/kateqoriya/$slug")({
  validateSearch: zodValidator(searchSchema),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { sort, min, max } = Route.useSearch();
  const navigate = Route.useNavigate();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    api.getProducts({ active: true }).then(setAllProducts).catch(() => {});
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  const cat = categories.find((c) => c.slug === slug);

  const filtered = useMemo(() => {
    let list = allProducts.filter((p) => p.category_slug === slug);
    list = list.filter((p) => p.price >= min && p.price <= max);
    if (search.trim()) list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    switch (sort) {
      case "price-asc": list = [...list].sort((a, b) => a.price - b.price); break;
      case "price-desc": list = [...list].sort((a, b) => b.price - a.price); break;
      case "discount": list = [...list].sort((a, b) => b.discount - a.discount); break;
    }
    return list;
  }, [allProducts, slug, sort, min, max, search]);

  const resetFilters = () => { setSearch(""); navigate({ search: { sort: "popular", min: 0, max: 99999 } }); };

  const FilterPanel = () => (
    <div className="space-y-4">
      <label className="block text-xs font-medium text-muted-foreground">Axtarış</label>
      <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Məhsul adı..."
        className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
      <label className="block text-xs font-medium text-muted-foreground">Qiymət (₼)</label>
      <div className="flex gap-2">
        <input type="number" value={min || ""} placeholder="Min"
          onChange={(e) => navigate({ search: (prev: any) => ({ ...prev, min: Number(e.target.value) || 0 }) })}
          className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
        <input type="number" value={max === 99999 ? "" : max} placeholder="Max"
          onChange={(e) => navigate({ search: (prev: any) => ({ ...prev, max: Number(e.target.value) || 99999 }) })}
          className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
      </div>
      <label className="block text-xs font-medium text-muted-foreground">Sıralama</label>
      <select value={sort} onChange={(e) => navigate({ search: (prev: any) => ({ ...prev, sort: e.target.value }) })}
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
          <Link to="/" className="hover:text-foreground">Çınarlı</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{cat?.name ?? slug}</span>
        </nav>
        <h1 className="mt-2 text-2xl font-bold md:mt-3 md:text-3xl">{cat?.name ?? slug}</h1>

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

        {/* Mobile filter bar */}
        <div className="mt-4 flex items-center justify-between lg:hidden">
          <p className="text-sm text-muted-foreground">{filtered.length} məhsul</p>
          <button onClick={() => setFilterOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary">
            <SlidersHorizontal className="h-4 w-4" /> Filtrlər
          </button>
        </div>

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

        {/* Sub-categories grid — shown when a parent category is selected */}
        {(() => {
          const subs = categories.filter(c => c.parent_id === cat?.id);
          if (subs.length === 0) return null;
          return (
            <div className="mt-4 md:mt-6">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                {subs.map(s => (
                  <Link key={s.slug} to="/kateqoriya/$slug" params={{ slug: s.slug }}
                    className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-2 py-3 text-center transition hover:border-[var(--brand)] hover:shadow-md">
                    <span className="text-xs font-medium leading-tight line-clamp-2">{s.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}

        <div className="mt-4 grid grid-cols-1 gap-4 lg:mt-8 lg:grid-cols-[260px_1fr] lg:gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden rounded-2xl border border-border bg-card p-5 lg:block">
            <h3 className="mb-4 font-bold">Filtrlər</h3>
            <FilterPanel />
          </aside>

          <div>
            <p className="mb-3 hidden text-sm text-muted-foreground lg:block">{filtered.length} məhsul tapıldı</p>
            {filtered.length === 0 ? null : (
              <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3">
                {filtered.map((p) => (
                  <article key={p.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-xl">
                    {p.discount > 0 && (
                      <div className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-[var(--accent-orange)] text-[10px] font-bold text-white shadow-md md:right-3 md:top-3 md:h-11 md:w-11 md:text-xs">−{p.discount}%</div>
                    )}
                    <div className="absolute left-2 top-2 z-10 flex flex-col gap-1.5 md:left-3 md:top-3 md:gap-2">
                      <button className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-muted-foreground shadow hover:text-[var(--brand)] md:h-8 md:w-8"><Heart className="h-3.5 w-3.5 md:h-4 md:w-4" /></button>
                      <button className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-muted-foreground shadow hover:text-[var(--brand)] md:h-8 md:w-8"><Scale className="h-3.5 w-3.5 md:h-4 md:w-4" /></button>
                    </div>
                    <Link to="/mehsul/$slug" params={{ slug: String(p.id) }} className="aspect-square overflow-hidden bg-secondary/30 block">
                      <ProductImg p={p} />
                    </Link>
                    <div className="flex flex-1 flex-col p-3 md:p-4">
                      <Link to="/mehsul/$slug" params={{ slug: String(p.id) }} className="line-clamp-2 min-h-[2.5rem] text-xs font-medium hover:text-[var(--brand)] md:text-sm">{p.name}</Link>
                      <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-base font-black md:text-xl">{p.price} ₼</span>
                        {p.old_price && <span className="text-xs text-muted-foreground line-through md:text-sm">{p.old_price} ₼</span>}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--brand)] md:text-xs"><Zap className="h-3 w-3" /> {p.interest_free !== 0 ? "Faizsiz" : ""} {p.credit_months || 24} aya {Math.round(p.price / (p.credit_months || 24))} ₼/ay</div>
                      <button className="mt-2 w-full rounded-lg bg-[var(--brand)] py-1.5 text-xs font-semibold text-[var(--brand-foreground)] hover:opacity-90 md:mt-3 md:py-2 md:text-sm">
                        Səbətə əlavə et
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function ProductImg({ p }: { p: Product }) {
  const url = getImageUrl(p.image);
  if (url) {
    return <img src={url} alt={p.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" loading="lazy" />;
  }
  return <div className="flex h-full w-full items-center justify-center text-5xl">{p.image || "📦"}</div>;
}
