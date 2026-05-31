import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/SiteLayout";
import { api, getImageUrl, type Product, type Campaign, type Category } from "@/lib/api";
import { Calendar } from "lucide-react";

export const Route = createFileRoute("/kampaniyalar")({
  head: () => ({ meta: [{ title: "Kampaniyalar — Çınarlı" }, { name: "description", content: "Aktiv kampaniyalar, mövsümi endirimlər və xüsusi təkliflər." }] }),
  component: KampaniyalarPage,
});

function KampaniyalarPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.getCampaigns().then((c) => setCampaigns(c.filter((x) => x.is_active))).catch(() => {});
    api.getProducts({ active: true }).then((p) => setProducts([...p].sort((a, b) => b.discount - a.discount).slice(0, 8))).catch(() => {});
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  return (
    <PageShell title="Kampaniyalar" subtitle="Aktiv endirimlər, mövsümi kampaniyalar və xüsusi təkliflər.">
      {campaigns.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mb-10">
          {campaigns.map((c) => (
            <div key={c.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {getImageUrl(c.image) && (
                <img src={getImageUrl(c.image)!} alt={c.title} className="h-44 w-full object-cover" />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-lg">{c.title}</h3>
                  {c.discount_percent > 0 && (
                    <span className="flex-shrink-0 rounded-full bg-red-100 px-2.5 py-0.5 text-sm font-bold text-red-600">-{c.discount_percent}%</span>
                  )}
                </div>
                {c.description && <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>}
                {(c.start_date || c.end_date) && (
                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {c.start_date && new Date(c.start_date).toLocaleDateString("az-AZ")}
                    {c.start_date && c.end_date && " — "}
                    {c.end_date && new Date(c.end_date).toLocaleDateString("az-AZ")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {products.length > 0 && (
        <>
          <h2 className="mb-5 text-2xl font-bold">Ən böyük endirimlər</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {products.map((p) => (
              <Link key={p.id} to="/mehsul/$slug" params={{ slug: String(p.id) }}
                className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-lg">
                <div className="aspect-[4/3] overflow-hidden bg-white">
                  <ProductImg p={p} />
                </div>
                <div className="p-4">
                  <div className="line-clamp-2 text-sm font-medium">{p.name}</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-black">{p.price} AZN</span>
                    {p.old_price && <span className="text-xs text-muted-foreground line-through">{p.old_price} AZN</span>}
                    {p.discount > 0 && <span className="ml-auto rounded bg-[var(--accent-orange)] px-2 py-0.5 text-xs font-bold text-white">−{p.discount}%</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {campaigns.length === 0 && products.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">Admin paneldən kampaniya əlavə edin</div>
      )}

      {categories.length > 0 && (
        <div className="mt-12 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link key={c.slug} to="/kateqoriya/$slug" params={{ slug: c.slug }}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-[var(--brand)]">
              {c.icon} {c.name}
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
