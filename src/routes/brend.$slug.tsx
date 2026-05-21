import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, getImageUrl, type Product, type Brand } from "@/lib/api";
import { SiteHeader, SiteFooter } from "@/components/SiteLayout";
import { ChevronRight, Heart, Scale, Zap } from "lucide-react";
import { useCart } from "@/hooks/useCart";

export const Route = createFileRoute("/brend/$slug")({
  component: BrandPage,
});

function BrandPage() {
  const { slug } = Route.useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getBrands(),
      api.getProducts({ active: true }),
    ]).then(([brands, prods]) => {
      setBrand(brands.find(b => b.slug === slug) ?? null);
      setProducts(prods.filter(p => p.brand_slug === slug));
    }).finally(() => setLoading(false));
  }, [slug]);

  const logoUrl = brand ? getImageUrl(brand.logo) : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-3 py-4 md:px-4 md:py-6">
        <nav className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Çınarlı</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{brand?.name ?? slug}</span>
        </nav>

        <div className="mt-4 flex items-center gap-4">
          {logoUrl && <img src={logoUrl} alt={brand?.name} className="h-12 object-contain" />}
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{brand?.name ?? slug}</h1>
            <p className="text-sm text-muted-foreground">{products.length} məhsul</p>
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Yüklənir...</div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Bu brendə aid məhsul yoxdur</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => {
                const img = getImageUrl(p.image);
                const months = p.credit_months || 24;
                return (
                  <article key={p.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-xl">
                    {p.discount > 0 && (
                      <div className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-[var(--accent-orange)] text-[10px] font-bold text-white shadow">−{p.discount}%</div>
                    )}
                    <div className="absolute left-2 top-2 z-10 flex flex-col gap-1.5">
                      <button className="grid h-7 w-7 place-items-center rounded-full bg-white/90 shadow hover:text-[var(--brand)]"><Heart className="h-3.5 w-3.5" /></button>
                      <button className="grid h-7 w-7 place-items-center rounded-full bg-white/90 shadow hover:text-[var(--brand)]"><Scale className="h-3.5 w-3.5" /></button>
                    </div>
                    <Link to="/mehsul/$slug" params={{ slug: String(p.id) }} className="aspect-square overflow-hidden bg-secondary/30 block">
                      {img ? <img src={img} alt={p.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" loading="lazy" />
                        : <div className="flex h-full items-center justify-center text-5xl">{p.image || "📦"}</div>}
                    </Link>
                    <div className="flex flex-1 flex-col p-3">
                      <Link to="/mehsul/$slug" params={{ slug: String(p.id) }} className="line-clamp-2 min-h-[2.5rem] text-xs font-medium hover:text-[var(--brand)]">{p.name}</Link>
                      <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-base font-black">{p.price} ₼</span>
                        {p.old_price && <span className="text-xs text-muted-foreground line-through">{p.old_price} ₼</span>}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--brand)]">
                        <Zap className="h-3 w-3" /> {p.interest_free !== 0 ? "Faizsiz " : ""}{months} aya {Math.round(p.price / months)} ₼/ay
                      </div>
                      <button onClick={() => addItem({ id: p.id, name: p.name, price: p.price, image: p.image, stock: p.stock })}
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
      </div>
      <SiteFooter />
    </div>
  );
}
