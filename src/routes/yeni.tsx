import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/SiteLayout";
import { api, getImageUrl, type Product } from "@/lib/api";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/yeni")({
  head: () => ({ meta: [{ title: "Yeni məhsullar — Çınarlı" }] }),
  component: YeniPage,
});

function YeniPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    api.getProducts({ active: true }).then((p) => setProducts(p.slice(0, 16))).catch(() => {});
  }, []);

  return (
    <PageShell title="Yeni məhsullar" subtitle="Kolleksiyamıza yeni əlavə olunan məhsullar.">
      {products.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">Admin paneldən məhsul əlavə edin</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((p) => (
            <Link key={p.id} to="/mehsul/$slug" params={{ slug: String(p.id) }}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-lg">
              <div className="relative aspect-[4/3] overflow-hidden bg-white">
                <span className="absolute left-3 top-3 z-10 inline-block rounded bg-[var(--brand)] px-2 py-0.5 text-xs font-bold text-white">YENİ</span>
                <ProductImg p={p} />
              </div>
              <div className="p-4">
                <div className="line-clamp-2 text-sm font-medium">{p.name}</div>
                <div className="mt-2 font-black">{p.price} ₼</div>
                {p.old_price && <div className="text-xs text-muted-foreground line-through">{p.old_price} ₼</div>}
                <div className="mt-1 flex items-center gap-1 text-xs text-[var(--brand)]"><Zap className="h-3 w-3" /> Aylıq {Math.round(p.price / 12)} ₼-dan</div>
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
