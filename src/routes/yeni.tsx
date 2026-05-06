import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteLayout";
import { products } from "@/data/catalog";

export const Route = createFileRoute("/yeni")({
  head: () => ({ meta: [{ title: "Yeni məhsullar — MebelMart" }] }),
  component: () => (
    <PageShell title="Yeni məhsullar" subtitle="Kolleksiyamıza yeni əlavə olunan məhsullar.">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.slice(0, 16).map((p) => (
          <Link key={p.name} to="/kateqoriya/$slug" params={{ slug: p.category }} className="rounded-2xl border border-border bg-card p-4 hover:shadow-lg">
            <span className="inline-block rounded bg-[var(--brand)] px-2 py-0.5 text-xs font-bold text-white">YENİ</span>
            <div className="my-4 grid h-32 place-items-center text-6xl">{p.img}</div>
            <div className="text-sm font-medium line-clamp-2">{p.name}</div>
            <div className="mt-2 font-black">{p.price} ₼</div>
          </Link>
        ))}
      </div>
    </PageShell>
  ),
});
