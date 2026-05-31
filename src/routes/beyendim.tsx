import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import { PageShell } from "@/components/SiteLayout";
import { api, getImageUrl, type Product } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/beyendim")({
  component: WishlistPage,
});

function WishlistPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    try { setItems(await api.getWishlist()); }
    catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user]);

  const remove = async (id: number) => {
    try {
      await api.removeFromWishlist(id);
      setItems(prev => prev.filter(x => x.id !== id));
      toast.success("Bəyəndiklərimdən çıxarıldı");
    } catch (e: any) { toast.error(e.message); }
  };

  if (!user) {
    return (
      <PageShell title="Bəyəndiklərim">
        <div className="rounded-2xl border border-dashed border-border p-16 text-center">
          <Heart className="mx-auto h-16 w-16 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">Bəyəndikləri görmək üçün daxil olun.</p>
          <Link to="/kabinet" className="mt-6 inline-block rounded-lg bg-[var(--brand)] px-6 py-3 font-semibold text-[var(--brand-foreground)]">Daxil ol</Link>
        </div>
      </PageShell>
    );
  }

  if (loading) return <PageShell title="Bəyəndiklərim"><div className="py-16 text-center text-muted-foreground">Yüklənir...</div></PageShell>;

  if (items.length === 0) {
    return (
      <PageShell title="Bəyəndiklərim">
        <div className="rounded-2xl border border-dashed border-border p-16 text-center">
          <Heart className="mx-auto h-16 w-16 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">Hələ bəyəndiyiniz məhsul yoxdur.</p>
          <Link to="/" className="mt-6 inline-block rounded-lg bg-[var(--brand)] px-6 py-3 font-semibold text-[var(--brand-foreground)]">Məhsullara bax</Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Bəyəndiklərim">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {items.map(item => {
          const url = getImageUrl(item.image);
          return (
            <div key={item.id} className="group relative overflow-hidden rounded-2xl border border-border bg-card">
              <button
                onClick={() => remove(item.id)}
                className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-destructive shadow hover:bg-white transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <Link to="/mehsul/$slug" params={{ slug: String(item.id) }}>
                <div className="aspect-[4/3] overflow-hidden bg-white">
                  {url
                    ? <img src={url} alt={item.name} className="h-full w-full object-contain group-hover:scale-105 transition duration-300" />
                    : <div className="flex h-full w-full items-center justify-center text-4xl">{item.image || "📦"}</div>}
                </div>
                <div className="p-3">
                  <div className="line-clamp-2 text-sm font-medium">{item.name}</div>
                  <div className="mt-1 font-black text-[var(--brand)]">{item.price} AZN</div>
                  {item.old_price && <div className="text-xs text-muted-foreground line-through">{item.old_price} AZN</div>}
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
