import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/SiteLayout";
import { api, getImageUrl, type Product } from "@/lib/api";

export const Route = createFileRoute("/outlet")({
  head: () => ({ meta: [{ title: "Outlet — Çınarlı" }, { name: "description", content: "Anbar boşaltma və outlet məhsulları." }] }),
  component: OutletPage,
});

function OutletPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    api.getProducts({ active: true }).then((p) => setProducts(p.filter((x) => x.discount >= 20))).catch(() => {});
  }, []);

  return (
    <PageShell title="Outlet" subtitle="Stok boşaltma — son ədədlər, ən aşağı qiymətə.">
      {products.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">Hal-hazırda outlet məhsulu yoxdur</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((p) => (
            <Link key={p.id} to="/mehsul/$slug" params={{ slug: String(p.id) }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-lg">
              {p.discount > 0 && (
                <span className="absolute right-3 top-3 z-10 rounded-full bg-[var(--accent-orange)] px-2 py-0.5 text-xs font-bold text-white shadow">−{p.discount}%</span>
              )}
              <div className="aspect-[4/3] overflow-hidden bg-white">
                <ProductImg p={p} />
              </div>
              <div className="p-4">
                <div className="line-clamp-2 text-sm font-medium">{p.name}</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-black">{p.price} AZN</span>
                  {p.old_price && <span className="text-xs text-muted-foreground line-through">{p.old_price} AZN</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function ProductImg({ p }: { p: Product }) {
  const url = getImageUrl(p.image);
  if (url) {
    return <img src={url} alt={p.name} className="h-full w-full object-contain transition duration-500 group-hover:scale-105" loading="lazy" />;
  }
  return <div className="flex h-full w-full items-center justify-center text-5xl">{p.image || "📦"}</div>;
}
