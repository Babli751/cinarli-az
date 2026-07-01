import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2, Plus, Minus, ShoppingCart } from "lucide-react";
import { PageShell } from "@/components/SiteLayout";
import { useCart } from "@/hooks/useCart";
import { getImageUrl } from "@/lib/api";

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
  const navigate = useNavigate();
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
              <div key={item.id} className="rounded-2xl border border-border bg-card p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 overflow-hidden rounded-xl bg-secondary/30" style={{width:72,height:72}}>
                    {url
                      ? <img src={url} alt={item.name} className="h-full w-full object-contain" />
                      : <div className="flex h-full w-full items-center justify-center text-3xl">{item.image || "📦"}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold line-clamp-2 text-sm leading-snug">{item.name}</p>
                    <div className="mt-1 font-black text-[var(--brand)] text-base">{item.price} AZN</div>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, item.qty - 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-secondary">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center font-semibold">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-secondary">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="font-black text-base">{item.price * item.qty} AZN</div>
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
                <span className="flex-shrink-0 font-medium">{item.price * item.qty} AZN</span>
              </div>
            ))}
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Kupon endirimi ({couponApplied?.label})</span>
              <span>−{discountAmount} AZN</span>
            </div>
          )}

          <div className="border-t border-border pt-3 flex justify-between font-black text-lg">
            <span>Cəmi</span>
            <span className="text-[var(--brand)]">{total - discountAmount} AZN</span>
          </div>

          {/* Coupon */}
          {!couponApplied ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--brand)] transition-colors"
                  placeholder="Çarx kuponu..."
                  value={couponInput}
                  onChange={e => { setCouponInput(e.target.value); setCouponError(""); }}
                  onKeyDown={e => e.key === "Enter" && applyCoupon()}
                />
                <button onClick={applyCoupon} className="rounded-xl bg-secondary px-3 py-2 text-sm font-semibold hover:bg-secondary/80">
                  Tətbiq et
                </button>
              </div>
              {couponCode && (
                <button onClick={() => setCouponInput(couponCode)} className="text-xs text-[var(--brand)] hover:underline">
                  Çarx kuponu: {couponCode}
                </button>
              )}
              {couponError && <p className="text-xs text-destructive">{couponError}</p>}
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl bg-green-50 border border-green-200 px-3 py-2">
              <div>
                <span className="text-xs font-semibold text-green-700">{couponApplied.label} tətbiq edildi</span>
                {discountAmount > 0 && <div className="text-xs text-green-600">−{discountAmount} AZN endirim</div>}
                {couponApplied.freeDelivery && <div className="text-xs text-green-600">Pulsuz çatdırılma</div>}
              </div>
              <button onClick={() => setCouponApplied(null)} className="text-xs text-muted-foreground hover:text-destructive">✕</button>
            </div>
          )}

          <button
            onClick={() => navigate({ to: "/sifaris", search: { cart: 1, product_id: 0, qty: 1, name: "", phone: "", address: "", promo: "" } })}
            className="block w-full rounded-xl bg-[var(--brand)] py-3 text-center font-semibold text-[var(--brand-foreground)] hover:opacity-90 transition-opacity">
            Sifarişi təsdiqlə
          </button>
        </div>
      </div>
    </PageShell>
  );
}
