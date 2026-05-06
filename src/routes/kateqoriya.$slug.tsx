import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Heart, Scale, Zap, ChevronLeft } from "lucide-react";
import { categories, products, type Product } from "@/data/catalog";

const searchSchema = z.object({
  sort: fallback(z.enum(["popular", "price-asc", "price-desc", "discount"]), "popular").default("popular"),
  min: fallback(z.number(), 0).default(0),
  max: fallback(z.number(), 5000).default(5000),
});

export const Route = createFileRoute("/kateqoriya/$slug")({
  validateSearch: zodValidator(searchSchema),
  beforeLoad: ({ params }) => {
    if (!categories.find((c) => c.slug === params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const cat = categories.find((c) => c.slug === params.slug);
    return {
      meta: [
        { title: `${cat?.name ?? "Kateqoriya"} — MebelMart` },
        { name: "description", content: `${cat?.name} kateqoriyasında məhsullar, qiymət və endirim filtrləri.` },
      ],
    };
  },
  component: CategoryPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Kateqoriya tapılmadı</h1>
      <Link to="/" className="mt-4 inline-block text-[var(--brand)]">Ana səhifəyə qayıt</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center">
      <p className="text-destructive">{error.message}</p>
    </div>
  ),
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { sort, min, max } = Route.useSearch();
  const navigate = Route.useNavigate();
  const cat = categories.find((c) => c.slug === slug)!;

  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list: Product[] = products.filter((p) => p.category === slug);
    list = list.filter((p) => p.price >= min && p.price <= max);
    if (search.trim()) list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    switch (sort) {
      case "price-asc": list = [...list].sort((a, b) => a.price - b.price); break;
      case "price-desc": list = [...list].sort((a, b) => b.price - a.price); break;
      case "discount": list = [...list].sort((a, b) => b.discount - a.discount); break;
    }
    return list;
  }, [slug, sort, min, max, search]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Ana səhifə
        </Link>
        <h1 className="mt-3 text-3xl font-bold">{cat.name}</h1>

        {/* Category chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/kateqoriya/$slug"
              params={{ slug: c.slug }}
              className={`rounded-full border px-4 py-2 text-sm ${
                c.slug === slug
                  ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)]"
                  : "border-border bg-card hover:border-[var(--brand)] hover:text-[var(--brand)]"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          {/* Filters */}
          <aside className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 font-bold">Filtrlər</h3>

            <label className="mb-2 block text-xs font-medium text-muted-foreground">Axtarış</label>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Məhsul adı..."
              className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
            />

            <label className="mb-2 mt-5 block text-xs font-medium text-muted-foreground">Qiymət (₼)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={min}
                onChange={(e) => navigate({ search: (prev) => ({ ...prev, min: Number(e.target.value) || 0 }) as any })}
                className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
              />
              <input
                type="number"
                value={max}
                onChange={(e) => navigate({ search: (prev) => ({ ...prev, max: Number(e.target.value) || 0 }) as any })}
                className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
              />
            </div>

            <label className="mb-2 mt-5 block text-xs font-medium text-muted-foreground">Sıralama</label>
            <select
              value={sort}
              onChange={(e) => navigate({ search: (prev) => ({ ...prev, sort: e.target.value as typeof sort }) as any })}
              className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
            >
              <option value="popular">Populyarlıq</option>
              <option value="price-asc">Qiymət: ucuzdan</option>
              <option value="price-desc">Qiymət: bahadan</option>
              <option value="discount">Ən böyük endirim</option>
            </select>

            <button
              onClick={() => { setSearch(""); navigate({ search: { sort: "popular", min: 0, max: 5000 } }); }}
              className="mt-5 w-full rounded-lg border border-border py-2 text-sm hover:bg-secondary"
            >
              Filtrləri sıfırla
            </button>
          </aside>

          {/* Results */}
          <div>
            <p className="mb-4 text-sm text-muted-foreground">{filtered.length} məhsul tapıldı</p>
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
                Filtrə uyğun məhsul yoxdur.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {filtered.map((p) => (
                  <article key={p.name} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition hover:shadow-lg">
                    <div className="absolute right-3 top-3 grid h-12 w-12 place-items-center rounded-full bg-[var(--accent-orange)] text-sm font-bold text-white">−{p.discount}%</div>
                    <div className="absolute left-3 top-3 flex gap-2 text-muted-foreground">
                      <button className="hover:text-[var(--brand)]"><Scale className="h-4 w-4" /></button>
                      <button className="hover:text-[var(--accent-orange)]"><Heart className="h-4 w-4" /></button>
                    </div>
                    <div className="my-6 grid h-40 place-items-center text-7xl">{p.img}</div>
                    <h3 className="line-clamp-2 min-h-[3rem] text-sm font-medium">{p.name}</h3>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-xl font-black">{p.price} ₼</span>
                      <span className="text-sm text-muted-foreground line-through">{p.old} ₼</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-[var(--brand)]"><Zap className="h-3 w-3" /> Aylıq {Math.round(p.price / 12)} ₼-dan</div>
                    <button className="mt-3 w-full rounded-lg bg-[var(--brand)] py-2 text-sm font-semibold text-[var(--brand-foreground)] opacity-0 transition group-hover:opacity-100">
                      Səbətə əlavə et
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
