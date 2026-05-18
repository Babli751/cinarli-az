import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, Plus, Minus, ShoppingCart } from "lucide-react";
import { PageShell } from "@/components/SiteLayout";
import { useCart } from "@/hooks/useCart";
import { getImageUrl } from "@/lib/api";

export const Route = createFileRoute("/sebet")({
  component: CartPage,
});

function CartPage() {
  const { items, removeItem, updateQty, clearCart, total } = useCart();

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
                    ? <img src={url} alt={item.name} className="h-full w-full object-cover" />
                    : <div className="flex h-full w-full items-center justify-center text-3xl">{item.image || "📦"}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to="/mehsul/$slug" params={{ slug: String(item.id) }} className="font-semibold hover:text-[var(--brand)] line-clamp-2 text-sm">{item.name}</Link>
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
          <div className="rounded-xl bg-[var(--brand)]/5 p-3 text-xs text-center text-[var(--brand)] font-medium">
            Faizsiz kredit: {Math.round(total / 24)} ₼/ay × 24 ay
          </div>
          <Link to="/" className="block w-full rounded-xl bg-[var(--brand)] py-3 text-center font-semibold text-[var(--brand-foreground)] hover:opacity-90">
            Sifarişi təsdiqlə
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
