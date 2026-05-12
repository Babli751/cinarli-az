import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Heart, Scale, Share2, Truck, ShieldCheck, Store, MessageSquare,
  ChevronRight, ShoppingCart, MousePointerClick, CreditCard, Star,
} from "lucide-react";
import { products, categories, type Product } from "@/data/catalog";
import { slugify } from "@/lib/slug";
import { SiteHeader, SiteFooter } from "@/components/SiteLayout";
import { ProductReviews } from "@/components/ProductReviews";

export const Route = createFileRoute("/mehsul/$slug")({
  beforeLoad: ({ params }) => {
    if (!products.find((p) => slugify(p.name) === params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const product = products.find((p) => slugify(p.name) === params.slug);
    return {
      meta: [
        { title: `${product?.name ?? "Məhsul"} — MebelMart` },
        { name: "description", content: `${product?.name} ${product?.price} ₼ — endirim, çatdırılma və aylıq ödəniş seçimləri.` },
        { property: "og:title", content: product?.name ?? "Məhsul" },
        { property: "og:image", content: product?.image ?? "" },
        { name: "twitter:image", content: product?.image ?? "" },
      ],
    };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Məhsul tapılmadı</h1>
      <Link to="/" className="mt-4 inline-block text-[var(--brand)]">Ana səhifəyə qayıt</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center">
      <p className="text-destructive">{error.message}</p>
    </div>
  ),
});

type Tab = "info" | "specs" | "reviews";

function ProductPage() {
  const { slug } = Route.useParams();
  const product = products.find((p) => slugify(p.name) === slug)!;
  const category = categories.find((c) => c.slug === product.category);

  const gallery = useMemo(() => {
    const siblings: Product[] = products.filter((p) => p.category === product.category && p.name !== product.name);
    const extras = siblings.slice(0, 4).map((p) => p.image);
    return Array.from(new Set([product.image, ...extras, category?.image].filter(Boolean) as string[]));
  }, [product, category]);

  const [active, setActive] = useState(0);
  const [zoomActive, setZoomActive] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>("info");
  const [color, setColor] = useState(0);
  const productCode = "MM-" + slugify(product.name).slice(0, 7).toUpperCase();
  const colors = ["#1e3a5f", "#9ca3af", "#f59e0b"];

  const installments = [
    { months: 6, monthly: Math.round(product.price / 6) },
    { months: 12, monthly: Math.round(product.price / 12) },
    { months: 18, monthly: Math.round(product.price / 18) },
  ];

  function handleMove(e: React.MouseEvent) {
    const rect = imgWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }

  const related = products.filter((p) => p.category === product.category && p.name !== product.name).slice(0, 4);
  const saving = product.old - product.price;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Breadcrumbs */}
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">MebelMart</Link>
          <ChevronRight className="h-3 w-3" />
          {category && (
            <>
              <Link to="/kateqoriya/$slug" params={{ slug: category.slug }} className="hover:text-foreground">{category.name}</Link>
              <ChevronRight className="h-3 w-3" />
            </>
          )}
          <span className="text-foreground">{product.name}</span>
        </nav>

        {/* Title row */}
        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold leading-tight md:text-4xl">{product.name}</h1>
            <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-600">
              <Store className="h-4 w-4" /> Stokda var
            </div>
          </div>
        </div>

        {/* Main 3-column grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[80px_minmax(0,1fr)_360px]">
          {/* Thumbnails */}
          <div className="order-2 flex gap-2 lg:order-1 lg:flex-col">
            {gallery.map((src, i) => (
              <button
                key={src + i}
                onClick={() => setActive(i)}
                className={`aspect-square w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-secondary/40 transition lg:w-full ${
                  i === active ? "border-[var(--brand)]" : "border-border hover:border-muted-foreground"
                }`}
                aria-label={`Şəkil ${i + 1}`}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>

          {/* Main image + info under it */}
          <div className="order-1 lg:order-2 grid grid-cols-1 gap-6 md:grid-cols-[1.15fr_1fr]">
            <div
              ref={imgWrapRef}
              className="relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl border border-border bg-white"
              onMouseEnter={() => setZoomActive(true)}
              onMouseLeave={() => setZoomActive(false)}
              onMouseMove={handleMove}
            >
              <img
                src={gallery[active]}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-150 ease-out"
                style={{
                  transform: zoomActive ? "scale(2.2)" : "scale(1)",
                  transformOrigin: `${origin.x}% ${origin.y}%`,
                }}
              />
              <div className="absolute right-4 top-4 grid h-14 w-14 place-items-center rounded-full bg-[var(--accent-orange)] text-sm font-bold text-white shadow-lg">
                −{product.discount}%
              </div>
            </div>

            {/* Info column */}
            <div className="flex flex-col">
              <div className="inline-flex w-fit items-center gap-2 rounded-md bg-[var(--accent-orange)]/10 px-2.5 py-1 text-sm font-semibold text-[var(--accent-orange)]">
                −{saving} ₼
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button className="grid h-10 w-10 place-items-center rounded-lg border border-border hover:border-[var(--brand)] hover:text-[var(--brand)]" aria-label="Müqayisə"><Scale className="h-4 w-4" /></button>
                <button className="grid h-10 w-10 place-items-center rounded-lg border border-border hover:border-[var(--brand)] hover:text-[var(--brand)]" aria-label="Bəyəndim"><Heart className="h-4 w-4" /></button>
                <button className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border px-3 text-sm hover:border-[var(--brand)] hover:text-[var(--brand)]"><Share2 className="h-4 w-4" /> Paylaş</button>
              </div>

              {/* Color */}
              <div className="mt-5">
                <p className="text-sm text-muted-foreground">Rəng:</p>
                <div className="mt-2 flex gap-2">
                  {colors.map((c, i) => (
                    <button
                      key={c}
                      onClick={() => setColor(i)}
                      style={{ background: c }}
                      className={`h-9 w-9 rounded-full ring-offset-2 ring-offset-background transition ${i === color ? "ring-2 ring-[var(--brand)]" : ""}`}
                      aria-label={`Rəng ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Variant */}
              <div className="mt-5">
                <p className="text-sm text-muted-foreground">Ölçü / variant:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button className="rounded-md border-2 border-[var(--brand)] bg-[var(--brand)]/5 px-4 py-2 text-sm font-semibold text-[var(--brand)]">Standart</button>
                </div>
              </div>

              {/* Code */}
              <div className="mt-5 text-sm">
                <span className="text-muted-foreground">Malın kodu: </span>
                <span className="font-semibold">{productCode}</span>
              </div>

              {/* Rating */}
              <button onClick={() => setTab("reviews")} className="mt-4 inline-flex w-fit items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className="h-4 w-4 text-muted-foreground" />
                  ))}
                </span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <MessageSquare className="h-4 w-4" /> 0
                </span>
                <span className="text-[var(--brand)] underline-offset-2 hover:underline">Rəy yaz</span>
              </button>

              <div className="mt-5 flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-muted-foreground/20 text-[10px] font-bold">i</span>
                Rəsmiləşdirmə zamanı 5–18% komissiya əlavə oluna bilər.
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <aside className="order-3 space-y-4">
            {/* Installment promo */}
            <div className="rounded-2xl border-2 border-[var(--brand)]/40 bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br from-[var(--brand)] to-[var(--brand)]/70 text-white">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-bold">{Math.round(product.price / 12)} ₼ x 12 ay</p>
                  <p className="text-xs text-muted-foreground">Bank ilə 12 aya faizsiz ödə!</p>
                </div>
              </div>
            </div>

            {/* Price + buy */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground line-through">{product.old} ₼</p>
              <p className="text-3xl font-black">{product.price} ₼</p>
              <div className="mt-4 flex gap-2">
                <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--accent-orange)] px-4 py-3 text-sm font-bold text-white hover:opacity-90">
                  <MousePointerClick className="h-4 w-4" /> Bir kliklə al
                </button>
                <button className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-emerald-500 text-white hover:opacity-90" aria-label="Səbətə at">
                  <ShoppingCart className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Installment table */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-bold">İlkin ödənişsiz hissə-hissə ödə!</p>
              <div className="mt-3 overflow-hidden rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-secondary/40 text-muted-foreground">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium">Müddət</th>
                      <th className="px-2 py-2 text-right font-medium">Aylıq</th>
                      <th className="px-2 py-2 text-right font-medium">Yekun</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installments.map((it) => (
                      <tr key={it.months} className="border-t border-border">
                        <td className="px-2 py-2">{it.months} ay</td>
                        <td className="px-2 py-2 text-right font-semibold">{it.monthly} ₼</td>
                        <td className="px-2 py-2 text-right">{product.price} ₼</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Link to="/aylik-odenis" className="mt-3 block w-full rounded-lg border border-border px-3 py-2 text-center text-xs font-semibold hover:border-[var(--brand)] hover:text-[var(--brand)]">
                Hissəli alış kalkulyatoru
              </Link>
            </div>

            {/* Delivery + warranty */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-card p-3 text-xs">
                <Truck className="mb-1 h-4 w-4 text-[var(--brand)]" />
                <p className="font-semibold">Çatdırılma</p>
                <p className="text-muted-foreground">Pulsuz</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3 text-xs">
                <ShieldCheck className="mb-1 h-4 w-4 text-[var(--brand)]" />
                <p className="font-semibold">Zəmanət</p>
                <p className="text-muted-foreground">2 il</p>
              </div>
            </div>
          </aside>
        </div>

        {/* Tabs */}
        <div className="mt-12 border-b border-border">
          <div className="flex flex-wrap gap-1">
            {[
              { id: "info" as const, label: "Məhsul haqqında" },
              { id: "specs" as const, label: "Texniki xüsusiyyətləri" },
              { id: "reviews" as const, label: "Reytinq və rəylər" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative px-5 py-3 text-sm font-semibold transition ${
                  tab === t.id ? "text-[var(--accent-orange)]" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
                {tab === t.id && <span className="absolute inset-x-3 -bottom-px h-0.5 bg-[var(--accent-orange)]" />}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {tab === "info" && (
            <div className="rounded-xl border border-border bg-card p-6 text-sm leading-relaxed text-muted-foreground">
              <p>
                {product.name} — premium materiallardan hazırlanmış, müasir dizayna və uzun istifadə müddətinə malik mebel. Evinizin istənilən küncü üçün mükəmməl seçim.
              </p>
            </div>
          )}
          {tab === "specs" && (
            <div className="rounded-xl border border-border bg-card p-6">
              <dl className="grid grid-cols-1 gap-x-8 gap-y-1 text-sm md:grid-cols-2">
                {[
                  ["Kateqoriya", category?.name ?? "—"],
                  ["Material", "Premium MDF / Şpon"],
                  ["Zəmanət", "24 ay"],
                  ["Yığılma", "Pulsuz"],
                  ["Çatdırılma", "1–3 iş günü"],
                  ["Mənşə", "Türkiyə"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-border py-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {tab === "reviews" && <ProductReviews productSlug={slug} />}
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-5 text-2xl font-bold">Oxşar məhsullar</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.map((p) => (
                <Link
                  key={p.name}
                  to="/mehsul/$slug"
                  params={{ slug: slugify(p.name) }}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="aspect-square overflow-hidden bg-secondary/30">
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                  </div>
                  <div className="p-3">
                    <h3 className="line-clamp-2 min-h-[2.5rem] text-sm">{p.name}</h3>
                    <p className="mt-2 text-lg font-black">{p.price} ₼</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
