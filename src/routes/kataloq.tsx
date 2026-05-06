import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { categories, products } from "@/data/catalog";

export const Route = createFileRoute("/kataloq")({
  head: () => ({
    meta: [
      { title: "Kataloq — MebelMart" },
      { name: "description", content: "Bütün mebel kateqoriyaları: divanlar, çarpayılar, masalar, şkaflar, matraslar, ofis və bağ mebelləri." },
    ],
  }),
  component: CatalogPage,
});

function CatalogPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Ana səhifə
        </Link>
        <h1 className="mt-3 text-3xl font-bold">Bütün kataloq</h1>
        <p className="mt-1 text-muted-foreground">{categories.length} kateqoriya · {products.length} məhsul</p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => {
            const count = products.filter((p) => p.category === c.slug).length;
            return (
              <Link
                key={c.slug}
                to="/kateqoriya/$slug"
                params={{ slug: c.slug }}
                className="group flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:shadow-lg"
              >
                <div className="text-4xl">{c.icon}</div>
                <h3 className="font-bold group-hover:text-[var(--brand)]">{c.name}</h3>
                <p className="text-xs text-muted-foreground">{c.description}</p>
                <span className="mt-auto text-xs font-semibold text-[var(--brand)]">{count} məhsul →</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
