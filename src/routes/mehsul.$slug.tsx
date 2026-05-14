import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Heart, Scale, Share2, Truck, ShieldCheck, Store,
  ChevronRight, ShoppingCart, MousePointerClick, CreditCard, Star, Zap,
} from "lucide-react";
import { api, type Product, type Category } from "@/lib/api";
import { SiteHeader, SiteFooter } from "@/components/SiteLayout";

export const Route = createFileRoute("/mehsul/$slug")({
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const id = Number(slug);
    if (!id) return;
    api.getProduct(id).then((p) => {
      setProduct(p);
      if (p.category_slug) {
        api.getCategories().then((cats) => {
          setCategory(cats.find((c) => c.slug === p.category_slug) ?? null);
        });
        api.getProducts({ category: p.category_slug, active: true }).then((list) => {
          setRelated(list.filter((x) => x.id !== p.id).slice(0, 4));
        });
      }
    }).catch(() => {});
  }, [slug]);

  if (!product) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">Yüklənir...</div>
        <SiteFooter />
      </div>
    );
  }

  const hasImg = product.image?.startsWith("http") || product.image?.startsWith("/");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-3 py-4 md:px-4 md:py-6">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-4 md:text-sm md:mb-6">
          <Link to="/" className="hover:text-foreground">Çınarlı</Link>
          <ChevronRight className="h-3 w-3" />
          {category && (
            <>
              <Link to="/kateqoriya/$slug" params={{ slug: category.slug }} className="hover:text-foreground">{category.name}</Link>
              <ChevronRight className="h-3 w-3" />
            </>
          )}
          <span className="text-foreground line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-4 lg:gap-8 lg:grid-cols-2">
          {/* Image */}
          <div className="overflow-hidden rounded-2xl border border-border bg-secondary/20 aspect-square flex items-center justify-center">
            {hasImg
              ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
              : <span className="text-8xl">{product.image || "📦"}</span>}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <h1 className="text-xl font-bold md:text-3xl">{product.name}</h1>

            <div className="mt-2 flex items-center gap-2">
              <div className="flex text-amber-400">{[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current md:h-4 md:w-4" />)}</div>
              <span className="text-xs text-muted-foreground md:text-sm">5.0</span>
            </div>

            <div className="mt-3 flex items-baseline gap-2 md:mt-4 md:gap-3">
              <span className="text-3xl font-black md:text-4xl">{product.price} ₼</span>
              {product.old_price && <span className="text-base text-muted-foreground line-through md:text-xl">{product.old_price} ₼</span>}
              {product.discount > 0 && (
                <span className="rounded-full bg-[var(--accent-orange)] px-2 py-0.5 text-xs font-bold text-white md:px-3 md:text-sm">−{product.discount}%</span>
              )}
            </div>

            {product.old_price && (
              <div className="mt-1 text-sm text-green-600 font-medium">
                {(product.old_price - product.price).toFixed(0)} ₼ qənaət
              </div>
            )}

            <div className="mt-3 rounded-xl bg-[var(--brand)]/5 px-3 py-2 text-xs md:px-4 md:py-2.5 md:text-sm">
              <span className="font-semibold text-[var(--brand)]">Faizsiz aylıq ödəniş:</span>{" "}
              24 aya {Math.round(product.price / 24)} ₼ / ay
            </div>

            {product.description && (
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            )}

            <div className="mt-3 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium md:text-sm ${product.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                {product.stock > 0 ? `Stokda: ${product.stock} ədəd` : "Stokda yoxdur"}
              </span>
            </div>

            {/* Qty + Actions */}
            <div className="mt-4 flex items-center gap-2 md:mt-6 md:gap-3">
              <div className="flex items-center rounded-xl border border-border">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-3 text-lg hover:bg-secondary rounded-l-xl md:px-4">−</button>
                <span className="w-10 text-center font-semibold md:w-12">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="px-3 py-3 text-lg hover:bg-secondary rounded-r-xl md:px-4">+</button>
              </div>
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] py-3 text-sm font-semibold text-[var(--brand-foreground)] hover:opacity-90 md:text-base">
                <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" /> Səbətə əlavə et
              </button>
            </div>

            <div className="mt-2 flex gap-2 md:mt-3">
              <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-xs font-medium hover:bg-secondary md:py-3 md:text-sm md:gap-2">
                <MousePointerClick className="h-3.5 w-3.5 md:h-4 md:w-4" /> Bir kliklə al
              </button>
              <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-xs font-medium hover:bg-secondary md:py-3 md:text-sm md:gap-2">
                <CreditCard className="h-3.5 w-3.5 md:h-4 md:w-4" /> Kredit
              </button>
            </div>

            <div className="mt-3 flex gap-2">
              <button className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-border px-2 py-2 text-xs hover:bg-secondary md:px-4 md:py-2.5 md:text-sm md:gap-1.5">
                <Heart className="h-3.5 w-3.5 md:h-4 md:w-4" /> Saxla
              </button>
              <button className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-border px-2 py-2 text-xs hover:bg-secondary md:px-4 md:py-2.5 md:text-sm md:gap-1.5">
                <Scale className="h-3.5 w-3.5 md:h-4 md:w-4" /> Müqayisə
              </button>
              <button className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-border px-2 py-2 text-xs hover:bg-secondary md:px-4 md:py-2.5 md:text-sm md:gap-1.5">
                <Share2 className="h-3.5 w-3.5 md:h-4 md:w-4" /> Paylaş
              </button>
            </div>

            {/* Features */}
            <div className="mt-4 grid grid-cols-3 gap-2 md:mt-6 md:gap-3">
              {[
                { icon: Truck, t: "Sürətli çatdırılma" },
                { icon: ShieldCheck, t: "Rəsmi zəmanət" },
                { icon: Store, t: "56 mağazada var" },
              ].map(({ icon: Icon, t }) => (
                <div key={t} className="flex flex-col items-center gap-1 rounded-xl border border-border p-2 text-center text-[10px] md:p-3 md:text-xs">
                  <Icon className="h-4 w-4 text-[var(--brand)] md:h-5 md:w-5" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-10 md:mt-16">
            <h2 className="mb-4 text-xl font-bold md:mb-5 md:text-2xl">Oxşar məhsullar</h2>
            <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
              {related.map((p) => (
                <Link key={p.id} to="/mehsul/$slug" params={{ slug: String(p.id) }}
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="aspect-square overflow-hidden bg-secondary/30">
                    {p.image?.startsWith("http") || p.image?.startsWith("/")
                      ? <img src={p.image} alt={p.name} className="h-full w-full object-cover group-hover:scale-110 transition duration-500" loading="lazy" />
                      : <div className="flex h-full w-full items-center justify-center text-4xl">{p.image || "📦"}</div>}
                  </div>
                  <div className="p-3 md:p-4">
                    <div className="line-clamp-2 text-xs font-medium md:text-sm">{p.name}</div>
                    <div className="mt-1 font-black md:mt-2">{p.price} ₼</div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-[var(--brand)]"><Zap className="h-3 w-3" /> {Math.round(p.price / 12)} ₼/ay</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
