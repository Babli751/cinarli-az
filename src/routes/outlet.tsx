import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteLayout";
import { products } from "@/data/catalog";

export const Route = createFileRoute("/outlet")({
  head: () => ({ meta: [{ title: "Outlet — MebelMart" }, { name: "description", content: "Anbar boşaltma və outlet məhsulları." }] }),
  component: () => {
    const list = [...products].filter((p) => p.discount >= 20);
    return (
      <PageShell title="Outlet" subtitle="Stok boşaltma — son ədədlər, ən aşağı qiymətə.">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {list.map((p) => (
            <Link key={p.name} to="/kateqoriya/$slug" params={{ slug: p.category }} className="group relative overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-lg">
              <span className="absolute right-3 top-3 z-10 rounded-full bg-[var(--accent-orange)] px-2 py-0.5 text-xs font-bold text-white shadow">−{p.discount}%</span>
              <div className="aspect-square overflow-hidden bg-secondary/30">
                <img src={p.image} alt={p.name} width={768} height={768} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
              </div>
              <div className="p-4">
                <div className="line-clamp-2 text-sm font-medium">{p.name}</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-black">{p.price} ₼</span>
                  <span className="text-xs text-muted-foreground line-through">{p.old} ₼</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </PageShell>
    );
  },
});
