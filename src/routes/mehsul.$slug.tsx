import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Heart, Scale, Share2, Truck, ShieldCheck, Store,
  ChevronRight, ShoppingCart, MousePointerClick, CreditCard, Star, Zap,
  ChevronLeft, ChevronRight as ChevronRightIcon, X as XIcon, Check,
  ChevronDown, Plus, DoorOpen, Calendar,
} from "lucide-react";
import { api, getImageUrl, type Product, type Category, type CreditCompany } from "@/lib/api";
import { SiteHeader, SiteFooter } from "@/components/SiteLayout";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

export const Route = createFileRoute("/mehsul/$slug")({
  component: ProductPage,
});

const parsePlans = (raw: import("@/lib/api").CreditPlan[] | string): import("@/lib/api").CreditPlan[] => {
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw as string); } catch { return []; }
};

function ProductPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { user, login, register } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [creditCompanies, setCreditCompanies] = useState<CreditCompany[]>([]);
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const [orderForm, setOrderForm] = useState({ name: "", phone: "", address: "", promo: "", payment_type: "cash" });
  const [promoResult, setPromoResult] = useState<{ discount: number; code: string; type: string; value: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);
  const [orderBusy, setOrderBusy] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [inCompare, setInCompare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loginModal, setLoginModal] = useState(false);
  const [selectedComps, setSelectedComps] = useState<Set<number>>(new Set());
  const [selectedColor, setSelectedColor] = useState<{name: string; hex: string} | null>(null);
  const [mobileSheet, setMobileSheet] = useState<"quick" | "credit" | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [avgRatingTop, setAvgRatingTop] = useState(0);
  const [creditSelectedMonths, setCreditSelectedMonths] = useState(12); // used in mobile sheet
  const [downPayment, setDownPayment] = useState(0);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginTab, setLoginTab] = useState<"login" | "register">("login");
  const [registerForm, setRegisterForm] = useState({ email: "", password: "", full_name: "", phone: "" });
  const [pendingAction, setPendingAction] = useState<"wishlist" | "compare" | null>(null);

  useEffect(() => { setImgIdx(0); setInWishlist(false); setInCompare(false); }, [slug]);

  useEffect(() => {
    const id = Number(slug);
    if (!id) return;
    api.getProduct(id).then((p) => {
      setProduct(p);
      api.getWishlist().then(wl => setInWishlist(wl.some(x => x.id === p.id))).catch(() => {});
      api.getCompare().then(cp => setInCompare(cp.some(x => x.id === p.id))).catch(() => {});
      if (p.category_slug) {
        api.getCategories().then((cats) => {
          setCategory(cats.find((c) => c.slug === p.category_slug) ?? null);
        });
        api.getProducts({ category: p.category_slug, active: true }).then((list) => {
          setRelated(list.filter((x) => x.id !== p.id).slice(0, 4));
        });
      }
    }).catch(() => {});
    api.getCreditCompanies().then(list => { setCreditCompanies(list); if (list.length > 0) { const p = parsePlans(list[0].plans); setCreditSelectedMonths(p[0]?.months ?? 12); } }).catch(() => {});
    api.getProductReviews(Number(slug)).then(r => { setReviewCount(r.length); setAvgRatingTop(r.length ? r.reduce((s, x) => s + x.rating, 0) / r.length : 0); }).catch(() => {});
  }, [slug]);

  const allImages: string[] = (() => {
    if (!product) return [];
    const extra: string[] = (() => { try { return JSON.parse(product.images || "[]"); } catch { return []; } })();
    const main = product.image;
    const combined = main ? [main, ...extra.filter(x => x !== main)] : extra;
    return combined.length ? combined : [];
  })();
  const currentImg = allImages[imgIdx] || product?.image || "";
  const currentUrl = getImageUrl(currentImg) || null;

  const prevImg = useCallback(() => setImgIdx(i => (i - 1 + allImages.length) % allImages.length), [allImages.length]);
  const nextImg = useCallback(() => setImgIdx(i => (i + 1) % allImages.length), [allImages.length]);

  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevImg();
      if (e.key === "ArrowRight") nextImg();
      if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, prevImg, nextImg]);

  const requireLogin = (action: "wishlist" | "compare") => {
    setPendingAction(action);
    setLoginModal(true);
  };

  const toggleWishlist = async () => {
    if (!product) return;
    if (!user) { requireLogin("wishlist"); return; }
    try {
      if (inWishlist) { await api.removeFromWishlist(product.id); setInWishlist(false); toast.success("Bəyəndiklərimdən çıxarıldı"); }
      else { await api.addToWishlist(product.id); setInWishlist(true); toast.success("Bəyəndiklərimə əlavə edildi"); }
    } catch (e: any) { toast.error(e.message); }
  };

  const toggleCompare = async () => {
    if (!product) return;
    if (!user) { requireLogin("compare"); return; }
    try {
      if (inCompare) { await api.removeFromCompare(product.id); setInCompare(false); toast.success("Müqayisədən çıxarıldı"); }
      else { await api.addToCompare(product.id); setInCompare(true); toast.success("Müqayisəyə əlavə edildi"); }
    } catch (e: any) { toast.error(e.message); }
  };

  const submitLogin = async () => {
    setLoginBusy(true);
    try {
      if (loginTab === "login") {
        await login(loginForm.email, loginForm.password);
      } else {
        await register(registerForm.email, registerForm.password, registerForm.full_name, registerForm.phone);
      }
      setLoginModal(false);
      if (pendingAction === "wishlist") toggleWishlist();
      else if (pendingAction === "compare") toggleCompare();
      setPendingAction(null);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoginBusy(false); }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true); toast.success("Link kopyalandı");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const calcActivePrice = (p: typeof product) => {
    if (!p) return 0;
    if (p.extra_price != null) return p.extra_price;
    if (p.sale_price != null) return p.sale_price;
    if (p.old_price && p.old_price > p.price) return p.price;
    if (p.discount > 0) return Math.round(p.price * (1 - p.discount / 100));
    return p.price;
  };

  const applyPromo = async () => {
    if (!product || !orderForm.promo.trim()) return;
    setPromoError(""); setPromoResult(null); setPromoBusy(true);
    const baseTotal = calcActivePrice(product) * qty;
    try {
      const res = await api.validatePromo(orderForm.promo.trim(), baseTotal);
      setPromoResult(res);
      toast.success(`Promokod tətbiq edildi: -${res.discount} AZN`);
    } catch (e: any) { setPromoError(e.message || "Promokod tapılmadı"); }
    finally { setPromoBusy(false); }
  };

  const submitOrder = async () => {
    if (!product) return;
    if (!orderForm.name || !orderForm.phone) return toast.error("Ad və telefon mütləqdir");
    setOrderBusy(true);
    const price = calcActivePrice(product);
    const baseTotal = price * qty;
    const promoDiscount = promoResult?.discount ?? 0;
    const finalTotal = Math.max(0, baseTotal - promoDiscount);
    const payLabel = orderForm.payment_type === "credit" ? ` | Kredit` : " | Nağd";
    try {
      await api.createOrder({
        customer_name: orderForm.name,
        phone: orderForm.phone,
        address: orderForm.address,
        total: finalTotal,
        items: JSON.stringify([{ id: product.id, name: product.name, qty, price }]),
        notes: `Bir kliklə al — ${product.name} x${qty}${payLabel}${promoResult ? ` | Promo: ${promoResult.code} (-${promoDiscount} AZN)` : ""}`,
        status: "pending",
        payment_type: orderForm.payment_type,
        promo_code: promoResult?.code || "",
        promo_discount: promoDiscount,
      });
      toast.success("Sifarişiniz qəbul edildi! Tezliklə əlaqə saxlayacağıq.");
      setMobileSheet(null);
      setOrderForm({ name: "", phone: "", address: "", promo: "", payment_type: "cash" });
      setPromoResult(null); setPromoError("");
    } catch (e: any) { toast.error(e.message); }
    finally { setOrderBusy(false); }
  };

  if (!product) return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">Yüklənir...</div>
      <SiteFooter />
    </div>
  );

  const activePrice = (() => {
    if (product.extra_price != null) return product.extra_price;
    if (product.sale_price != null) return product.sale_price;
    if (product.old_price && product.old_price > product.price) return product.price;
    if (product.discount > 0) return Math.round(product.price * (1 - product.discount / 100));
    return product.price;
  })();
  const parsedComps: {name: string; price: number}[] = (() => {
    try { return JSON.parse(product.components || "[]"); } catch { return []; }
  })();
  const selectedCompsTotal = parsedComps.reduce((s, c, i) => s + (selectedComps.has(i) ? c.price : 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-3 py-4 md:px-4 md:py-6">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-4 md:text-sm md:mb-6">
          <Link to="/" className="hover:text-foreground">Manqo</Link>
          <ChevronRight className="h-3 w-3" />
          {category && (
            <>
              <Link to="/kateqoriya/$slug" params={{ slug: category.slug }} className="hover:text-foreground">{category.name}</Link>
              <ChevronRight className="h-3 w-3" />
            </>
          )}
          <span className="text-foreground line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-6 lg:gap-10 lg:grid-cols-[1fr_420px] lg:items-start">

          {/* ── LEFT: şəkil bloku ── */}
          <div className="space-y-3">
            {/* Ana şəkil */}
            <div className="relative overflow-hidden rounded-2xl border border-border bg-white cursor-zoom-in"
              onClick={() => currentUrl && setLightbox(true)}>
              {currentUrl
                ? <img src={currentUrl} alt={product.name} className="w-full h-auto block" />
                : <div className="flex h-64 w-full items-center justify-center text-8xl">{product.image || "📦"}</div>}
              {/* Kredit badge sol üst */}
              {(product.credit_months == null || product.credit_months > 0) && (
                <div className="absolute left-3 top-3 z-10">
                  <div className="flex flex-col items-center justify-center rounded-2xl bg-[var(--brand)] text-white shadow-lg text-center leading-tight px-3 py-2 gap-0.5">
                    <span className="text-lg font-black leading-none">{product.credit_months || 24} AYA</span>
                    <span className="text-[11px] font-bold tracking-wide">FAİZSİZ</span>
                    <span className="text-[10px] opacity-80">BÖLMƏ İMKANI</span>
                  </div>
                </div>
              )}
              {/* Sol/sağ ox */}
              {allImages.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); prevImg(); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow hover:bg-white transition">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); nextImg(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow hover:bg-white transition">
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
            {/* Thumbnail strip */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={prevImg} className="flex-shrink-0 grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-secondary transition">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex flex-1 gap-2 overflow-x-auto pb-0.5 scrollbar-none">
                  {allImages.map((img, i) => {
                    const url = getImageUrl(img);
                    return (
                      <button key={i} onClick={() => setImgIdx(i)}
                        className={`flex-shrink-0 h-16 w-16 overflow-hidden rounded-xl border-2 transition-colors ${i === imgIdx ? "border-[var(--brand)]" : "border-border hover:border-muted-foreground"}`}>
                        {url ? <img src={url} alt="" className="h-full w-full object-contain" />
                          : <div className="flex h-full w-full items-center justify-center text-lg">{img || "📦"}</div>}
                      </button>
                    );
                  })}
                </div>
                <button onClick={nextImg} className="flex-shrink-0 grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-secondary transition">
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Desktop: şəklin altında ad, stok, qiymət, düymələr */}
            <div className="hidden lg:block space-y-4 pt-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(s => <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRatingTop) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30"}`} />)}
                </div>
                {reviewCount > 0 && <span className="text-sm font-semibold">{avgRatingTop.toFixed(1)}</span>}
                <span className="text-sm text-muted-foreground">({reviewCount} rəy)</span>
                <span className="ml-auto text-xs text-muted-foreground">Məhsul kodu: <strong>#{product.id}</strong></span>
              </div>
              <div className="flex flex-col gap-1.5">
                {(product.commission_free_months ?? 0) > 0 && (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-[var(--brand)]/40 bg-[var(--brand)] px-3 py-1.5 text-xs font-bold text-white">
                    💳 {product.commission_free_months} aya komissiyasız
                  </span>
                )}
                <span className={`inline-flex w-fit items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${(product.stock > 0 || product.in_stock === 1) ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-600"}`}>
                  <Store className="h-3.5 w-3.5" />
                  {product.in_stock === 1 && product.stock === 0 ? "Stokda var" : product.stock > 0 ? `Stokda: ${product.stock} ədəd` : "Stokda yoxdur"}
                </span>
              </div>
              <h1 className="text-2xl font-bold leading-snug lg:text-3xl">{product.name}</h1>
              {(() => {
                type Color = { name: string; hex: string };
                let cols: Color[] = [];
                try { cols = JSON.parse(product.colors || "[]"); } catch {}
                if (cols.length === 0) return null;
                return <ColorSwatches colors={cols} selected={selectedColor} onSelect={setSelectedColor} />;
              })()}
              {(() => {
                const originalPrice = (() => {
                  if (product.extra_price != null) return product.price;
                  if (product.sale_price != null) return product.price;
                  if (product.discount > 0) return product.price;
                  // old_price tək başına varsa göstərmə — real endirim yoxdur
                  return null as number | null;
                })();
                return (
                  <div>
                    {originalPrice && <div className="text-base text-muted-foreground line-through">{originalPrice} AZN</div>}
                    <div className="text-4xl font-black">{activePrice} AZN</div>
                    {originalPrice && <div className="mt-1 text-sm font-semibold text-green-600">Qənaət: {(originalPrice - activePrice).toFixed(0)} AZN</div>}
                  </div>
                );
              })()}
              <button onClick={() => {
                const colorSuffix = selectedColor ? ` — ${selectedColor.name}` : "";
                addItem({ id: product.id, name: product.name + colorSuffix, price: activePrice, image: product.image, qty, credit_months: product.credit_months || 12 });
                toast.success("Səbətə əlavə edildi");
              }} className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] py-3.5 text-base font-bold text-white hover:opacity-90 transition">
                <ShoppingCart className="h-5 w-5" /> Səbətə əlavə et
              </button>
            </div>
          </div>

          {/* Lightbox */}
          {lightbox && currentUrl && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(false)}>
              <button onClick={() => setLightbox(false)} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
                <XIcon className="h-5 w-5" />
              </button>
              {allImages.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); prevImg(); }} className="absolute left-4 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); nextImg(); }} className="absolute right-4 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
                    <ChevronRightIcon className="h-6 w-6" />
                  </button>
                </>
              )}
              <img src={currentUrl} alt={product.name} onClick={(e) => e.stopPropagation()} className="max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl" />
              {allImages.length > 1 && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">{imgIdx + 1} / {allImages.length}</div>}
            </div>
          )}

          {/* ── RIGHT: kredit + xidmətlər + dəst ── */}
          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">

            {/* Reytinq + kod — mobil/tablet üçün (desktop sol sütunda göstərilir) */}
            <div className="flex lg:hidden items-center gap-2 flex-wrap">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRatingTop) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30"}`} />
                ))}
              </div>
              {reviewCount > 0 && <span className="text-sm font-semibold">{avgRatingTop.toFixed(1)}</span>}
              <span className="text-sm text-muted-foreground">({reviewCount} rəy)</span>
              <span className="ml-auto text-xs text-muted-foreground">Məhsul kodu: <strong>#{product.id}</strong></span>
            </div>

            {/* Stok + komissiyasız badge — mobil/tablet */}
            <div className="block lg:hidden flex flex-col gap-1.5">
              {(product.commission_free_months ?? 0) > 0 && (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-[var(--brand)]/40 bg-[var(--brand)] px-3 py-1.5 text-xs font-bold text-white">
                  💳 {product.commission_free_months} aya komissiyasız
                </span>
              )}
              <span className={`inline-flex w-fit items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${(product.stock > 0 || product.in_stock === 1) ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-600"}`}>
                <Store className="h-3.5 w-3.5" />
                {product.in_stock === 1 && product.stock === 0 ? "Stokda var" : product.stock > 0 ? `Stokda: ${product.stock} ədəd` : "Stokda yoxdur"}
              </span>
            </div>

            {/* Məhsul adı — mobil/tablet */}
            <h1 className="block lg:hidden text-xl font-bold leading-snug">{product.name}</h1>

            {/* Rənglər — mobil/tablet */}
            {(() => {
              type Color = { name: string; hex: string };
              let cols: Color[] = [];
              try { cols = JSON.parse(product.colors || "[]"); } catch {}
              if (cols.length === 0) return null;
              return (
                <div className="flex lg:hidden justify-start">
                  <ColorSwatches colors={cols} selected={selectedColor} onSelect={setSelectedColor} />
                </div>
              );
            })()}

            {/* Qiymət — mobil/tablet */}
            {(() => {
              const originalPrice = (() => {
                if (product.extra_price != null) return product.price;
                if (product.sale_price != null) return product.price;
                if (product.old_price && product.old_price > product.price) return product.old_price;
                if (product.discount > 0) return product.price;
                return null as number | null;
              })();
              return (
                <div className="block lg:hidden">
                  {originalPrice && <div className="text-base text-muted-foreground line-through">{originalPrice} AZN</div>}
                  <div className="text-3xl font-black">{activePrice} AZN</div>
                  {originalPrice && <div className="mt-1 text-sm font-semibold text-green-600">Qənaət: {(originalPrice - activePrice).toFixed(0)} AZN</div>}
                </div>
              );
            })()}

            {/* Səbətə əlavə et + Paylaş/Müqayisə/Bəyən — mobil/tablet */}
            <div className="flex lg:hidden items-center gap-2">
              <button onClick={() => {
                  if (selectedComps.size > 0) {
                    parsedComps.forEach((comp, i) => { if (selectedComps.has(i)) addItem({ id: product.id * 10000 + i + 1, name: `${comp.name} (${product.name})`, price: comp.price, image: product.image, qty }); });
                  } else {
                    const colorSuffix = selectedColor ? ` — ${selectedColor.name}` : "";
                    addItem({ id: product.id, name: product.name + colorSuffix, price: activePrice, image: product.image, qty, credit_months: product.credit_months || 12 });
                  }
                  toast.success("Səbətə əlavə edildi");
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] py-3.5 text-base font-bold text-white hover:opacity-90 transition">
                <ShoppingCart className="h-5 w-5" /> Səbətə əlavə et
              </button>
              <button onClick={handleShare}
                className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-3.5 text-sm font-medium hover:bg-secondary transition">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />}
                {copied ? "Kopyalandı" : "Paylaş"}
              </button>
              <button onClick={toggleCompare}
                className={`grid h-12 w-12 place-items-center rounded-xl border transition-colors ${inCompare ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]" : "border-border hover:bg-secondary"}`}>
                <Scale className="h-5 w-5" />
              </button>
              <button onClick={toggleWishlist}
                className={`grid h-12 w-12 place-items-center rounded-xl border transition-colors ${inWishlist ? "border-red-300 bg-red-50 text-red-500" : "border-border hover:bg-secondary"}`}>
                <Heart className={`h-5 w-5 ${inWishlist ? "fill-red-500" : ""}`} />
              </button>
            </div>

            {/* Bir kliklə al + Hissə-hissə ödə */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setMobileSheet("quick")}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 hover:border-[var(--accent-orange)] hover:bg-[var(--accent-orange)]/5 active:bg-secondary transition group">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-secondary group-hover:bg-[var(--accent-orange)]/10">
                  <MousePointerClick className="h-5 w-5 text-[var(--accent-orange)]" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold">Bir kliklə al</div>
                  <div className="text-xs text-muted-foreground">Sürətli sifariş</div>
                </div>
              </button>
              {(product.credit_months == null || product.credit_months > 0) && (
                <button onClick={() => { setCreditSelectedMonths(product.credit_months || 12); setMobileSheet("credit"); }}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--brand)] bg-[var(--brand)]/5 px-4 py-4 hover:bg-[var(--brand)]/10 active:bg-[var(--brand)]/15 transition">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--brand)]/10">
                    <CreditCard className="h-5 w-5 text-[var(--brand)]" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold">Hissə-hissə ödə</div>
                    <div className="text-xs text-[var(--brand)] font-semibold">
                      {(Math.ceil(activePrice / (product.credit_months || 12) * 100) / 100).toFixed(2)} AZN / {product.credit_months || 12} ay
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* Kredit şirkətləri carousel — desktop only */}
            {(() => {
              const hasCredit = product.credit_months == null ? true : product.credit_months > 0;
              if (!hasCredit || creditCompanies.length === 0) return null;
              return (
                <div>
                  <CreditCarousel companies={creditCompanies} price={activePrice} creditMonths={product.credit_months || 12} onOpen={() => setMobileSheet("credit")} />
                </div>
              );
            })()}


            {/* Xidmət kartları */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Truck, t: "Sürətli çatdırılma" },
                { icon: ShieldCheck, t: "Rəsmi zəmanət" },
                { icon: Store, t: "56 mağazada var" },
              ].map(({ icon: Icon, t }) => (
                <div key={t} className="flex flex-col items-center gap-1.5 rounded-xl border border-border p-3 text-center text-xs">
                  <Icon className="h-5 w-5 text-[var(--brand)]" />
                  {t}
                </div>
              ))}
            </div>

            {/* Dəst tərkibi */}
            {(() => {
              const comps = parsedComps;
              if (comps.length === 0) return null;
              return (
                <div className="rounded-2xl border border-border overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-secondary/40 flex items-center justify-between">
                    <p className="text-sm font-bold">Dəst tərkibi</p>
                    <span className="text-xs text-muted-foreground">İstədiyinizi seçin</span>
                  </div>
                  <div className="divide-y divide-border">
                    {comps.map((c, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/30 transition-colors">
                        <input type="checkbox" checked={selectedComps.has(i)}
                          onChange={() => setSelectedComps(prev => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next; })}
                          className="h-4 w-4 rounded accent-[var(--brand)] cursor-pointer flex-shrink-0" />
                        <span className="flex-1 text-sm">{c.name}</span>
                        <span className="text-sm font-semibold text-[var(--brand)] flex-shrink-0">{c.price} AZN</span>
                        <button onClick={() => { addItem({ id: product.id * 10000 + i + 1, name: `${c.name} (${product.name})`, price: c.price, image: product.image, qty: 1 }); toast.success(`${c.name} səbətə əlavə edildi`); }}
                          className="flex-shrink-0 rounded-lg border border-[var(--brand)] px-2 py-1 text-xs font-semibold text-[var(--brand)] hover:bg-[var(--brand)] hover:text-[var(--brand-foreground)] transition-colors">
                          + Səbətə
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-secondary/40">
                      <span className="text-sm font-bold">Cəmi</span>
                      <span className="text-sm font-black text-[var(--accent-orange)]">{selectedCompsTotal} AZN</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Info Tabs */}
        <ProductTabs product={product} />

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-10 md:mt-16">
            <p className="text-xs font-semibold text-[var(--accent-orange)] uppercase tracking-wide mb-1">Oxşar məhsullar</p>
            <h2 className="mb-4 text-xl font-bold md:mb-5 md:text-2xl">Bunları da bəyənəcəksən!</h2>
            <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
              {related.map((p) => {
                const rImg = getImageUrl(p.image);
                const rActive = (() => {
                  if (p.extra_price != null) return p.extra_price;
                  if (p.sale_price != null) return p.sale_price;
                  if (p.old_price && p.old_price > p.price) return p.price;
                  if (p.discount > 0) return Math.round(p.price * (1 - p.discount / 100));
                  return p.price;
                })();
                const rOrig = p.extra_price != null ? p.price : p.sale_price != null ? p.price : p.old_price && p.old_price > p.price ? p.old_price : null;
                const rDisc = rOrig ? Math.round((1 - rActive / rOrig) * 100) : 0;
                const months = p.credit_months || 12;
                return (
                  <Link key={p.id} to="/mehsul/$slug" params={{ slug: String(p.id) }}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-lg">
                    {rDisc > 0 && (
                      <div className="absolute right-2 top-2 z-10 rounded-lg bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold text-yellow-900">−{rDisc}%</div>
                    )}
                    <div className="aspect-square overflow-hidden bg-white">
                      {rImg
                        ? <img src={rImg} alt={p.name} className="h-full w-full object-contain group-hover:scale-105 transition duration-500" loading="lazy" />
                        : <div className="flex h-full w-full items-center justify-center text-4xl">{p.image || "📦"}</div>}
                    </div>
                    <div className="p-3">
                      <div className="line-clamp-2 text-xs font-medium md:text-sm">{p.name}</div>
                      <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
                        <span className="font-black text-base">{rActive} AZN</span>
                        {rOrig && <span className="text-xs text-muted-foreground line-through">{rOrig} AZN</span>}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-yellow-500 truncate">
                        <Zap className="h-3 w-3 flex-shrink-0" /><span className="truncate">{months} aya {(Math.ceil(rActive / months * 100) / 100).toFixed(2)} AZN/ay</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div className="h-24 md:hidden" /> {/* sticky bar spacer */}

      {/* ── Sticky bottom bar (mobile only) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background border-t border-border shadow-2xl px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {(() => {
              const origP = product.extra_price != null ? product.price : product.sale_price != null ? product.price : product.old_price && product.old_price > product.price ? product.old_price : null;
              return origP ? <div className="text-xs text-muted-foreground line-through">{origP} AZN</div> : null;
            })()}
            <div className="text-xl font-black leading-tight">{activePrice} AZN</div>
          </div>
          <button onClick={() => setMobileSheet("quick")}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent-orange)]/10 border border-[var(--accent-orange)] py-3 text-sm font-semibold text-[var(--accent-orange)] transition">
            <MousePointerClick className="h-4 w-4" /> Bir kliklə sifariş et
          </button>
          <button onClick={() => {
              const colorSuffix = selectedColor ? ` — ${selectedColor.name}` : "";
              addItem({ id: product.id, name: product.name + colorSuffix, price: activePrice, image: product.image, qty, credit_months: product.credit_months || 12 });
              toast.success("Səbətə əlavə edildi");
            }}
            className="flex-shrink-0 grid h-12 w-12 place-items-center rounded-xl bg-[var(--brand)] text-white hover:opacity-90">
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      <SiteFooter />


      {/* ── Mobile Bottom Sheet: Bir kliklə al ── */}
      <MobileSheet open={mobileSheet === "quick"} onClose={() => setMobileSheet(null)}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold">Bir kliklə sifariş</h2>
            <p className="text-xs text-muted-foreground line-clamp-1">{product.name}</p>
          </div>
          <button onClick={() => setMobileSheet(null)} className="grid h-9 w-9 place-items-center rounded-full bg-secondary">
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 pb-8 pt-4 space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-secondary/40 px-4 py-3">
            <span className="text-sm text-muted-foreground">Məhsul qiyməti</span>
            <span className="text-xl font-black text-[var(--brand)]">{activePrice} AZN</span>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Ad Soyad *</label>
            <input className={minp} placeholder="Adınızı yazın" value={orderForm.name}
              onChange={e => setOrderForm({...orderForm, name: e.target.value})} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Telefon *</label>
            <input className={minp} placeholder="+994 XX XXX XX XX" type="tel" value={orderForm.phone}
              onChange={e => setOrderForm({...orderForm, phone: e.target.value})} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Çatdırılma ünvanı</label>
            <input className={minp} placeholder="Ünvanı daxil edin" value={orderForm.address}
              onChange={e => setOrderForm({...orderForm, address: e.target.value})} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Promokod</label>
            <div className="flex gap-2">
              <input className={`${minp} flex-1`} placeholder="Promokodu daxil edin" value={orderForm.promo}
                onChange={e => { setOrderForm({...orderForm, promo: e.target.value}); setPromoResult(null); setPromoError(""); }}
                onKeyDown={e => e.key === "Enter" && applyPromo()} />
              <button onClick={applyPromo} disabled={promoBusy || !orderForm.promo.trim()}
                className="rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-40">
                {promoBusy ? "..." : "Tətbiq"}
              </button>
            </div>
            {promoResult && <p className="mt-1 text-xs text-green-600 font-semibold">✓ −{promoResult.discount} AZN endirim</p>}
            {promoError && <p className="mt-1 text-xs text-destructive">{promoError}</p>}
          </div>
          <button onClick={() => {
            setMobileSheet(null);
            navigate({
              to: "/sifaris",
              search: {
                product_id: product.id,
                qty: 1,
                name: orderForm.name,
                phone: orderForm.phone,
                address: orderForm.address,
                promo: orderForm.promo,
              },
            });
          }}
            className="w-full rounded-xl bg-[var(--brand)] py-3.5 font-semibold text-white hover:opacity-90">
            Sifarişi rəsmiləşdir →
          </button>
        </div>
      </MobileSheet>

      {/* ── Mobile Bottom Sheet: Hissə-hissə ödə ── */}
      <MobileSheet open={mobileSheet === "credit"} onClose={() => setMobileSheet(null)}>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            {(() => { const op = product.extra_price != null ? product.price : product.sale_price != null ? product.price : product.old_price && product.old_price > product.price ? product.old_price : null; return op ? <div className="text-xs text-muted-foreground line-through">{op} AZN</div> : null; })()}
            <div className="text-2xl font-black">{activePrice} AZN</div>
          </div>
          <button onClick={() => setMobileSheet(null)}
            className="grid h-9 w-9 place-items-center rounded-full bg-secondary hover:bg-border transition">
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 pb-6 space-y-4">
          {(() => {
            const creditOnlyCompanies = creditCompanies.filter(co => co.type !== "nisye");
            return (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {creditOnlyCompanies.map(co => {
                  const logoUrl = getImageUrl(co.logo);
                  const active = orderForm.payment_type === `cc_${co.id}`;
                  return (
                    <button key={co.id} onClick={() => { setOrderForm({...orderForm, payment_type: `cc_${co.id}`}); const plans = parsePlans(co.plans); const keep = plans.find(p => p.months === creditSelectedMonths); if (!keep) setCreditSelectedMonths(plans.find(p => p.months === (product.credit_months || 12))?.months ?? plans[0]?.months ?? 12); }}
                      className={`flex-shrink-0 rounded-xl border-2 transition overflow-hidden ${active ? "border-foreground" : "border-border hover:border-foreground"}`}
                      style={{padding: 0, height: 44, width: 96}}>
                      {logoUrl
                        ? <img src={logoUrl} alt={co.name} className="h-full w-full object-cover" />
                        : <span className="flex h-full w-full items-center justify-center text-xs font-semibold px-2">{co.name}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })()}
          {(() => {
            const selCo = creditCompanies.find(co => orderForm.payment_type === `cc_${co.id}`);
            const plans = selCo ? parsePlans(selCo.plans) : [6,12,18,24].map(m => ({ months: m, rate: 0, label: "" }));
            // şirkətin öz free_months-u varsa onu işlət, yoxsa məhsulun credit_months-u
            const freeMonths = selCo?.free_months != null ? selCo.free_months : (product.credit_months || 999);
            const selPlan = plans.find(p => p.months === creditSelectedMonths) ?? plans[0];
            const activeMonths = selPlan?.months ?? creditSelectedMonths;
            const remaining = Math.max(0, activePrice - downPayment);
            const effectiveRate = activeMonths <= freeMonths ? 0 : (selPlan?.rate ?? 0);
            const financed = remaining * (1 + effectiveRate / 100);
            const monthly = (Math.ceil(financed / activeMonths * 100) / 100).toFixed(2);
            const totalPaid = (parseFloat(monthly) * activeMonths + downPayment).toFixed(2);
            return (
              <div className="space-y-3">
                <div className="rounded-2xl bg-secondary/30 p-4 space-y-3">
                  <p className="text-base font-bold">Müddət</p>
                  <div className="flex flex-wrap gap-2">
                    {plans.map(p => {
                      const isFree = p.months <= freeMonths;
                      const isSelected = creditSelectedMonths === p.months;
                      return (
                        <button key={p.months} onClick={() => setCreditSelectedMonths(p.months)}
                          className={`rounded-xl border-2 px-4 py-2 text-sm font-semibold transition ${
                            isSelected
                              ? isFree ? "bg-[var(--brand)] border-[var(--brand)] text-white" : "bg-yellow-400 border-yellow-400 text-yellow-900"
                              : isFree ? "border-border bg-background hover:bg-secondary" : "border-yellow-200 bg-yellow-50 text-yellow-700 hover:border-yellow-400"
                          }`}>
                          {p.months} ay
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* İlkin ödəniş */}
                <div className="rounded-2xl bg-secondary/30 p-4 space-y-3">
                  <p className="text-base font-bold">İlkin ödəniş</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setDownPayment(d => Math.max(0, d - 50))}
                      className="h-12 w-12 flex-shrink-0 rounded-2xl border border-border bg-background text-xl font-bold hover:bg-secondary transition">−</button>
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        type="number" min={0} max={activePrice}
                        value={downPayment || ""}
                        onChange={e => setDownPayment(Math.min(activePrice, Math.max(0, Number(e.target.value) || 0)))}
                        placeholder="0"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-center text-lg font-black outline-none focus:border-[var(--brand)]"
                      />
                      <span className="text-sm font-semibold text-muted-foreground flex-shrink-0">AZN</span>
                    </div>
                    <button onClick={() => setDownPayment(d => Math.min(activePrice, d + 50))}
                      className="h-12 w-12 flex-shrink-0 rounded-2xl border-2 border-[var(--brand)] bg-background text-xl font-bold text-[var(--brand)] hover:bg-[var(--brand)]/5 transition">+</button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground px-1">
                  <strong>Qeyd:</strong> Sifarişin rəsmiləşdirilməsi zamanı 10%-ə qədər xidmət haqqı əlavə oluna bilər
                </p>
                <div className="flex gap-4 rounded-2xl bg-background px-4 py-3 border border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Aylıq ödəniş:</p>
                    <p className="text-2xl font-black">{monthly} AZN</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Yekun məbləğ:</p>
                    <p className="text-2xl font-black">{totalPaid} AZN</p>
                  </div>
                </div>
                {/* Sifariş et */}
                <button onClick={() => setMobileSheet("quick")}
                  className="w-full rounded-2xl bg-[var(--brand)] py-4 font-bold text-white hover:opacity-90 text-sm">
                  Sifariş et
                </button>
              </div>
            );
          })()}
        </div>
      </MobileSheet>



      {/* Login Modal */}
      {loginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setLoginModal(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-bold">Hesabınıza daxil olun</h2>
              <button onClick={() => setLoginModal(false)} className="rounded-lg p-1.5 hover:bg-secondary"><XIcon className="h-5 w-5" /></button>
            </div>
            <div className="flex border-b border-border">
              <button onClick={() => setLoginTab("login")} className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${loginTab === "login" ? "border-b-2 border-[var(--brand)] text-[var(--brand)]" : "text-muted-foreground hover:text-foreground"}`}>Daxil ol</button>
              <button onClick={() => setLoginTab("register")} className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${loginTab === "register" ? "border-b-2 border-[var(--brand)] text-[var(--brand)]" : "text-muted-foreground hover:text-foreground"}`}>Qeydiyyat</button>
            </div>
            <div className="p-6 space-y-3">
              {loginTab === "login" ? (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Email</label>
                    <input className={minp} type="email" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Şifrə</label>
                    <input className={minp} type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && submitLogin()} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Ad Soyad</label>
                    <input className={minp} value={registerForm.full_name} onChange={e => setRegisterForm({...registerForm, full_name: e.target.value})} placeholder="Adınız" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Email</label>
                    <input className={minp} type="email" value={registerForm.email} onChange={e => setRegisterForm({...registerForm, email: e.target.value})} placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Mobil nömrə *</label>
                    <input className={minp} type="tel" value={registerForm.phone} onChange={e => setRegisterForm({...registerForm, phone: e.target.value})} placeholder="+994 50 000 00 00" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Şifrə</label>
                    <input className={minp} type="password" value={registerForm.password} onChange={e => setRegisterForm({...registerForm, password: e.target.value})} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && submitLogin()} />
                  </div>
                </>
              )}
              <button onClick={submitLogin} disabled={loginBusy}
                className="w-full rounded-xl bg-[var(--brand)] py-2.5 font-semibold text-[var(--brand-foreground)] hover:opacity-90 disabled:opacity-50">
                {loginBusy ? "..." : loginTab === "login" ? "Daxil ol" : "Qeydiyyatdan keç"}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                {pendingAction === "wishlist" ? "Bəyəndiklərimə əlavə etmək üçün" : pendingAction === "compare" ? "Müqayisəyə əlavə etmək üçün" : ""} giriş tələb olunur
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreditCarousel({ companies, price, creditMonths, onOpen }: {
  companies: CreditCompany[];
  price: number;
  creditMonths: number;
  onOpen: () => void;
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (companies.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % companies.length), 3000);
    return () => clearInterval(t);
  }, [companies.length]);

  const co = companies[idx];
  const logoUrl = getImageUrl(co.logo);

  // Per-company free months limit
  const freeLimit = co.free_months != null ? co.free_months : creditMonths;
  const isFree = creditMonths <= freeLimit;
  const coPlans = parsePlans(co.plans);
  const plan = coPlans.find(p => p.months === creditMonths) ?? coPlans.reduce((a, b) => Math.abs(b.months - creditMonths) < Math.abs(a.months - creditMonths) ? b : a, coPlans[0]);
  const rate = isFree ? 0 : (plan?.rate ?? 0);
  const total = price * (1 + rate / 100);
  const monthly = (Math.ceil(total / creditMonths * 100) / 100).toFixed(2);
  const subtitle = isFree
    ? `${co.name} ilə ${creditMonths} aya faizsiz · komissiyasız`
    : `${co.name} ilə ${creditMonths} ay · +${rate}% faiz`;

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--accent-orange)]">
      {/* Slide */}
      <button onClick={onOpen}
        className="w-full flex items-center gap-4 bg-card px-5 py-4 text-left hover:bg-secondary/30 transition-colors">
        <div className="flex h-14 w-28 flex-shrink-0 items-center justify-center">
          {logoUrl
            ? <img src={logoUrl} alt={co.name} className="max-h-full max-w-full object-contain" />
            : <span className="text-base font-extrabold text-center text-[var(--accent-orange)]">{co.name}</span>}
        </div>
        <div className="min-w-0">
          <div className="text-xl font-extrabold leading-tight">{monthly} AZN × {creditMonths} ay</div>
          <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{subtitle}</div>
        </div>
      </button>
      {/* Dots */}
      {companies.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-2.5">
          {companies.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`rounded-full transition-all ${i === idx ? "w-4 h-1.5 bg-[var(--accent-orange)]" : "w-1.5 h-1.5 bg-[var(--accent-orange)]/30 hover:bg-[var(--accent-orange)]/60"}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function ColorSwatches({ colors, selected, onSelect }: {
  colors: { name: string; hex: string }[];
  selected: { name: string; hex: string } | null;
  onSelect: (c: { name: string; hex: string } | null) => void;
}) {
  const selectedIdx = selected ? colors.findIndex(c => c.hex === selected.hex && c.name === selected.name) : -1;
  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {colors.map((c, i) => (
          <button
            key={i}
            onClick={() => onSelect(selectedIdx === i ? null : c)}
            title={c.name}
            className={`relative h-9 w-9 rounded-full border-2 transition-all ${selectedIdx === i ? "border-[var(--brand)] scale-110 shadow-md" : "border-transparent hover:border-muted-foreground/40"}`}
            style={{ backgroundColor: c.hex }}
          >
            {selectedIdx === i && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="h-2.5 w-2.5 rounded-full bg-white shadow" />
              </span>
            )}
          </button>
        ))}
      </div>
      {selected?.name && (
        <span className="text-xs text-muted-foreground">Seçilmiş rəng: <span className="font-semibold text-foreground">{selected.name}</span></span>
      )}
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button"
          onClick={() => onChange?.(i)}
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => onChange && setHover(0)}
          className={`text-2xl transition-transform ${onChange ? "cursor-pointer hover:scale-110" : "cursor-default"}`}>
          <span className={(hover || value) >= i ? "text-yellow-400" : "text-muted-foreground/30"}>★</span>
        </button>
      ))}
    </div>
  );
}

function ProductTabs({ product }: { product: Product }) {
  const [tab, setTab] = useState<"desc" | "specs" | "reviews">("desc");
  const [reviews, setReviews] = useState<import("@/lib/api").ProductReview[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [form, setForm] = useState({ author_name: "", rating: 5, body: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadReviews = () => {
    api.getProductReviews(product.id).then(r => { setReviews(r); setReviewsLoaded(true); }).catch(() => setReviewsLoaded(true));
  };

  useEffect(() => {
    if (tab === "reviews" && !reviewsLoaded) loadReviews();
  }, [tab]);

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;

  const tabs = [
    { id: "desc",    label: "Təsvir" },
    { id: "specs",   label: "Texniki xüsusiyyətlər" },
    { id: "reviews", label: `Reytinq və rəylər${reviews.length > 0 ? ` (${reviews.length})` : ""}` },
  ] as const;

  return (
    <div className="mt-8 md:mt-12">
      {/* Tab bar */}
      <div className="flex border-b border-border overflow-x-auto scrollbar-none">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.id
                ? "border-[var(--accent-orange)] text-[var(--accent-orange)]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="py-6">
        {tab === "desc" && (
          <div className="max-w-3xl text-sm text-foreground leading-relaxed">
            {product.description
              ? product.description.split("\n").map((line, i) =>
                  line.trim() === ""
                    ? <div key={i} className="h-3" />
                    : <p key={i} className="mb-1">{line}</p>
                )
              : <p className="text-muted-foreground">Məhsul haqqında məlumat əlavə edilməyib.</p>}
          </div>
        )}
        {tab === "specs" && (() => {
          type Spec = { group?: string; label: string; value: string };
          let specs: Spec[] = [];
          try { specs = JSON.parse(product.specifications || "[]"); } catch {}
          if (specs.length === 0) return <p className="text-sm text-muted-foreground">Texniki xüsusiyyətlər əlavə edilməyib.</p>;
          const groups: Record<string, Spec[]> = {};
          for (const s of specs) {
            const g = s.group?.trim() || "Ümumi";
            if (!groups[g]) groups[g] = [];
            groups[g].push(s);
          }
          const groupEntries = Object.entries(groups);
          return (
            <div className="max-w-3xl space-y-8">
              {groupEntries.map(([grp, items]) => (
                <div key={grp}>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[var(--brand)]">
                      <span className="text-base">⚙</span>
                    </div>
                    <h3 className="text-lg font-bold">{grp}</h3>
                  </div>
                  <div className="space-y-0 border-t border-border">
                    {items.map((s, i) => (
                      <div key={i} className="flex items-baseline gap-2 border-b border-border py-2.5 text-sm">
                        <span className="text-muted-foreground min-w-0 flex-shrink-0 w-48">{s.label}:</span>
                        <span className="font-medium">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
        {tab === "reviews" && (
          <div className="space-y-6">
            {/* Summary */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-4 rounded-2xl border border-border bg-secondary/20 px-5 py-4">
                <div className="text-center">
                  <div className="text-4xl font-black">{avgRating.toFixed(1)}</div>
                  <StarRating value={Math.round(avgRating)} />
                  <div className="mt-1 text-xs text-muted-foreground">{reviews.length} rəy</div>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5,4,3,2,1].map(s => {
                    const cnt = reviews.filter(r => r.rating === s).length;
                    const pct = reviews.length ? Math.round(cnt / reviews.length * 100) : 0;
                    return (
                      <div key={s} className="flex items-center gap-2 text-xs">
                        <span className="w-4 text-right text-muted-foreground">{s}</span>
                        <span className="text-yellow-400 text-xs">★</span>
                        <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                          <div className="h-full rounded-full bg-yellow-400 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-6 text-muted-foreground">{cnt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Review list */}
            {!reviewsLoaded && <div className="text-center text-sm text-muted-foreground py-6">Yüklənir...</div>}
            {reviewsLoaded && reviews.length === 0 && !submitted && (
              <p className="text-sm text-muted-foreground">Hələ rəy yazılmayıb. Birinci siz yazın!</p>
            )}
            {reviews.map(r => (
              <div key={r.id} className="rounded-2xl border border-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">{r.author_name}</div>
                  <div className="text-xs text-muted-foreground">{r.created_at ? new Date(r.created_at).toLocaleDateString("az-AZ") : ""}</div>
                </div>
                <StarRating value={r.rating} />
                <p className="text-sm text-foreground leading-relaxed">{r.body}</p>
              </div>
            ))}

            {/* Write review form */}
            {submitted ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700 font-medium">
                ✓ Rəyiniz qəbul edildi. Təşəkkür edirik!
              </div>
            ) : (
              <div className="rounded-2xl border border-border p-5 space-y-4">
                <h3 className="font-bold">Rəy yaz</h3>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Reytinq</label>
                  <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Ad (opsional)</label>
                  <input className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)] transition-colors"
                    placeholder="Adınız..." value={form.author_name}
                    onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Rəy *</label>
                  <textarea className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)] transition-colors resize-none"
                    rows={3} placeholder="Məhsul haqqında fikirlərinizi yazın..."
                    value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
                </div>
                <button disabled={submitting || !form.body.trim()}
                  onClick={async () => {
                    setSubmitting(true);
                    try {
                      await api.createReview(product.id, { author_name: form.author_name || "Anonim", rating: form.rating, body: form.body });
                      setSubmitted(true);
                      loadReviews();
                    } catch {}
                    setSubmitting(false);
                  }}
                  className="rounded-xl bg-[var(--brand)] px-6 py-2.5 text-sm font-semibold text-[var(--brand-foreground)] hover:opacity-90 disabled:opacity-40 transition-opacity">
                  {submitting ? "Göndərilir..." : "Rəyi göndər"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InlineCredit({ price, isFree, creditMonths = 12, onOpenCalc }: { price: number; isFree: boolean; creditMonths?: number; onOpenCalc: () => void }) {
  const allRows = [6, 12, 18, 24];
  const rows = allRows.filter(m => m <= creditMonths);
  const defaultSel = rows.includes(creditMonths) ? creditMonths : (rows[Math.floor(rows.length / 2)] ?? rows[0] ?? 12);
  const [selected, setSelected] = useState(defaultSel);
  const monthly = (m: number) => (Math.ceil(price / m * 100) / 100).toFixed(2);

  return (
    <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between bg-[var(--brand)]/5 px-4 py-2.5 border-b border-border">
        <span className="text-sm font-bold text-foreground">{isFree ? "İlkin ödənişsiz hissə-hissə ödə!" : "Hissə-hissə ödə!"}</span>
        {isFree && (
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
            ✓ Komissiyasız
          </span>
        )}
      </div>

      {/* Table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/30 text-xs text-muted-foreground">
            <th className="w-10 py-2 pl-4 text-left font-medium">Seçim</th>
            <th className="py-2 text-center font-medium">İlkin ödəniş</th>
            <th className="py-2 text-center font-medium">Müddət</th>
            <th className="py-2 text-center font-medium">Aylıq ödəniş</th>
            <th className="py-2 pr-4 text-center font-medium">Yekun məbləğ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(m => (
            <tr key={m} onClick={() => setSelected(m)}
              className={`cursor-pointer border-b border-border transition-colors last:border-0 ${selected === m ? "bg-[var(--brand)]/5" : "hover:bg-secondary/30"}`}>
              <td className="py-3 pl-4">
                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors ${selected === m ? "border-[var(--brand)]" : "border-muted-foreground/30"}`}>
                  {selected === m && <div className="h-2 w-2 rounded-full bg-[var(--brand)]" />}
                </div>
              </td>
              <td className="py-3 text-center text-muted-foreground">0</td>
              <td className="py-3 text-center font-semibold">{m} ay</td>
              <td className="py-3 text-center font-bold text-[var(--brand)] text-base">{monthly(m)} AZN</td>
              <td className="py-3 pr-4 text-center text-muted-foreground">{price.toFixed(2)} AZN</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Buttons */}
      <div className="flex gap-2 border-t border-border bg-secondary/20 p-3">
        <button onClick={onOpenCalc}
          className="flex-1 rounded-xl border border-border bg-background py-2.5 text-sm font-semibold hover:bg-secondary transition-colors">
          Hissəli alış kalkulyatoru
        </button>
        <button onClick={onOpenCalc}
          className="flex-1 rounded-xl bg-[var(--brand)] py-2.5 text-sm font-semibold text-[var(--brand-foreground)] hover:opacity-90 transition-opacity">
          Hissə-hissə al
        </button>
      </div>
    </div>
  );
}

function CreditModal({ product, onClose, onOrder }: { product: Product; onClose: () => void; onOrder: () => void }) {
  const [companies, setCompanies] = useState<CreditCompany[]>([]);
  const [companyIdx, setCompanyIdx] = useState(0);
  const [months, setMonths] = useState(12);
  const [downPayment, setDownPayment] = useState("");

  useEffect(() => {
    api.getCreditCompanies().then(list => {
      setCompanies(list);
      if (list.length > 0) {
        const plans = parsePlansLocal(list[0].plans);
        setMonths(plans[0]?.months ?? 12);
      }
    }).catch(() => {});
  }, []);

  const parsePlansLocal = (raw: import("@/lib/api").CreditPlan[] | string): import("@/lib/api").CreditPlan[] => {
    if (Array.isArray(raw)) return raw;
    try { return JSON.parse(raw as string); } catch { return []; }
  };

  const activePrice = (() => {
    if (product.extra_price != null) return product.extra_price;
    if (product.sale_price != null) return product.sale_price;
    if (product.old_price && product.old_price > product.price) return product.price;
    if (product.discount > 0) return Math.round(product.price * (1 - product.discount / 100));
    return product.price;
  })();
  const basePrice = activePrice;

  const currentCompany = companies[companyIdx];
  const currentPlans = currentCompany ? parsePlansLocal(currentCompany.plans) : [];
  const validPlan = currentPlans.find(p => p.months === months) ?? currentPlans[0];
  const validMonths = validPlan?.months ?? months;

  const down = Math.min(Math.max(parseFloat(downPayment) || 0, 0), basePrice - 1);
  const financed = basePrice - down;

  const freeMonthsLimit = product.credit_months || 999;
  const effectiveRate = validMonths <= freeMonthsLimit ? 0 : (validPlan?.rate ?? 0);
  let monthly: number;
  let totalPaid: number;
  let overpay: number;

  if (effectiveRate > 0) {
    const total = Math.ceil(financed * (1 + effectiveRate / 100));
    monthly = Math.ceil(total / validMonths);
    totalPaid = monthly * validMonths + down;
    overpay = totalPaid - basePrice;
  } else {
    monthly = Math.ceil(financed / validMonths * 100) / 100;
    totalPaid = +(monthly * validMonths + down).toFixed(2);
    overpay = 0;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-background shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold">Kredit hesabla</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-secondary"><XIcon className="h-5 w-5" /></button>
        </div>
        <div className="p-5 space-y-4">


          {/* Məhsul qiyməti */}
          <div className="flex items-center justify-between rounded-xl bg-secondary/40 px-4 py-3">
            <span className="text-sm text-muted-foreground">Məhsul qiyməti</span>
            <span className="text-xl font-black">{basePrice} AZN</span>
          </div>

          {/* Kredit şirkəti seçimi */}
          {companies.length === 0 ? (
            <div className="rounded-xl bg-secondary/40 px-4 py-3 text-center text-sm text-muted-foreground">
              Admin paneldən kredit şirkəti əlavə edin
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-semibold">Kredit şirkəti seçin</label>
              {/* Scrollable card row */}
              <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
                {companies.map((c, i) => {
                  const logoUrl = getImageUrl(c.logo);
                  const isActive = companyIdx === i;
                  return (
                    <button key={c.id} onClick={() => {
                      setCompanyIdx(i);
                      const plans = parsePlansLocal(c.plans);
                      setMonths(plans[0]?.months ?? 12);
                    }}
                      className={`snap-start flex-shrink-0 flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-4 py-3 transition-all w-28 ${isActive ? "border-[var(--brand)] bg-[var(--brand)]/5 shadow-md" : "border-border hover:border-[var(--brand)]/50"}`}>
                      {logoUrl
                        ? <img src={logoUrl} alt={c.name} className="h-10 w-20 object-contain" />
                        : <span className="text-sm font-bold text-center leading-tight">{c.name}</span>
                      }
                      {logoUrl && <span className="text-[10px] font-semibold text-muted-foreground">{c.name}</span>}
                    </button>
                  );
                })}
              </div>
              {validPlan && validPlan.rate === 0 && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-green-600 font-medium">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" /> Faizsiz · Komissiyasız
                </div>
              )}
            </div>
          )}

          {/* Müddət seçimi */}
          {currentPlans.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-semibold">Müddət</label>
              <div className="flex flex-wrap gap-2">
                {currentPlans.map(p => {
                  const isSelected = validMonths === p.months;
                  const hasFaiz = p.months > freeMonthsLimit && p.rate > 0;
                  return (
                    <button key={p.months} onClick={() => setMonths(p.months)}
                      className={`rounded-lg border-2 px-3 py-1.5 text-sm font-semibold transition ${
                        isSelected
                          ? hasFaiz
                            ? "border-yellow-400 bg-yellow-50 text-yellow-800"
                            : "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)]"
                          : hasFaiz
                            ? "border-yellow-200 bg-yellow-50/50 text-yellow-700 hover:border-yellow-400"
                            : "border-border hover:bg-secondary"
                      }`}>
                      {p.months} ay{p.label ? ` · ${p.label}` : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* İlkin ödəniş kalkulyatoru */}
          <div>
            <label className="mb-2 block text-sm font-semibold">İlkin ödəniş (opsional)</label>
            <div className="flex gap-2 items-center">
              <input
                type="number" min="0" max={basePrice - 1}
                value={downPayment}
                onChange={e => setDownPayment(e.target.value)}
                placeholder="0 AZN"
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)] transition-colors"
              />
              <span className="text-sm text-muted-foreground">Qalan: <b>{financed.toFixed(0)} AZN</b></span>
            </div>
          </div>

          {/* Nəticə */}
          <div className="rounded-xl bg-[var(--brand)]/5 border border-[var(--brand)]/20 p-4">
            <div className="text-center mb-3">
              <div className="text-xs text-muted-foreground">Aylıq ödəniş</div>
              <div className="text-4xl font-black text-[var(--brand)]">{monthly.toFixed(2)} AZN</div>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>{validMonths} ay × {monthly.toFixed(2)} AZN</span><span>{(monthly * validMonths).toFixed(2)} AZN</span></div>
              {down > 0 && <div className="flex justify-between"><span>İlkin ödəniş</span><span>+{down.toFixed(0)} AZN</span></div>}
              <div className="flex justify-between font-semibold text-foreground border-t border-border pt-1 mt-1">
                <span>Ümumi cəmi</span><span>{totalPaid.toFixed(2)} AZN</span>
              </div>
              {overpay > 0 && <div className="flex justify-between text-orange-600"><span>Faiz məbləği</span><span>+{overpay.toFixed(0)} AZN</span></div>}
            </div>
          </div>

          {validPlan && validPlan.rate > 0 && (
            <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 text-xs text-yellow-800">
              <strong>+{validPlan.rate}% faiz</strong> tətbiq edilir. Komissiya da tələb oluna bilər.
            </div>
          )}

          <button onClick={onOrder}
            className="w-full rounded-xl bg-[var(--brand)] py-3 font-semibold text-[var(--brand-foreground)] hover:opacity-90">
            Kredit ilə sifariş ver
          </button>
        </div>
      </div>
    </div>
  );
}

const minp = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)] transition-colors";

function MobileSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const dragY = useRef(0);
  const isDragging = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
    if (sheetRef.current) sheetRef.current.style.transition = "none";
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dy = e.touches[0].clientY - startY.current;
    dragY.current = dy;
    if (dy > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${dy}px)`;
    }
  };

  const onTouchEnd = () => {
    isDragging.current = false;
    if (sheetRef.current) sheetRef.current.style.transition = "";
    if (dragY.current > 80) {
      onClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = "";
    }
    dragY.current = 0;
  };

  // body scroll lock
  React.useEffect(() => {
    if (open) { document.body.style.overflow = "hidden"; }
    else { document.body.style.overflow = ""; }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col justify-end transition-all duration-300 ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
      {/* Backdrop */}
      <div className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose} />
      {/* Sheet */}
      <div ref={sheetRef}
        className={`relative bg-background rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
        onClick={e => e.stopPropagation()}>
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        {children}
      </div>
    </div>
  );
}
