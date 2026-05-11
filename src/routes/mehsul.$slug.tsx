import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Heart, Scale, Truck, ShieldCheck, RotateCcw, Zap, ChevronLeft, Minus, Plus, ShoppingCart, Check, ZoomIn } from "lucide-react";
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

function ProductPage() {
  const { slug } = Route.useParams();
  const product = products.find((p) => slugify(p.name) === slug)!;
  const category = categories.find((c) => c.slug === product.category);

  // Build a small image gallery: main product image + a few same-category siblings
  const gallery = useMemo(() => {
    const siblings: Product[] = products.filter((p) => p.category === product.category && p.name !== product.name);
    const extras = siblings.slice(0, 3).map((p) => p.image);
    return Array.from(new Set([product.image, ...extras, category?.image].filter(Boolean) as string[]));
  }, [product, category]);

  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [zoomActive, setZoomActive] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const imgWrapRef = useRef<HTMLDivElement>(null);

  function handleMove(e: React.MouseEvent) {
    const rect = imgWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }

  const related = products.filter((p) => p.category === product.category && p.name !== product.name).slice(0, 4);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Breadcrumbs */}
        <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Ana səhifə</Link>
          <ChevronLeft className="h-3 w-3 rotate-180" />
          {category && (
            <>
              <Link to="/kateqoriya/$slug" params={{ slug: category.slug }} className="hover:text-foreground">{category.name}</Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
            </>
          )}
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_1fr]">
          {/* Gallery */}
          <div className="grid grid-cols-[80px_1fr] gap-3">
            <div className="flex flex-col gap-2">
              {gallery.map((src, i) => (
                <button
                  key={src + i}
                  onClick={() => setActive(i)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 bg-secondary/40 transition ${
                    i === active ? "border-[var(--brand)]" : "border-border hover:border-muted-foreground"
                  }`}
                  aria-label={`Şəkil ${i + 1}`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>

            <div
              ref={imgWrapRef}
              className="relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl border border-border bg-secondary/30"
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
              <div className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-[var(--accent-orange)] text-xs font-bold text-white shadow-md">
                −{product.discount}%
              </div>
              {!zoomActive && (
                <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur">
                  <ZoomIn className="h-3.5 w-3.5" /> Yaxınlaşdırmaq üçün üzərinə gəlin
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div>
            <h1 className="text-3xl font-bold leading-tight">{product.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Kod: MM-{slugify(product.name).slice(0, 8).toUpperCase()}</p>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-4xl font-black">{product.price} ₼</span>
              <span className="text-lg text-muted-foreground line-through">{product.old} ₼</span>
              <span className="rounded-md bg-[var(--accent-orange)]/10 px-2 py-1 text-sm font-semibold text-[var(--accent-orange)]">
                {product.old - product.price} ₼ qənaət
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm text-[var(--brand)]">
              <Zap className="h-4 w-4" /> Aylıq {Math.round(product.price / 12)} ₼-dan, 12 ay faizsiz
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm text-emerald-600">
              <Check className="h-4 w-4" /> Anbarda mövcuddur — 24 saat ərzində göndərilir
            </div>

            {/* Qty + actions */}
            <div className="mt-6 flex flex-wrap items-stretch gap-3">
              <div className="inline-flex items-center rounded-lg border border-border">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-12 w-12 place-items-center hover:bg-secondary"><Minus className="h-4 w-4" /></button>
                <span className="w-12 text-center font-semibold">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="grid h-12 w-12 place-items-center hover:bg-secondary"><Plus className="h-4 w-4" /></button>
              </div>
              <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-6 py-3 text-base font-bold text-[var(--brand-foreground)] hover:opacity-90">
                <ShoppingCart className="h-5 w-5" /> Səbətə əlavə et
              </button>
              <button className="grid h-12 w-12 place-items-center rounded-lg border border-border hover:border-[var(--brand)] hover:text-[var(--brand)]" aria-label="Bəyəndim">
                <Heart className="h-5 w-5" />
              </button>
              <button className="grid h-12 w-12 place-items-center rounded-lg border border-border hover:border-[var(--brand)] hover:text-[var(--brand)]" aria-label="Müqayisə">
                <Scale className="h-5 w-5" />
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm">
                <Truck className="h-5 w-5 text-[var(--brand)]" />
                <div>
                  <p className="font-semibold">Pulsuz çatdırılma</p>
                  <p className="text-xs text-muted-foreground">500 ₼-dən yuxarı sifarişlərə</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm">
                <RotateCcw className="h-5 w-5 text-[var(--brand)]" />
                <div>
                  <p className="font-semibold">14 gün geri qaytarma</p>
                  <p className="text-xs text-muted-foreground">Heç bir suala cavab vermədən</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm">
                <ShieldCheck className="h-5 w-5 text-[var(--brand)]" />
                <div>
                  <p className="font-semibold">2 il zəmanət</p>
                  <p className="text-xs text-muted-foreground">Rəsmi distribütor</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-8 rounded-xl border border-border bg-card p-5">
              <h2 className="text-lg font-bold">Məhsul haqqında</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {product.name} — premium materiallardan hazırlanmış, müasir dizayna və uzun istifadə müddətinə malik mebel. Evinizin istənilən küncü üçün mükəmməl seçim.
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="flex justify-between border-b border-border py-1.5"><dt className="text-muted-foreground">Kateqoriya</dt><dd className="font-medium">{category?.name}</dd></div>
                <div className="flex justify-between border-b border-border py-1.5"><dt className="text-muted-foreground">Material</dt><dd className="font-medium">Premium</dd></div>
                <div className="flex justify-between border-b border-border py-1.5"><dt className="text-muted-foreground">Zəmanət</dt><dd className="font-medium">24 ay</dd></div>
                <div className="flex justify-between border-b border-border py-1.5"><dt className="text-muted-foreground">Yığılma</dt><dd className="font-medium">Pulsuz</dd></div>
              </dl>
            </div>
          </div>
        </div>

        <ProductReviews productSlug={slug} />

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
