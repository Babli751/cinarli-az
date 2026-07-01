import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ChevronLeft, CreditCard, DoorOpen, Check, MapPin, Store as StoreIcon } from "lucide-react";
import { api, getImageUrl, type CreditCompany, type Store } from "@/lib/api";
import { SiteHeader } from "@/components/SiteLayout";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

export const Route = createFileRoute("/sifaris")({
  validateSearch: (s: Record<string, unknown>) => ({
    product_id: Number(s.product_id ?? 0),
    qty: Number(s.qty ?? 1),
    name: String(s.name ?? ""),
    phone: String(s.phone ?? ""),
    address: String(s.address ?? ""),
    promo: String(s.promo ?? ""),
    cart: Number(s.cart ?? 0),
  }),
  component: CheckoutPage,
});

const parsePlans = (raw: import("@/lib/api").CreditPlan[] | string): import("@/lib/api").CreditPlan[] => {
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw as string); } catch { return []; }
};

type DeliveryType = "address" | "store";

function CheckoutPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const isCartMode = search.cart === 1;
  const { items: cartItems, clearCart } = useCart();

  const [product, setProduct] = useState<import("@/lib/api").Product | null>(null);
  const [creditCompanies, setCreditCompanies] = useState<CreditCompany[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    name: search.name,
    phone: search.phone,
    address: search.address,
    promo: search.promo,
    payment_type: "cash" as string,
  });
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("address");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [creditSelectedMonths, setCreditSelectedMonths] = useState(12);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [promoResult, setPromoResult] = useState<{ discount: number; code: string } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);
  const [busy, setBusy] = useState(false);

  const qty = search.qty || 1;

  useEffect(() => {
    api.getStores().then(setStores).catch(() => {});
    api.getCreditCompanies().then(c => setCreditCompanies(c.filter(co => co.type !== "nisye"))).catch(() => {});
    if (isCartMode || !search.product_id) return;
    api.getProduct(search.product_id).then(setProduct).catch(() => {});
  }, [search.product_id, isCartMode]);

  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

  const activePrice = (() => {
    if (isCartMode) return cartTotal;
    if (!product) return 0;
    if (product.extra_price != null) return product.extra_price;
    if (product.sale_price != null) return product.sale_price;
    if (product.old_price && product.old_price > product.price) return product.price;
    if (product.discount > 0) return Math.round(product.price * (1 - product.discount / 100));
    return product.price;
  })();

  const applyPromo = async () => {
    if (!form.promo.trim()) return;
    setPromoError(""); setPromoResult(null); setPromoBusy(true);
    try {
      const res = await api.validatePromo(form.promo.trim(), activePrice * qty);
      setPromoResult(res);
      toast.success(`✓ −${res.discount} AZN endirim`);
    } catch (e: any) { setPromoError(e.message || "Promokod tapılmadı"); }
    finally { setPromoBusy(false); }
  };

  const submit = async () => {
    if (!product) return;
    if (!form.name.trim() || !form.phone.trim()) return toast.error("Ad və telefon mütləqdir");
    if (deliveryType === "address" && !form.address.trim()) return toast.error("Ünvan mütləqdir");
    if (deliveryType === "store" && !selectedStore) return toast.error("Mağaza seçin");
    setBusy(true);
    const promoDiscount = promoResult?.discount ?? 0;
    const base = Math.max(0, activePrice * qty - promoDiscount);
    const isCreditPay = form.payment_type.startsWith("cc_");
    const submitSelCo = creditCompanies.find(co => form.payment_type === `cc_${co.id}`);
    const submitPlan = submitSelCo ? parsePlans(submitSelCo.plans).find(p => p.months === creditSelectedMonths) : null;
    const submitFreeLimit = submitSelCo?.free_months != null ? submitSelCo.free_months : (product?.credit_months || 999);
    const submitRate = (isCreditPay && submitPlan && submitPlan.months > submitFreeLimit) ? (submitPlan.rate ?? 0) : 0;
    const finalTotal = isCreditPay ? Math.ceil(base * (1 + submitRate / 100) * 100) / 100 : base;
    const payLabel = isCreditPay
      ? ` | Kredit (${creditSelectedMonths} ay)`
      : form.payment_type === "card" ? " | Kartla" : " | Qapıda";
    const deliveryLabel = deliveryType === "store"
      ? `Mağazadan götürəcəm: ${selectedStore?.name}, ${selectedStore?.address}`
      : form.address;
    try {
      await api.createOrder({
        customer_name: form.name,
        phone: form.phone,
        address: deliveryLabel,
        total: finalTotal,
        items: isCartMode
          ? JSON.stringify(cartItems.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })))
          : JSON.stringify([{ id: product!.id, name: product!.name, qty, price: activePrice }]),
        notes: isCartMode
          ? `Səbət sifarişi${payLabel}${promoResult ? ` | Promo: ${promoResult.code} (-${promoDiscount} AZN)` : ""}`
          : `Sifariş: ${product!.name} x${qty}${payLabel}${promoResult ? ` | Promo: ${promoResult.code} (-${promoDiscount} AZN)` : ""}`,
        status: "pending",
        payment_type: form.payment_type,
        credit_months: isCreditPay ? creditSelectedMonths : 0,
        promo_code: promoResult?.code || "",
        promo_discount: promoDiscount,
      });
      if (isCartMode) clearCart();
      setDone(true);
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const inp = "w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm outline-none focus:border-[var(--brand)] transition placeholder:text-muted-foreground";

  // ── Success screen ──
  if (done) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
        <Check className="h-12 w-12 text-green-600" strokeWidth={2.5} />
      </div>
      <h1 className="text-2xl font-bold">Sifarişiniz qəbul edildi!</h1>
      <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
        Tezliklə satış təmsilçimiz sizinlə əlaqə saxlayacaqdır.
      </p>
      <button onClick={() => navigate({ to: "/" })}
        className="rounded-xl bg-[var(--brand)] px-8 py-3.5 font-semibold text-white">
        Ana səhifəyə qayıt
      </button>
    </div>
  );

  if (!isCartMode && !product) return (
    <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Yüklənir...</div>
  );

  const imgUrl = product ? getImageUrl(product.image) : "";
  const isCreditMode = form.payment_type.startsWith("cc_");
  const selCo = creditCompanies.find(co => form.payment_type === `cc_${co.id}`);
  const selPlans = selCo ? parsePlans(selCo.plans) : [];
  const promoDiscount = promoResult?.discount ?? 0;
  const baseTotal = Math.max(0, activePrice * qty - promoDiscount);
  const selectedPlan = selPlans.find(p => p.months === creditSelectedMonths);
  const freeLimit = selCo?.free_months != null ? selCo.free_months : (product?.credit_months || 999);
  const creditRate = (isCreditMode && selectedPlan && selectedPlan.months > freeLimit) ? (selectedPlan.rate ?? 0) : 0;
  const finalTotal = isCreditMode ? Math.ceil(baseTotal * (1 + creditRate / 100) * 100) / 100 : baseTotal;

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-lg px-4 py-5 pb-28">
        {/* Back */}
        <button onClick={() => isCartMode ? navigate({ to: "/sebet" }) : navigate({ to: "/mehsul/$slug", params: { slug: String(product?.id) } })}
          className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
          <ChevronLeft className="h-4 w-4" /> Geri qayıt
        </button>

        <h1 className="text-xl font-black mb-5">Sifarişi rəsmiləşdir</h1>

        {/* Product card / Cart items */}
        {isCartMode ? (
          <div className="rounded-2xl bg-white border border-border/50 p-3 mb-4 shadow-sm space-y-2">
            {cartItems.map(i => (
              <div key={i.id} className="flex items-center gap-3">
                {i.image && <img src={getImageUrl(i.image) ?? ""} alt="" className="h-12 w-12 rounded-xl object-contain bg-secondary/40 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm line-clamp-1">{i.name}</p>
                  <p className="text-[var(--brand)] font-black text-sm">{i.price} AZN × {i.qty}</p>
                </div>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between font-black text-base">
              <span>Cəmi</span>
              <span className="text-[var(--brand)]">{cartTotal.toFixed(2)} AZN</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl bg-white border border-border/50 p-3 mb-4 shadow-sm">
            {imgUrl && <img src={imgUrl} alt="" className="h-16 w-16 rounded-xl object-contain bg-secondary/40 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm line-clamp-2 leading-snug">{product?.name}</p>
              <p className="text-[var(--brand)] font-black text-xl mt-1">{activePrice} AZN</p>
            </div>
          </div>
        )}

        {/* Şəxsi məlumatlar */}
        <div className="rounded-2xl bg-white border border-border/50 shadow-sm mb-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 bg-secondary/20">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Şəxsi məlumatlar</h2>
          </div>
          <div className="p-4 space-y-3">
            <input className={inp} placeholder="Ad Soyad *" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} />
            <input className={inp} placeholder="Telefon *" type="tel" value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
        </div>

        {/* Çatdırılma */}
        <div className="rounded-2xl bg-white border border-border/50 shadow-sm mb-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 bg-secondary/20">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Çatdırılma məlumatları</h2>
          </div>
          <div className="p-4 space-y-3">
            {/* Növ seçimi */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setDeliveryType("address")}
                className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition ${deliveryType === "address" ? "border-[var(--brand)] bg-[var(--brand)]/8 text-[var(--brand)]" : "border-border hover:bg-secondary"}`}>
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>Ünvana çatdırılma</span>
              </button>
              <button onClick={() => setDeliveryType("store")}
                className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition ${deliveryType === "store" ? "border-[var(--brand)] bg-[var(--brand)]/8 text-[var(--brand)]" : "border-border hover:bg-secondary"}`}>
                <StoreIcon className="h-4 w-4 flex-shrink-0" />
                <span>Mağazadan götürəcəm</span>
              </button>
            </div>

            {/* Ünvan inputu */}
            {deliveryType === "address" && (
              <input className={inp} placeholder="Çatdırılma ünvanı *" value={form.address}
                onChange={e => setForm({...form, address: e.target.value})} />
            )}

            {/* Mağaza seçimi */}
            {deliveryType === "store" && (
              <div className="space-y-2">
                {stores.length === 0
                  ? <p className="text-sm text-muted-foreground px-1">Yüklənir...</p>
                  : stores.map(s => (
                    <button key={s.id} onClick={() => setSelectedStore(s)}
                      className={`w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${selectedStore?.id === s.id ? "border-[var(--brand)] bg-[var(--brand)]/8" : "border-border hover:bg-secondary"}`}>
                      <div className="flex-shrink-0 mt-0.5">
                        {selectedStore?.id === s.id
                          ? <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand)]"><Check className="h-2.5 w-2.5 text-white" strokeWidth={3} /></span>
                          : <span className="flex h-4 w-4 rounded-full border-2 border-border" />}
                      </div>
                      <div className="min-w-0">
                        <div className={`font-semibold text-sm ${selectedStore?.id === s.id ? "text-[var(--brand)]" : ""}`}>{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.city}{s.address ? ` — ${s.address}` : ""}</div>
                        {s.hours && <div className="text-xs text-muted-foreground/60">{s.hours}</div>}
                      </div>
                    </button>
                  ))
                }
              </div>
            )}
          </div>
        </div>

        {/* Ödəniş üsulu */}
        <div className="rounded-2xl bg-white border border-border/50 shadow-sm mb-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 bg-secondary/20">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ödəniş üsulu</h2>
          </div>
          <div className="p-4 space-y-3">
            {/* 3 əsas seçim */}
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: "card",   Icon: CreditCard,  label: "Kartla ödə",     sub: "Online" },
                { key: "cash",   Icon: DoorOpen,    label: "Qapıda ödə",     sub: "Nağd/kart" },
                { key: "credit", Icon: StoreIcon,   label: "Taksitlə alıram", sub: "Kredit" },
              ] as const).map(({ key, Icon, label, sub }) => {
                const active = key === "credit" ? isCreditMode : form.payment_type === key;
                return (
                  <button key={key} onClick={() => {
                    if (key === "credit") {
                      if (creditCompanies.length > 0) {
                        const co = creditCompanies[0];
                        setForm({...form, payment_type: `cc_${co.id}`});
                        const plans = parsePlans(co.plans);
                        setCreditSelectedMonths(plans[0]?.months ?? 12);
                      }
                    } else {
                      setForm({...form, payment_type: key});
                    }
                  }}
                    className={`relative flex flex-col items-center gap-1 rounded-xl border px-2 py-3.5 text-center transition ${active ? "border-[var(--brand)] bg-[var(--brand)]/8" : "border-border hover:bg-secondary"}`}>
                    {active && (
                      <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand)]">
                        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                      </span>
                    )}
                    <Icon className={`h-5 w-5 ${active ? "text-[var(--brand)]" : "text-muted-foreground"}`} />
                    <span className={`text-[10px] font-bold leading-tight ${active ? "text-[var(--brand)]" : ""}`}>{label}</span>
                    <span className="text-[9px] text-muted-foreground">{sub}</span>
                  </button>
                );
              })}
            </div>

            {/* Kart məlumatları — yalnız "Kartla ödə" seçiləndə */}
            {form.payment_type === "card" && (
              <div className="rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/4 p-3 space-y-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-[var(--brand)]" />
                  <span className="text-xs font-bold text-[var(--brand)]">Kart məlumatları</span>
                </div>
                <input
                  className={inp}
                  placeholder="Kart nömrəsi (1234 5678 9012 3456)"
                  maxLength={19}
                  value={cardNumber}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                    setCardNumber(v.replace(/(.{4})/g, "$1 ").trim());
                  }}
                  inputMode="numeric"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className={inp}
                    placeholder="MM/YY"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setCardExpiry(v.length > 2 ? `${v.slice(0,2)}/${v.slice(2)}` : v);
                    }}
                    inputMode="numeric"
                  />
                  <input
                    className={inp}
                    placeholder="CVV"
                    maxLength={3}
                    value={cardCvv}
                    onChange={e => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    inputMode="numeric"
                    type="password"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">🔒 Məlumatlarınız şifrələnmiş şəkildə ötürülür</p>
              </div>
            )}

            {/* Kredit şirkətləri — yalnız taksit seçiləndə */}
            {isCreditMode && creditCompanies.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Kredit şirkəti seçin:</p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {creditCompanies.map(co => {
                    const logoUrl = getImageUrl(co.logo);
                    const active = form.payment_type === `cc_${co.id}`;
                    return (
                      <button key={co.id} onClick={() => {
                        setForm({...form, payment_type: `cc_${co.id}`});
                        const plans = parsePlans(co.plans);
                        setCreditSelectedMonths(plans[0]?.months ?? 12);
                      }}
                        className={`relative flex-shrink-0 rounded-xl border-2 overflow-hidden transition ${active ? "border-[var(--brand)]" : "border-border hover:border-[var(--brand)]/40"}`}
                        style={{ height: 48, width: 100, padding: 0 }}>
                        {active && (
                          <span className="absolute top-1 right-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand)]">
                            <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                          </span>
                        )}
                        {logoUrl
                          ? <img src={logoUrl} alt={co.name} className="h-full w-full object-cover" />
                          : <span className="flex h-full w-full items-center justify-center text-xs font-bold px-2 text-center">{co.name}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ay seçimi */}
            {isCreditMode && selPlans.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Taksit müddəti:</p>
                <div className="grid grid-cols-2 gap-2">
                  {selPlans.map(p => {
                    const freeLimit = selCo?.free_months != null ? selCo.free_months : (product?.credit_months ?? 999);
                    const isFree = p.months <= freeLimit;
                    const rate = isFree ? 0 : (p.rate ?? 0);
                    const total = activePrice * qty * (1 + rate / 100);
                    const monthly = (Math.ceil(total / p.months * 100) / 100).toFixed(2);
                    const active = creditSelectedMonths === p.months;
                    return (
                      <button key={p.months} onClick={() => setCreditSelectedMonths(p.months)}
                        className={`relative rounded-xl border px-3 py-2.5 text-left transition ${active ? "border-[var(--brand)] bg-[var(--brand)]/8" : "border-border hover:bg-secondary"}`}>
                        {active && (
                          <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand)]">
                            <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                          </span>
                        )}
                        <div className={`font-bold text-sm ${active ? "text-[var(--brand)]" : ""}`}>{p.months} ay</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{monthly} AZN / ay</div>
                        <div className={`text-[10px] mt-0.5 font-medium ${isFree ? "text-green-600" : "text-amber-600"}`}>
                          {isFree ? "faizsiz" : `+${rate}% faiz`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Promokod */}
        <div className="rounded-2xl bg-white border border-border/50 shadow-sm mb-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 bg-secondary/20">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Promokod</h2>
          </div>
          <div className="p-4">
            <div className="flex gap-2">
              <input className={`${inp} flex-1`} placeholder="Promokodu daxil edin" value={form.promo}
                onChange={e => { setForm({...form, promo: e.target.value}); setPromoResult(null); setPromoError(""); }}
                onKeyDown={e => e.key === "Enter" && applyPromo()} />
              <button onClick={applyPromo} disabled={promoBusy || !form.promo.trim()}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-40 transition whitespace-nowrap">
                {promoBusy ? "..." : "Tətbiq et"}
              </button>
            </div>
            {promoResult && <p className="mt-2 text-xs text-green-600 font-semibold">✓ −{promoResult.discount} AZN endirim tətbiq edildi</p>}
            {promoError && <p className="mt-2 text-xs text-red-500">{promoError}</p>}
          </div>
        </div>

        {/* Cəmi */}
        <div className="rounded-2xl bg-white border border-border/50 shadow-sm mb-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 bg-secondary/20">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sifariş xülasəsi</h2>
          </div>
          <div className="p-4 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Məhsul ({qty} ədəd)</span>
              <span className="font-semibold">{(activePrice * qty).toFixed(2)} AZN</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Çatdırılma</span>
              <span className="text-green-600 font-semibold">Pulsuz</span>
            </div>
            {promoResult && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Promokod</span>
                <span className="font-semibold">−{promoResult.discount} AZN</span>
              </div>
            )}
            {isCreditMode && creditRate > 0 && (
              <div className="flex justify-between text-sm text-amber-600">
                <span>Kredit faizi (+{creditRate}%)</span>
                <span className="font-semibold">+{(finalTotal - baseTotal).toFixed(2)} AZN</span>
              </div>
            )}
            <div className="flex justify-between font-black text-base border-t border-border pt-2.5 mt-1">
              <span>Cəmi</span>
              <span className="text-[var(--brand)] text-xl">{finalTotal.toFixed(2)} AZN</span>
            </div>
            {isCreditMode && (
              <div className="rounded-xl bg-[var(--brand)]/5 border border-[var(--brand)]/20 px-3 py-2 text-xs text-[var(--brand)] font-semibold text-center">
                ≈ {(Math.ceil(finalTotal / creditSelectedMonths * 100) / 100).toFixed(2)} AZN × {creditSelectedMonths} ay
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-5 text-center leading-relaxed">
          Hörmətli müştəri, sifarişinizi aldıqdan sonra satış təmsilçimiz sizinlə əlaqə saxlayacaqdır.
        </p>

        <button onClick={submit} disabled={busy}
          className="w-full rounded-2xl bg-[var(--brand)] py-4 text-base font-black text-white hover:opacity-90 disabled:opacity-50 transition shadow-lg">
          {busy ? "Göndərilir..." : "Sifarişi təsdiqlə"}
        </button>
      </div>
    </div>
  );
}
