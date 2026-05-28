import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, getImageUrl, type Product, type Brand, type Category } from "@/lib/api";
import { SiteHeader, SiteFooter } from "@/components/SiteLayout";
import { ChevronRight, Heart, Scale, Zap, ArrowLeft } from "lucide-react";
import { useCart } from "@/hooks/useCart";

export const Route = createFileRoute("/brend/$slug")({
  component: BrandPage,
});

function BrandPage() {
  const { slug } = Route.useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    setLoading(true);
    setSelectedCat(null);
    Promise.all([
      api.getBrands(),
      api.getProducts({ active: true }),
      api.getCategories(),
    ]).then(([brands, prods, cats]) => {
      setBrand(brands.find(b => b.slug === slug) ?? null);
      const brandProds = prods.filter(p => p.brand_slug === slug);
      setProducts(brandProds);
      // only categories that have at least 1 product from this brand
      const catSlugs = new Set(brandProds.map(p => p.category_slug).filter(Boolean));
      setCategories(cats.filter(c => catSlugs.has(c.slug)));
    }).finally(() => setLoading(false));
  }, [slug]);

  const logoUrl = brand ? getImageUrl(brand.logo) : null;
  const filtered = selectedCat ? products.filter(p => p.category_slug === selectedCat) : [];
  const selectedCatName = categories.find(c => c.slug === selectedCat)?.name ?? "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-3 py-4 md:px-4 md:py-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Çınarlı</Link>
          <ChevronRight className="h-3 w-3" />
          {selectedCat ? (
            <>
              <button onClick={() => setSelectedCat(null)} className="hover:text-foreground">{brand?.name ?? slug}</button>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground">{selectedCatName}</span>
            </>
          ) : (
            <span className="text-foreground">{brand?.name ?? slug}</span>
          )}
        </nav>

        {/* Brand header */}
        <div className="mt-4 flex items-center gap-4">
          {logoUrl && <img src={logoUrl} alt={brand?.name} className="h-12 object-contain" />}
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{brand?.name ?? slug}</h1>
            <p className="text-sm text-muted-foreground">
              {selectedCat ? `${filtered.length} məhsul · ${selectedCatName}` : `${products.length} məhsul`}
            </p>
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Yüklənir...</div>
          ) : !selectedCat ? (
            /* Category grid */
            products.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">Bu brendə aid məhsul yoxdur</div>
            ) : (
              <div>
                <p className="mb-4 text-sm font-semibold text-muted-foreground">Kateqoriya seçin</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {categories.map(cat => {
                    const count = products.filter(p => p.category_slug === cat.slug).length;
                    return (
                      <button key={cat.slug} onClick={() => setSelectedCat(cat.slug)}
                        className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center transition hover:-translate-y-1 hover:border-[var(--brand)] hover:shadow-lg">
                        <span className="text-3xl">{cat.icon || "📦"}</span>
                        <div>
                          <p className="text-sm font-semibold">{cat.name}</p>
                          <p className="text-xs text-muted-foreground">{count} məhsul</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            /* Product grid */
            <div>
              <button onClick={() => setSelectedCat(null)}
                className="mb-4 flex items-center gap-1.5 text-sm font-medium text-[var(--brand)] hover:opacity-80">
                <ArrowLeft className="h-4 w-4" /> Kateqoriyalara qayıt
              </button>
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">Bu kateqoriyada məhsul yoxdur</div>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {filtered.map((p) => {
                    const img = getImageUrl(p.image);
                    const { activePrice, originalPrice } = (() => {
                      if (p.extra_price != null) return { activePrice: p.extra_price, originalPrice: p.price };
                      if (p.sale_price != null) return { activePrice: p.sale_price, originalPrice: p.price };
                      if (p.old_price && p.old_price > p.price) return { activePrice: p.price, originalPrice: p.old_price };
                      if (p.discount > 0) return { activePrice: Math.round(p.price * (1 - p.discount / 100)), originalPrice: p.price };
                      return { activePrice: p.price, originalPrice: null as number | null };
                    })();
                    const discountPct = originalPrice ? Math.round((1 - activePrice / originalPrice) * 100) : 0;
                    const savingAmt = originalPrice ? (originalPrice - activePrice) : 0;
                    const months = p.credit_months || 24;
                    return (
                      <article key={p.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-xl">
                        {discountPct > 0 && (
                          <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1">
                            <div className="rounded-lg bg-[var(--accent-orange)] px-2 py-0.5 text-[10px] font-bold text-white shadow">−{discountPct}%</div>
                            <div className="rounded-lg bg-[var(--accent-orange)]/90 px-2 py-0.5 text-[9px] font-semibold text-white shadow">−{savingAmt.toFixed(0)} ₼</div>
                          </div>
                        )}
                        <div className="absolute left-2 top-2 z-10 flex flex-col gap-1.5">
                          <button className="grid h-7 w-7 place-items-center rounded-full bg-white/90 shadow hover:text-[var(--brand)]"><Heart className="h-3.5 w-3.5" /></button>
                          <button className="grid h-7 w-7 place-items-center rounded-full bg-white/90 shadow hover:text-[var(--brand)]"><Scale className="h-3.5 w-3.5" /></button>
                        </div>
                        <Link to="/mehsul/$slug" params={{ slug: String(p.id) }} className="aspect-[4/3] overflow-hidden bg-white block">
                          {img ? <img src={img} alt={p.name} className="h-full w-full object-contain transition duration-500 group-hover:scale-105" loading="lazy" />
                            : <div className="flex h-full items-center justify-center text-5xl">{p.image || "📦"}</div>}
                        </Link>
                        <div className="flex flex-1 flex-col p-3">
                          <Link to="/mehsul/$slug" params={{ slug: String(p.id) }} className="line-clamp-2 min-h-[2.5rem] text-xs font-medium hover:text-[var(--brand)]">{p.name}</Link>
                          <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-base font-black">{activePrice} ₼</span>
                            {originalPrice && <span className="text-xs text-muted-foreground line-through">{originalPrice} ₼</span>}
                          </div>
                          {savingAmt > 0 && (
                            <div className="mt-0.5 text-[10px] font-semibold text-[var(--accent-orange)]">{savingAmt.toFixed(2)} ₼ qənaət · -{discountPct}%</div>
                          )}
                          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--brand)]">
                            <Zap className="h-3 w-3" /> {p.interest_free !== 0 ? "Faizsiz " : ""}{months} aya {Math.round(activePrice / months)} ₼/ay
                          </div>
                          <button onClick={() => addItem({ id: p.id, name: p.name, price: activePrice, image: p.image })}
                            className="mt-2 w-full rounded-lg bg-[var(--brand)] py-1.5 text-xs font-semibold text-[var(--brand-foreground)] hover:opacity-90">
                            Səbətə əlavə et
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
