import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2, Plus, Minus, ShoppingCart, X } from "lucide-react";
import { PageShell } from "@/components/SiteLayout";
import { useCart } from "@/hooks/useCart";
import { getImageUrl, api } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/sebet")({
  component: CartPage,
});

const COUPON_KEY = "spin_coupon";

function parseCoupon(code: string | null): { type: string; label: string; discountPct: number; freeDelivery: boolean } | null {
  if (!code) return null;
  if (code.startsWith("DISCOUNT_10")) return { type: "DISCOUNT_10", label: "10% Endirim", discountPct: 10, freeDelivery: false };
  if (code.startsWith("DISCOUNT_20")) return { type: "DISCOUNT_20", label: "20% Endirim", discountPct: 20, freeDelivery: false };
  if (code.startsWith("DISCOUNT_30")) return { type: "DISCOUNT_30", label: "30% Endirim", discountPct: 30, freeDelivery: false };
  if (code.startsWith("FREE_DELIVERY")) return { type: "FREE_DELIVERY", label: "Pulsuz Çatdırılma", discountPct: 0, freeDelivery: true };
  return null;
}

function CartPage() {
  const { items, removeItem, updateQty, clearCart, total } = useCart();
  const [orderModal, setOrderModal] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [couponCode] = useState(() => localStorage.getItem(COUPON_KEY) ?? "");
  const [couponInput, setCouponInput] = useState("");
  const [couponApplied, setCouponApplied] = useState<ReturnType<typeof parseCoupon>>(null);
  const [couponError, setCouponError] = useState("");

  const applyCoupon = () => {
    const parsed = parseCoupon(couponInput.trim().toUpperCase());
    if (!parsed) { setCouponError("Kupon tapılmadı"); return; }
    setCouponApplied(parsed);
    setCouponError("");
  };

  const discountAmount = couponApplied ? Math.round(total * couponApplied.discountPct / 100) : 0;
  const finalTotal = total - discountAmount;

  const submitOrder = async () => {
    if (!form.name.trim()) return toast.error("Ad mütləqdir");
    if (!form.phone.trim()) return toast.error("Telefon mütləqdir");
    setBusy(true);
    try {
      await api.createOrder({
        customer_name: form.name,
        phone: form.phone,
        address: form.address,
        notes: couponApplied ? `${form.notes ? form.notes + " | " : ""}Kupon: ${couponApplied.label}` : form.notes,
        total: finalTotal,
        items: JSON.stringify(items.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price }))),
        status: "pending",
      });
      toast.success("Sifarişiniz qəbul edildi! Tezliklə əlaqə saxlayacağıq.");
      clearCart();
      setOrderModal(false);
      setForm({ name: "", phone: "", address: "", notes: "" });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (items.length === 0) {
    return (
      <PageShell title="Səbət">
        <div className="rounded-2xl border border-dashed border-border p-16 text-center">
          <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">Səbətiniz boşdur.</p>
          <Link to="/" className="mt-6 inline-block rounded-lg bg-[var(--brand)] px-6 py-3 font-semibold text-[var(--brand-foreground)]">Alış-verişə davam et</Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Səbət">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => {
            const url = getImageUrl(item.image);
            return (
              <div key={item.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-secondary/30">
                  {url
                    ? <img src={url} alt={item.name} className="h-full w-full object-contain" />
                    : <div className="flex h-full w-full items-center justify-center text-3xl">{item.image || "📦"}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold line-clamp-2 text-sm">{item.name}</p>
                  <div className="mt-1 font-black text-[var(--brand)]">{item.price} ₼</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => updateQty(item.id, item.qty - 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-secondary">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center font-semibold">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, item.qty + 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-secondary">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="font-black">{item.price * item.qty} ₼</div>
                  <button onClick={() => removeItem(item.id)} className="mt-1 text-destructive hover:opacity-70">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
          <button onClick={clearCart} className="text-sm text-muted-foreground hover:text-destructive transition-colors">Səbəti təmizlə</button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 h-fit space-y-4">
          <h2 className="text-lg font-bold">Sifariş xülasəsi</h2>
          <div className="space-y-2 text-sm">
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-muted-foreground">
                <span className="line-clamp-1 flex-1 mr-2">{item.name} ×{item.qty}</span>
                <span className="flex-shrink-0 font-medium">{item.price * item.qty} ₼</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 flex justify-between font-black text-lg">
            <span>Cəmi</span>
            <span className="text-[var(--brand)]">{total} ₼</span>
          </div>

          {/* Coupon */}
          {!couponApplied ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--brand)] transition-colors"
                  placeholder="Kupon kodu..."
                  value={couponInput}
                  onChange={e => { setCouponInput(e.target.value); setCouponError(""); }}
                  onKeyDown={e => e.key === "Enter" && applyCoupon()}
                />
                <button onClick={applyCoupon} className="rounded-xl bg-secondary px-3 py-2 text-sm font-semibold hover:bg-secondary/80">
                  Tətbiq et
                </button>
              </div>
              {couponCode && (
                <button onClick={() => { setCouponInput(couponCode); }} className="text-xs text-[var(--brand)] hover:underline">
                  Çarx kuponu: {couponCode}
                </button>
              )}
              {couponError && <p className="text-xs text-destructive">{couponError}</p>}
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl bg-green-50 border border-green-200 px-3 py-2">
              <div>
                <span className="text-xs font-semibold text-green-700">{couponApplied.label} tətbiq edildi</span>
                {discountAmount > 0 && <div className="text-xs text-green-600">−{discountAmount} ₼ endirim</div>}
                {couponApplied.freeDelivery && <div className="text-xs text-green-600">Pulsuz çatdırılma</div>}
              </div>
              <button onClick={() => setCouponApplied(null)} className="text-xs text-muted-foreground hover:text-destructive">✕</button>
            </div>
          )}

          {discountAmount > 0 && (
            <div className="flex justify-between font-black text-lg text-green-600">
              <span>Endirimlə</span>
              <span>{finalTotal} ₼</span>
            </div>
          )}

          {(() => {
            const avgMonths = Math.round(items.reduce((s, i) => s + (i.credit_months || 24) * i.qty, 0) / Math.max(items.reduce((s, i) => s + i.qty, 0), 1));
            return (
              <div className="rounded-xl bg-[var(--brand)]/5 p-3 text-xs text-center text-[var(--brand)] font-medium">
                Faizsiz kredit: {(Math.ceil(finalTotal / avgMonths * 100) / 100).toFixed(2)} ₼/ay × {avgMonths} ay
              </div>
            );
          })()}
          <button onClick={() => setOrderModal(true)}
            className="block w-full rounded-xl bg-[var(--brand)] py-3 text-center font-semibold text-[var(--brand-foreground)] hover:opacity-90 transition-opacity">
            Sifarişi təsdiqlə
          </button>
        </div>
      </div>

      {/* Order modal */}
      {orderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setOrderModal(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-bold">Sifariş məlumatları</h2>
              <button onClick={() => setOrderModal(false)} className="rounded-lg p-1.5 hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Ad Soyad *</label>
                <input className={inp} placeholder="Məs: Əli Əliyev" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Telefon *</label>
                <input className={inp} placeholder="+994 50 000 00 00" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Çatdırılma ünvanı</label>
                <input className={inp} placeholder="Şəhər, küçə, ev nömrəsi" value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Qeyd (opsional)</label>
                <textarea className={inp} rows={2} placeholder="Əlavə məlumat..." value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="rounded-xl bg-secondary/40 px-4 py-3 space-y-1">
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Məbləğ</span><span>{total} ₼</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-semibold">
                    <span>{couponApplied?.label}</span><span>−{discountAmount} ₼</span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>Cəmi məbləğ</span>
                  <span className="text-[var(--brand)]">{finalTotal} ₼</span>
                </div>
              </div>
              <button onClick={submitOrder} disabled={busy}
                className="w-full rounded-xl bg-[var(--brand)] py-3 font-semibold text-[var(--brand-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity">
                {busy ? "Göndərilir..." : "Sifarişi göndər"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

const inp = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)] transition-colors";
