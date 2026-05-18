import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2, Scale } from "lucide-react";
import { PageShell } from "@/components/SiteLayout";
import { api, getImageUrl, type Product } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/muqayise")({
  component: ComparePage,
});

function ComparePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const data = await api.getCompare();
      setItems(data);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user]);

  const remove = async (id: number) => {
    try {
      await api.removeFromCompare(id);
      setItems(prev => prev.filter(x => x.id !== id));
      toast.success("Müqayisədən çıxarıldı");
    } catch (e: any) { toast.error(e.message); }
  };

  if (!user) {
    return (
      <PageShell title="Müqayisə">
        <div className="rounded-2xl border border-dashed border-border p-16 text-center">
          <Scale className="mx-auto h-16 w-16 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">Müqayisə siyahısını görmək üçün daxil olun.</p>
          <Link to="/kabinet" className="mt-6 inline-block rounded-lg bg-[var(--brand)] px-6 py-3 font-semibold text-[var(--brand-foreground)]">Daxil ol</Link>
        </div>
      </PageShell>
    );
  }

  if (loading) return <PageShell title="Müqayisə"><div className="py-16 text-center text-muted-foreground">Yüklənir...</div></PageShell>;

  if (items.length === 0) {
    return (
      <PageShell title="Müqayisə">
        <div className="rounded-2xl border border-dashed border-border p-16 text-center">
          <Scale className="mx-auto h-16 w-16 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">Müqayisə siyahısı boşdur.</p>
          <Link to="/" className="mt-6 inline-block rounded-lg bg-[var(--brand)] px-6 py-3 font-semibold text-[var(--brand-foreground)]">Məhsul seç</Link>
        </div>
      </PageShell>
    );
  }

  const fields: { label: string; key: keyof Product }[] = [
    { label: "Qiymət", key: "price" },
    { label: "Köhnə qiymət", key: "old_price" },
    { label: "Endirim", key: "discount" },
    { label: "Stok", key: "stock" },
    { label: "Kateqoriya", key: "category_slug" },
  ];

  return (
    <PageShell title="Müqayisə">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr>
              <td className="w-32 border border-border p-3 bg-secondary/30 text-sm font-bold text-muted-foreground">Xüsusiyyət</td>
              {items.map(item => {
                const url = getImageUrl(item.image);
                return (
                  <td key={item.id} className="border border-border p-3 text-center align-top">
                    <div className="relative">
                      <button onClick={() => remove(item.id)} className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20">
                        <Trash2 className="h-3 w-3" />
                      </button>
                      <Link to="/mehsul/$slug" params={{ slug: String(item.id) }}>
                        <div className="mx-auto mb-2 h-24 w-24 overflow-hidden rounded-xl bg-secondary/30">
                          {url
                            ? <img src={url} alt={item.name} className="h-full w-full object-cover" />
                            : <div className="flex h-full w-full items-center justify-center text-3xl">{item.image || "📦"}</div>}
                        </div>
                        <div className="text-sm font-semibold hover:text-[var(--brand)] line-clamp-2">{item.name}</div>
                      </Link>
                    </div>
                  </td>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {fields.map(f => (
              <tr key={f.key} className="hover:bg-secondary/20">
                <td className="border border-border p-3 text-sm font-medium text-muted-foreground bg-secondary/10">{f.label}</td>
                {items.map(item => (
                  <td key={item.id} className="border border-border p-3 text-center text-sm font-semibold">
                    {f.key === "price" ? `${item.price} ₼`
                      : f.key === "old_price" ? (item.old_price ? `${item.old_price} ₼` : "—")
                      : f.key === "discount" ? (item.discount > 0 ? `−${item.discount}%` : "—")
                      : f.key === "stock" ? (item.stock > 0 ? `${item.stock} ədəd` : "Yoxdur")
                      : (item[f.key] as string) || "—"}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="border border-border p-3 bg-secondary/10"></td>
              {items.map(item => (
                <td key={item.id} className="border border-border p-3 text-center">
                  <Link to="/mehsul/$slug" params={{ slug: String(item.id) }}
                    className="inline-block rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--brand-foreground)] hover:opacity-90">
                    Bax
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
