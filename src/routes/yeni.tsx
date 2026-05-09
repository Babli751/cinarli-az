import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteLayout";
import { products } from "@/data/catalog";

export const Route = createFileRoute("/yeni")({
  head: () => ({ meta: [{ title: "Yeni məhsullar — MebelMart" }] }),
  component: () => (
    <PageShell title="Yeni məhsullar" subtitle="Kolleksiyamıza yeni əlavə olunan məhsullar.">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.slice(0, 16).map((p) => (
          <Link key={p.name} to="/kateqoriya/$slug" params={{ slug: p.category }} className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-lg">
            <div className="relative aspect-square overflow-hidden bg-secondary/30">
              <span className="absolute left-3 top-3 z-10 inline-block rounded bg-[var(--brand)] px-2 py-0.5 text-xs font-bold text-white">YENİ</span>
              <img src={p.image} alt={p.name} width={768} height={768} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
            </div>
            <div className="p-4">
              <div className="line-clamp-2 text-sm font-medium">{p.name}</div>
              <div className="mt-2 font-black">{p.price} ₼</div>
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  ),
});
