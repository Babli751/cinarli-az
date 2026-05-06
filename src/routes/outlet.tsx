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
            <Link key={p.name} to="/kateqoriya/$slug" params={{ slug: p.category }} className="relative rounded-2xl border border-border bg-card p-4 hover:shadow-lg">
              <span className="absolute right-3 top-3 rounded-full bg-[var(--accent-orange)] px-2 py-0.5 text-xs font-bold text-white">−{p.discount}%</span>
              <div className="my-4 grid h-32 place-items-center text-6xl">{p.img}</div>
              <div className="text-sm font-medium line-clamp-2">{p.name}</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-black">{p.price} ₼</span>
                <span className="text-xs text-muted-foreground line-through">{p.old} ₼</span>
              </div>
            </Link>
          ))}
        </div>
      </PageShell>
    );
  },
});
