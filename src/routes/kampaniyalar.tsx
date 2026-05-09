import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteLayout";
import { products, categories } from "@/data/catalog";

export const Route = createFileRoute("/kampaniyalar")({
  head: () => ({ meta: [{ title: "Kampaniyalar — MebelMart" }, { name: "description", content: "Aktiv kampaniyalar, mövsümi endirimlər və xüsusi təkliflər." }] }),
  component: () => {
    const topDeals = [...products].sort((a, b) => b.discount - a.discount).slice(0, 8);
    return (
      <PageShell title="Kampaniyalar" subtitle="Aktiv endirimlər, mövsümi kampaniyalar və xüsusi təkliflər.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { t: "Yaşıl Cümə", d: "70%-dək endirim", c: "from-emerald-500 to-emerald-700" },
            { t: "Yataq həftəsi", d: "Faizsiz 24 ay", c: "from-rose-500 to-pink-600" },
            { t: "Outlet", d: "Anbar boşaltma", c: "from-amber-500 to-orange-600" },
          ].map((b) => (
            <div key={b.t} className={`rounded-2xl bg-gradient-to-br ${b.c} p-8 text-white`}>
              <div className="text-xs font-bold uppercase tracking-wider opacity-80">{b.d}</div>
              <div className="mt-2 text-3xl font-black">{b.t}</div>
            </div>
          ))}
        </div>
        <h2 className="mt-12 mb-5 text-2xl font-bold">Ən böyük endirimlər</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {topDeals.map((p) => (
            <Link key={p.name} to="/kateqoriya/$slug" params={{ slug: p.category }} className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-lg">
              <div className="aspect-square overflow-hidden bg-secondary/30">
                <img src={p.image} alt={p.name} width={768} height={768} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
              </div>
              <div className="p-4">
                <div className="line-clamp-2 text-sm font-medium">{p.name}</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-black">{p.price} ₼</span>
                  <span className="text-xs text-muted-foreground line-through">{p.old} ₼</span>
                  <span className="ml-auto rounded bg-[var(--accent-orange)] px-2 py-0.5 text-xs font-bold text-white">−{p.discount}%</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link key={c.slug} to="/kateqoriya/$slug" params={{ slug: c.slug }} className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-[var(--brand)]">{c.icon} {c.name}</Link>
          ))}
        </div>
      </PageShell>
    );
  },
});
