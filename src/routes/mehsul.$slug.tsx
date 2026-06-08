import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  Heart, Scale, Share2, Truck, ShieldCheck, Store,
  ChevronRight, ShoppingCart, MousePointerClick, CreditCard, Star, Zap,
  ChevronLeft, ChevronRight as ChevronRightIcon, X as XIcon, Check,
} from "lucide-react";
import { api, getImageUrl, type Product, type Category } from "@/lib/api";
import { SiteHeader, SiteFooter } from "@/components/SiteLayout";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

export const Route = createFileRoute("/mehsul/$slug")({
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { user, login, register } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [creditCompanies, setCreditCompanies] = useState<import("@/lib/api").CreditCompany[]>([]);
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [creditModal, setCreditModal] = useState(false);
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
    api.getCreditCompanies().then(setCreditCompanies).catch(() => {});
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
      setOrderModal(false);
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
  const cartPrice = activePrice + selectedCompsTotal;

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

        <div className="grid grid-cols-1 gap-4 lg:gap-8 lg:grid-cols-2">
          {/* Image */}
          <div className="flex flex-col gap-3">
            {/* Main image */}
            <div
              className="relative overflow-hidden rounded-2xl border border-border bg-secondary/20 aspect-square flex items-center justify-center cursor-zoom-in"
              onClick={() => currentUrl && setLightbox(true)}
            >
              {currentUrl
                ? <img src={currentUrl} alt={product.name} className="h-full w-full object-contain" />
                : <span className="text-8xl">{product.image || "📦"}</span>}
              {(() => {
                const origP = (() => {
                  if (product.extra_price != null) return product.price;
                  if (product.sale_price != null) return product.price;
                  if (product.old_price && product.old_price > product.price) return product.old_price;
                  if (product.discount > 0) return product.price;
                  return null as number | null;
                })();
                const discountPct = origP ? Math.round((1 - activePrice / origP) * 100) : 0;
                const savingAmt = origP ? (origP - activePrice) : 0;
                if (!discountPct) return null;
                return (
                  <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1.5">
                    <div className="rounded-xl bg-[var(--accent-orange)] px-3 py-1 text-sm font-bold text-white shadow-lg">−{discountPct}%</div>
                    <div className="rounded-xl bg-[var(--accent-orange)]/90 px-3 py-1 text-xs font-semibold text-white shadow-lg">−{savingAmt.toFixed(0)} AZN</div>
                  </div>
                );
              })()}
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
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {allImages.map((_, i) => (
                      <button key={i} onClick={(e) => { e.stopPropagation(); setImgIdx(i); }}
                        className={`h-1.5 rounded-full transition-all ${i === imgIdx ? "w-5 bg-white" : "w-1.5 bg-white/60"}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, i) => {
                  const url = getImageUrl(img);
                  return (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className={`flex-shrink-0 h-16 w-16 overflow-hidden rounded-xl border-2 transition-colors ${i === imgIdx ? "border-[var(--brand)]" : "border-border hover:border-muted-foreground"}`}>
                      {url
                        ? <img src={url} alt="" className="h-full w-full object-contain" />
                        : <div className="flex h-full w-full items-center justify-center text-xl">{img || "📦"}</div>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lightbox */}
          {lightbox && currentUrl && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
              onClick={() => setLightbox(false)}>
              <button onClick={() => setLightbox(false)}
                className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
                <XIcon className="h-5 w-5" />
              </button>
              {allImages.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); prevImg(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); nextImg(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
                    <ChevronRightIcon className="h-6 w-6" />
                  </button>
                </>
              )}
              <img src={currentUrl} alt={product.name}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl" />
              {allImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
                  {imgIdx + 1} / {allImages.length}
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="flex flex-col">
            <h1 className="text-xl font-bold md:text-3xl">{product.name}</h1>

            {/* Color swatches */}
            {(() => {
              type Color = { name: string; hex: string };
              let cols: Color[] = [];
              try { cols = JSON.parse(product.colors || "[]"); } catch {}
              if (cols.length === 0) return null;
              return <ColorSwatches colors={cols} selected={selectedColor} onSelect={setSelectedColor} />;
            })()}

            <div className="mt-2 flex items-center gap-2">
              <div className="flex text-amber-400">{[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current md:h-4 md:w-4" />)}</div>
              <span className="text-xs text-muted-foreground md:text-sm">5.0</span>
            </div>

            {(() => {
              const originalPrice = (() => {
                if (product.extra_price != null) return product.price;
                if (product.sale_price != null) return product.price;
                if (product.old_price && product.old_price > product.price) return product.old_price;
                if (product.discount > 0) return product.price;
                return null as number | null;
              })();
              const discountPct = originalPrice ? Math.round((1 - activePrice / originalPrice) * 100) : 0;
              const savingAmt = originalPrice ? (originalPrice - activePrice) : 0;
              const isFree = product.interest_free !== 0;
              const hasCredit = product.credit_months == null ? true : product.credit_months > 0;
              const commFreeMonths = product.commission_free_months ?? 0;
              return (
                <>
                  <div className="mt-3 flex items-baseline gap-2 flex-wrap md:mt-4 md:gap-3">
                    <span className="text-3xl font-black md:text-4xl">{activePrice} AZN</span>
                    {originalPrice && <span className="text-base text-muted-foreground line-through md:text-xl">{originalPrice} AZN</span>}
                    {discountPct > 0 && (
                      <span className="rounded-full bg-[var(--accent-orange)] px-2 py-0.5 text-xs font-bold text-white md:px-3 md:text-sm">−{discountPct}%</span>
                    )}
                  </div>
                  {savingAmt > 0 && (
                    <div className="mt-1 text-sm text-green-600 font-medium">
                      {savingAmt.toFixed(0)} AZN qənaət
                    </div>
                  )}
                  {commFreeMonths > 0 && (
                    <div className="mt-2 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border border-green-300 bg-white text-xs font-bold text-green-700">i</span>
                      <span className="text-sm font-semibold text-green-800">{commFreeMonths} aya komissiyasız</span>
                    </div>
                  )}
                  {hasCredit && creditCompanies.length > 0 && (() => {
                    const creditMonths = product.credit_months || 12;
                    const monthly = (Math.ceil(activePrice / creditMonths * 100) / 100).toFixed(2);
                    return (
                      <div className="mt-3 flex flex-col gap-2">
                        {creditCompanies.map(co => {
                          const logoUrl = getImageUrl(co.logo);
                          return (
                            <button key={co.id} onClick={() => setCreditModal(true)}
                              className="flex items-center gap-3 rounded-2xl border-2 border-[var(--accent-orange)] bg-card px-4 py-3 text-left hover:bg-secondary/30 transition-colors">
                              {logoUrl
                                ? <img src={logoUrl} alt={co.name} className="h-10 w-20 flex-shrink-0 object-contain" />
                                : <span className="w-20 flex-shrink-0 text-sm font-bold text-center">{co.name}</span>}
                              <div>
                                <div className="font-black text-base">{monthly} AZN × {creditMonths} ay</div>
                                <div className="text-xs text-muted-foreground">{co.name} ilə {creditMonths} aya faizsiz ödə!</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                  {hasCredit && <InlineCredit price={activePrice} isFree={isFree} onOpenCalc={() => setCreditModal(true)} />}
                </>
              );
            })()}


            {(() => {
              const comps = parsedComps;
              if (comps.length === 0) return null;
              return (
                <div className="mt-4 rounded-2xl border border-border bg-secondary/20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-secondary/40 flex items-center justify-between">
                    <p className="text-sm font-bold">Dəst tərkibi</p>
                    <span className="text-xs text-muted-foreground">İstədiyinizi seçin</span>
                  </div>
                  <div className="divide-y divide-border">
                    {comps.map((c, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/30 transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedComps.has(i)}
                          onChange={() => setSelectedComps(prev => {
                            const next = new Set(prev);
                            if (next.has(i)) next.delete(i); else next.add(i);
                            return next;
                          })}
                          className="h-4 w-4 rounded accent-[var(--brand)] cursor-pointer flex-shrink-0"
                        />
                        <span className="flex-1 text-sm">{c.name}</span>
                        <span className="text-sm font-semibold text-[var(--brand)] flex-shrink-0">{c.price} AZN</span>
                        <button
                          onClick={() => {
                            addItem({ id: product.id * 10000 + i + 1, name: `${c.name} (${product.name})`, price: c.price, image: product.image, qty: 1 });
                            toast.success(`${c.name} səbətə əlavə edildi`);
                          }}
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

            <div className="mt-3 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium md:text-sm ${(product.stock > 0 || product.in_stock === 1) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                {product.in_stock === 1 && product.stock === 0 ? "Stokda var" : product.stock > 0 ? `Stokda: ${product.stock} ədəd` : "Stokda yoxdur"}
              </span>
            </div>

            {/* Qty + Actions */}
            <div className="mt-4 flex items-center gap-2 md:mt-6 md:gap-3">
              <div className="flex items-center rounded-xl border border-border">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-3 text-lg hover:bg-secondary rounded-l-xl md:px-4">−</button>
                <span className="w-10 text-center font-semibold md:w-12">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="px-3 py-3 text-lg hover:bg-secondary rounded-r-xl md:px-4">+</button>
              </div>
              <button onClick={() => {
                  if (selectedComps.size > 0) {
                    parsedComps.forEach((comp, i) => {
                      if (selectedComps.has(i)) {
                        addItem({ id: product.id * 10000 + i + 1, name: `${comp.name} (${product.name})`, price: comp.price, image: product.image, qty });
                      }
                    });
                  } else {
                    // no component selected → add base product
                    const colorSuffix = selectedColor ? ` — ${selectedColor.name}` : "";
                    addItem({ id: product.id, name: product.name + colorSuffix, price: activePrice, image: product.image, qty, credit_months: product.credit_months || 12 });
                  }
                  toast.success("Səbətə əlavə edildi");
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] py-3 text-sm font-semibold text-[var(--brand-foreground)] hover:opacity-90 md:text-base">
                <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" /> Səbətə əlavə et
              </button>
            </div>

            <div className="mt-2 flex gap-2 md:mt-3">
              <button onClick={() => setOrderModal(true)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--accent-orange)] bg-[var(--accent-orange)]/5 py-2.5 text-xs font-semibold text-[var(--accent-orange)] hover:bg-[var(--accent-orange)]/10 md:py-3 md:text-sm md:gap-2">
                <MousePointerClick className="h-3.5 w-3.5 md:h-4 md:w-4" /> Bir kliklə al
              </button>
              {(product.credit_months == null || product.credit_months > 0) && (
                <button onClick={() => setCreditModal(true)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-xs font-medium hover:bg-secondary md:py-3 md:text-sm md:gap-2">
                  <CreditCard className="h-3.5 w-3.5 md:h-4 md:w-4" /> Kredit
                </button>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <button onClick={toggleWishlist}
                className={`flex flex-1 items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs font-medium md:px-4 md:py-2.5 md:text-sm md:gap-1.5 transition-colors ${inWishlist ? "border-red-300 bg-red-50 text-red-600" : "border-border hover:bg-secondary"}`}>
                <Heart className={`h-3.5 w-3.5 md:h-4 md:w-4 ${inWishlist ? "fill-red-500" : ""}`} /> Saxla
              </button>
              <button onClick={toggleCompare}
                className={`flex flex-1 items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs font-medium md:px-4 md:py-2.5 md:text-sm md:gap-1.5 transition-colors ${inCompare ? "border-[var(--brand)] bg-[var(--brand)]/5 text-[var(--brand)]" : "border-border hover:bg-secondary"}`}>
                <Scale className="h-3.5 w-3.5 md:h-4 md:w-4" /> Müqayisə
              </button>
              <button onClick={handleShare}
                className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-border px-2 py-2 text-xs font-medium hover:bg-secondary md:px-4 md:py-2.5 md:text-sm md:gap-1.5 transition-colors">
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Share2 className="h-3.5 w-3.5 md:h-4 md:w-4" />} {copied ? "Kopyalandı" : "Paylaş"}
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

        {/* Info Tabs */}
        <ProductTabs product={product} />

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-10 md:mt-16">
            <h2 className="mb-4 text-xl font-bold md:mb-5 md:text-2xl">Oxşar məhsullar</h2>
            <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
              {related.map((p) => (
                <Link key={p.id} to="/mehsul/$slug" params={{ slug: String(p.id) }}
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="aspect-square overflow-hidden bg-secondary/30">
                    {getImageUrl(p.image)
                      ? <img src={getImageUrl(p.image)!} alt={p.name} className="h-full w-full object-contain group-hover:scale-105 transition duration-500" loading="lazy" />
                      : <div className="flex h-full w-full items-center justify-center text-4xl">{p.image || "📦"}</div>}
                  </div>
                  <div className="p-3 md:p-4">
                    <div className="line-clamp-2 text-xs font-medium md:text-sm">{p.name}</div>
                    <div className="mt-1 font-black md:mt-2">{p.price} AZN</div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-[var(--brand)]"><Zap className="h-3 w-3" /> {Math.round(p.price / 12)} AZN/ay</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <SiteFooter />

      {/* Order Modal */}
      {orderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setOrderModal(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-lg font-bold">Bir kliklə sifariş</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{product.name}</p>
              </div>
              <button onClick={() => setOrderModal(false)} className="rounded-lg p-1.5 hover:bg-secondary"><XIcon className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Ad Soyad *</label>
                <input className={minp} value={orderForm.name} onChange={e => setOrderForm({...orderForm, name: e.target.value})} placeholder="Adınızı yazın" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Telefon *</label>
                <input className={minp} value={orderForm.phone} onChange={e => setOrderForm({...orderForm, phone: e.target.value})} placeholder="+994 XX XXX XX XX" type="tel" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Ünvan</label>
                <input className={minp} value={orderForm.address} onChange={e => setOrderForm({...orderForm, address: e.target.value})} placeholder="Çatdırılma ünvanı" />
              </div>

              {/* Ödəniş növü */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">Ödəniş növü</label>
                <div className="flex gap-2">
                  {[{ v: "cash", l: "💵 Nağd" }, { v: "credit", l: "💳 Kredit" }].map(o => (
                    <button key={o.v} onClick={() => setOrderForm({...orderForm, payment_type: o.v})}
                      className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition ${orderForm.payment_type === o.v ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]" : "border-border hover:bg-secondary"}`}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Promokod */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">Promokod</label>
                <div className="flex gap-2">
                  <input className={minp + " flex-1"} value={orderForm.promo}
                    onChange={e => { setOrderForm({...orderForm, promo: e.target.value}); setPromoResult(null); setPromoError(""); }}
                    placeholder="Promokodu daxil edin"
                    onKeyDown={e => e.key === "Enter" && applyPromo()} />
                  <button onClick={applyPromo} disabled={promoBusy || !orderForm.promo.trim()}
                    className="rounded-xl bg-[var(--brand)] px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 transition">
                    {promoBusy ? "..." : "Tətbiq et"}
                  </button>
                </div>
                {promoResult && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-green-700">
                    <Check className="h-3.5 w-3.5" /> {promoResult.code} — {promoResult.type === "percent" ? `${promoResult.value}%` : `${promoResult.value} AZN`} endirim tətbiq edildi
                  </div>
                )}
                {promoError && <p className="mt-1 text-xs text-red-600">{promoError}</p>}
              </div>

              {/* Xülasə */}
              {(() => {
                const price = calcActivePrice(product);
                const originalPrice = product.extra_price != null ? product.price : product.sale_price != null ? product.price : product.old_price && product.old_price > product.price ? product.old_price : null;
                const promoDiscount = promoResult?.discount ?? 0;
                const finalTotal = Math.max(0, price * qty - promoDiscount);
                return (
                  <div className="rounded-xl bg-secondary/50 p-3 text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">Məhsul:</span><span className="font-semibold line-clamp-1">{product.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Miqdar:</span><span className="font-semibold">{qty} ədəd</span></div>
                    {originalPrice && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Əvvəlki qiymət:</span><span className="line-through text-muted-foreground">{originalPrice * qty} AZN</span></div>
                    )}
                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-green-700"><span>Promokod endirimi:</span><span className="font-semibold">-{promoDiscount} AZN</span></div>
                    )}
                    <div className="flex justify-between border-t border-border pt-1 mt-1">
                      <span className="text-muted-foreground font-medium">Cəmi:</span>
                      <span className="font-black text-lg text-[var(--brand)]">{finalTotal} AZN</span>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="flex gap-3 border-t border-border px-6 py-4">
              <button onClick={() => setOrderModal(false)} className="flex-1 rounded-xl border border-border py-2.5 font-medium hover:bg-secondary">Ləğv et</button>
              <button onClick={submitOrder} disabled={orderBusy}
                className="flex-1 rounded-xl bg-[var(--accent-orange)] py-2.5 font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {orderBusy ? "..." : "Sifariş ver"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Modal */}
      {creditModal && (
        <CreditModal
          product={product}
          onClose={() => setCreditModal(false)}
          onOrder={() => { setCreditModal(false); setOrderModal(true); }}
        />
      )}

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

// Bank kredit şərtləri
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
          <div className="prose prose-sm max-w-none text-sm text-foreground leading-relaxed">
            {product.description
              ? <p>{product.description}</p>
              : <p className="text-muted-foreground">Məhsul haqqında məlumat əlavə edilməyib.</p>}
          </div>
        )}
        {tab === "specs" && (() => {
          type Spec = { group?: string; label: string; value: string };
          let specs: Spec[] = [];
          try { specs = JSON.parse(product.specifications || "[]"); } catch {}
          if (specs.length === 0) return <p className="text-sm text-muted-foreground">Texniki xüsusiyyətlər əlavə edilməyib.</p>;
          // group by group field
          const groups: Record<string, Spec[]> = {};
          for (const s of specs) {
            const g = s.group || "Ümumi";
            if (!groups[g]) groups[g] = [];
            groups[g].push(s);
          }
          return (
            <div className="space-y-6">
              {Object.entries(groups).map(([grp, items]) => (
                <div key={grp}>
                  <h3 className="mb-3 flex items-center gap-2 text-base font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)] inline-block" />{grp}
                  </h3>
                  <div className="rounded-xl border border-border overflow-hidden">
                    {items.map((s, i) => (
                      <div key={i} className={`flex items-center justify-between gap-4 px-4 py-3 text-sm border-b border-border last:border-0 ${i % 2 === 0 ? "bg-background" : "bg-secondary/20"}`}>
                        <span className="text-muted-foreground shrink-0">{s.label}</span>
                        <span className="font-medium text-right">{s.value}</span>
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

function InlineCredit({ price, isFree, onOpenCalc }: { price: number; isFree: boolean; onOpenCalc: () => void }) {
  const rows = [6, 12, 18];
  const [selected, setSelected] = useState(12);
  const monthly = (m: number) => (Math.ceil(price / m * 100) / 100).toFixed(2);

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-border shadow-sm">
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
  const [companies, setCompanies] = useState<import("@/lib/api").CreditCompany[]>([]);
  const [companyIdx, setCompanyIdx] = useState(0);
  const [months, setMonths] = useState(12);
  const [downPayment, setDownPayment] = useState("");
  const [useDiscounted, setUseDiscounted] = useState(true);

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
  const hasDiscount = activePrice < product.price;
  const fullPrice = product.price;
  const basePrice = hasDiscount ? (useDiscounted ? activePrice : fullPrice) : fullPrice;

  const currentCompany = companies[companyIdx];
  const currentPlans = currentCompany ? parsePlansLocal(currentCompany.plans) : [];
  const validPlan = currentPlans.find(p => p.months === months) ?? currentPlans[0];
  const validMonths = validPlan?.months ?? months;

  const down = Math.min(Math.max(parseFloat(downPayment) || 0, 0), basePrice - 1);
  const financed = basePrice - down;

  const rate = validPlan?.rate ?? 0;
  let monthly: number;
  let totalPaid: number;
  let overpay: number;

  if (rate > 0) {
    const total = Math.ceil(financed * (1 + rate / 100));
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

          {/* Endirimli / tam qiymət */}
          {hasDiscount && (
            <div className="flex rounded-xl border border-border overflow-hidden text-xs font-semibold">
              <button onClick={() => setUseDiscounted(true)}
                className={`flex-1 py-2 transition-colors ${useDiscounted ? "bg-[var(--brand)] text-[var(--brand-foreground)]" : "hover:bg-secondary/50"}`}>
                Endirimli · {activePrice} AZN
              </button>
              <button onClick={() => setUseDiscounted(false)}
                className={`flex-1 py-2 transition-colors ${!useDiscounted ? "bg-[var(--brand)] text-[var(--brand-foreground)]" : "hover:bg-secondary/50"}`}>
                Tam · {fullPrice} AZN
              </button>
            </div>
          )}

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
              {validPlan && validPlan.rate > 0 && (
                <div className="mt-1.5 text-xs text-orange-600 font-medium">+{validPlan.rate}% faiz tətbiq olunur</div>
              )}
            </div>
          )}

          {/* Müddət seçimi */}
          {currentPlans.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-semibold">Müddət</label>
              <div className="flex flex-wrap gap-2">
                {currentPlans.map(p => (
                  <button key={p.months} onClick={() => setMonths(p.months)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${validMonths === p.months ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)]" : "border-border hover:bg-secondary"}`}>
                    {p.months} ay{p.label ? ` · ${p.label}` : ""}
                  </button>
                ))}
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
