import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type Category } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/admin/kateqoriyalar")({
  component: CatsAdmin,
});

function CatsAdmin() {
  const [items, setItems] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  const load = async () => {
    const [cats, products] = await Promise.all([api.getCategories(), api.getProducts()]);
    setItems(cats);
    const counts: Record<string, number> = {};
    products.forEach((p) => { if (p.category_slug) counts[p.category_slug] = (counts[p.category_slug] || 0) + 1; });
    setProductCounts(counts);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.name || !editing?.slug) return toast.error("Ad və slug mütləqdir");
    try {
      if (editing.id) {
        await api.updateCategory(editing.id, editing);
      } else {
        await api.createCategory(editing);
      }
      toast.success("Saxlanıldı");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Kateqoriyanı silmək istədiyinizə əminsiniz?")) return;
    try {
      await api.deleteCategory(id);
      toast.success("Silindi");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (<div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Kateqoriyalar</h1>
          <p className="text-muted-foreground">{items.length} kateqoriya</p>
        </div>
        <button onClick={() => setEditing({ icon: "📦" })}
          className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2.5 font-semibold text-[var(--brand-foreground)] hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Yeni kateqoriya
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <div key={c.id} className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-3xl flex-shrink-0">{c.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate">{c.name}</div>
              <div className="text-xs text-muted-foreground">/{c.slug}</div>
              <div className="mt-1 text-xs font-medium text-[var(--brand)]">{productCounts[c.slug] || 0} məhsul</div>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <button onClick={() => setEditing(c)} className="rounded-lg p-2 hover:bg-secondary transition-colors"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => remove(c.id)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-3 py-12 text-center text-muted-foreground">Kateqoriya yoxdur</div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-xl font-bold">{editing.id ? "Kateqoriyanı redaktə et" : "Yeni kateqoriya"}</h2>
              <button onClick={() => setEditing(null)} className="rounded-lg p-1.5 hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <Field label="Ad *">
                <input className={inp} placeholder="Məs: Divanlar" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </Field>
              <Field label="Slug (URL) *">
                <input className={inp} placeholder="divanlar" value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} />
              </Field>
              <Field label="Ana kateqoriya (alt kateqoriya üçün seç)">
                <select className={inp} value={editing.parent_id ?? ""} onChange={(e) => setEditing({ ...editing, parent_id: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">— Ana kateqoriya (üst səviyyə) —</option>
                  {items.filter(c => !c.parent_id && c.id !== editing.id).map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Təsvir">
                <textarea className={inp} rows={2} placeholder="Kateqoriya haqqında qısa məlumat" value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </Field>
            </div>
            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
              <button onClick={() => setEditing(null)} className="rounded-xl border border-border px-5 py-2.5 font-medium hover:bg-secondary">Ləğv et</button>
              <button onClick={save} className="rounded-xl bg-[var(--brand)] px-5 py-2.5 font-semibold text-[var(--brand-foreground)] hover:opacity-90">
                {editing.id ? "Yadda saxla" : "Əlavə et"}
              </button>
            </div>
          </div>
        </div>
      )}

  </div>);
}

const inp = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)] transition-colors";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-medium">{label}</label>{children}</div>;
}
