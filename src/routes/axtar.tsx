import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { api, getImageUrl, type Product, type Category } from "@/lib/api";
import { SiteHeader, SiteFooter } from "@/components/SiteLayout";
import { Search } from "lucide-react";

export const Route = createFileRoute("/axtar")({
  validateSearch: z.object({ q: z.string().optional() }),
  component: SearchPage,
});

function calcActivePrice(p: Product) {
  if (p.extra_price != null) return p.extra_price;
  if (p.sale_price != null) return p.sale_price;
  if (p.old_price && p.old_price > p.price) return p.price;
  if (p.discount > 0) return Math.round(p.price * (1 - p.discount / 100));
  return p.price;
}

function ProductImg({ p }: { p: Product }) {
  const url = getImageUrl(p.image);
  if (!url) return <div className="h-full w-full flex items-center justify-center text-3xl bg-secondary/30">🛋️</div>;
  return <img src={url} alt={p.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />;
}

function SearchPage() {
  const { q = "" } = Route.useSearch();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCats, setAllCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getProducts({ active: true }),
      api.getCategoriesSearchIndex(),
    ]).then(([prods, cats]) => { setAllProducts(prods); setAllCats(cats); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const query = q.trim().toLowerCase();

  // build set of category slugs whose name matches query
  const matchingCatSlugs = new Set(
    allCats.filter(c => c.name.toLowerCase().includes(query)).map(c => c.slug)
  );

  const results = query.length >= 1
    ? allProducts.filter(p => {
        if (p.name.toLowerCase().includes(query)) return true;
        if ((p.description ?? "").toLowerCase().includes(query)) return true;
        if (p.category_slug && matchingCatSlugs.has(p.category_slug)) return true;
        try {
          const comps: { name: string }[] = JSON.parse(p.components || "[]");
          if (comps.some(c => c.name.toLowerCase().includes(query))) return true;
        } catch {}
        return false;
      })
    : [];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 min-h-[60vh]">
        <div className="mb-6 flex items-center gap-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-bold">
            {query ? <>"{q}" üzrə axtarış</> : "Axtarış"}
          </h1>
          {results.length > 0 && (
            <span className="text-sm text-muted-foreground">{results.length} nəticə</span>
          )}
        </div>

        {loading && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-secondary/40 aspect-[3/4]" />
            ))}
          </div>
        )}

        {!loading && query.length < 1 && (
          <p className="text-center text-muted-foreground py-16">Axtarmaq üçün yuxarıdakı axtarış qutusuna yazın</p>
        )}

        {!loading && query.length >= 1 && results.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">Nəticə tapılmadı</p>
            <p className="text-sm">"{q}" üzrə heç bir məhsul yoxdur</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {results.map(p => {
              const display = calcActivePrice(p);
              const original = p.extra_price != null ? p.price : p.sale_price != null ? p.price : p.old_price;
              const pct = original && original > display ? Math.round((1 - display / original) * 100) : p.discount > 0 ? p.discount : 0;
              let matchedComps: { name: string; price: number }[] = [];
              if (!p.name.toLowerCase().includes(query)) {
                try {
                  const comps: { name: string; price: number }[] = JSON.parse(p.components || "[]");
                  matchedComps = comps.filter(c => c.name.toLowerCase().includes(query));
                } catch {}
              }
              return (
                <Link key={p.id} to="/mehsul/$slug" params={{ slug: String(p.id) }}
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="aspect-[4/3] overflow-hidden bg-white">
                    <ProductImg p={p} />
                  </div>
                  <div className="p-3">
                    <div className="line-clamp-2 text-sm font-medium">{p.name}</div>
                    <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                      <span className="font-black text-base">{display} AZN</span>
                      {original && original > display && (
                        <span className="text-xs text-muted-foreground line-through">{original} AZN</span>
                      )}
                      {pct > 0 && (
                        <span className="rounded bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">−{pct}%</span>
                      )}
                    </div>
                    {matchedComps.length > 0 && (
                      <div className="mt-2 space-y-1 border-t border-border pt-2">
                        {matchedComps.map((c, i) => (
                          <div key={i} className="flex items-center justify-between gap-1">
                            <span className="text-xs text-muted-foreground truncate">{c.name}</span>
                            <span className="text-xs font-bold text-[var(--brand)] flex-shrink-0">{c.price} AZN</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
