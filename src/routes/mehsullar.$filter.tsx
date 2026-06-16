import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, getImageUrl, type Product } from "@/lib/api";
import { SiteHeader, SiteFooter } from "@/components/SiteLayout";
import { Zap, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/mehsullar/$filter")({
  component: FilterPage,
});

const FILTER_META: Record<string, { label: string; description: string }> = {
  popular:    { label: "Populyar məhsullar",   description: "Ən çox bəyənilən məhsullar" },
  new:        { label: "Yeni məhsullar",        description: "Ən son əlavə olunan məhsullar" },
  bestseller: { label: "Çox satılan məhsullar", description: "Ən çox satılan məhsullar" },
  discount:   { label: "Endirimli məhsullar",   description: "Xüsusi qiymətlə təklif olunan məhsullar" },
};

function calcActivePrice(p: Product) {
  if (p.extra_price != null) return p.extra_price;
  if (p.sale_price != null) return p.sale_price;
  if (p.old_price && p.old_price > p.price) return p.price;
  if (p.discount > 0) return Math.round(p.price * (1 - p.discount / 100));
  return p.price;
}

function FilterPage() {
  const { filter } = Route.useParams();
  const meta = FILTER_META[filter] ?? { label: "Məhsullar", description: "" };

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const load = async () => {
      try {
        if (filter === "popular") {
          setProducts(await api.getPopularProducts(100));
        } else if (filter === "bestseller") {
          setProducts(await api.getMostSoldProducts(100));
        } else if (filter === "new") {
          const all = await api.getProducts({ active: true });
          setProducts([...all].sort((a, b) => (b.id ?? 0) - (a.id ?? 0)));
        } else if (filter === "discount") {
          const all = await api.getProducts({ active: true });
          setProducts(all.filter(p => p.extra_price != null || p.sale_price != null || (p.old_price && p.old_price > p.price) || p.discount > 0));
        } else {
          setProducts(await api.getProducts({ active: true }));
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [filter]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Manqo</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{meta.label}</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-black md:text-3xl">{meta.label}</h1>
          {meta.description && <p className="mt-1 text-muted-foreground text-sm">{meta.description}</p>}
          {!loading && <p className="mt-1 text-xs text-muted-foreground">{products.length} məhsul</p>}
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Yüklənir...</div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">Məhsul tapılmadı</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {products.map(p => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

function ProductCard({ p }: { p: Product }) {
  const activePrice = calcActivePrice(p);
  const originalPrice = (() => {
    if (p.extra_price != null) return p.price;
    if (p.sale_price != null) return p.price;
    if (p.old_price && p.old_price > p.price) return p.old_price;
    if (p.discount > 0) return p.price;
    return null;
  })();
  const discountPct = originalPrice ? Math.round((1 - activePrice / originalPrice) * 100) : 0;
  const savingAmt = originalPrice ? originalPrice - activePrice : 0;
  const months = p.credit_months || 12;
  const url = getImageUrl(p.image);

  return (
    <Link to="/mehsul/$slug" params={{ slug: String(p.id) }}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-xl">
      {discountPct > 0 && (
        <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1">
          <div className="rounded-lg bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900 shadow">−{discountPct}%</div>
          <div className="rounded-lg bg-yellow-400 px-2 py-0.5 text-[10px] font-semibold text-yellow-900 shadow">−{savingAmt.toFixed(0)} AZN</div>
        </div>
      )}
      <div className="relative aspect-[4/3] overflow-hidden bg-white">
        {url
          ? <img src={url} alt={p.name} className="h-full w-full object-contain transition duration-500 group-hover:scale-105" loading="lazy" />
          : <div className="flex h-full w-full items-center justify-center text-5xl">{p.image || "📦"}</div>}
        {(p.credit_months == null || p.credit_months > 0) && (
          <div className="absolute left-2 bottom-2 z-10">
            <div className="rounded-xl bg-[var(--brand)] text-white text-center px-2 py-1 leading-tight shadow-lg">
              <div className="text-[11px] font-black">{p.credit_months || 24} AYA</div>
              <div className="text-[9px] font-bold">FAİZSİZ</div>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        
        <h3 className="line-clamp-2 min-h-[2.5rem] text-xs font-semibold md:text-sm">{p.name}</h3>
        <div className="mt-1.5">
          {(p.stock > 0 || p.in_stock === 1) ? (
            <span className="inline-block rounded-md border border-[var(--brand)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--brand)]">Stokda var</span>
          ) : (
            <span className="inline-block rounded-md border border-red-300 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">Stokda yoxdur</span>
          )}
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-xl font-black">{activePrice} AZN</span>
          {originalPrice && <span className="text-xs text-muted-foreground line-through">{originalPrice} AZN</span>}
        </div>
        <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-yellow-500 truncate">
          <Zap className="h-3 w-3 flex-shrink-0" /><span className="truncate">{months} aya {(Math.ceil(activePrice / months * 100) / 100).toFixed(2)} AZN/ay</span>
        </div>
      </div>
    </Link>
  );
}
