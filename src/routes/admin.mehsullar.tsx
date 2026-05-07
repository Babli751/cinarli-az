import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/admin/mehsullar")({
  component: ProductsAdmin,
});

type Product = {
  id: string; name: string; price: number; old_price: number | null;
  discount: number | null; image: string | null; category_slug: string | null;
  stock: number | null; is_active: boolean;
};

type Cat = { slug: string; name: string };

function ProductsAdmin() {
  const [items, setItems] = useState<Product[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("slug,name").order("name"),
    ]);
    setItems((p as Product[]) ?? []);
    setCats((c as Cat[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.name) return toast.error("Ad mütləqdir");
    const payload = {
      name: editing.name,
      price: Number(editing.price ?? 0),
      old_price: editing.old_price ? Number(editing.old_price) : null,
      discount: Number(editing.discount ?? 0),
      image: editing.image ?? "📦",
      category_slug: editing.category_slug ?? null,
      stock: Number(editing.stock ?? 0),
      is_active: editing.is_active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saxlanıldı");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Silmək istədiyinizə əminsiniz?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Silindi");
    load();
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Məhsullar</h1>
          <p className="text-muted-foreground">{items.length} məhsul</p>
        </div>
        <button onClick={() => setEditing({ is_active: true, image: "📦" })}
          className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2.5 font-semibold text-[var(--brand-foreground)] hover:opacity-90">
          <Plus className="h-4 w-4" /> Yeni məhsul
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left">
            <tr>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Ad</th>
              <th className="px-4 py-3">Kateqoriya</th>
              <th className="px-4 py-3">Qiymət</th>
              <th className="px-4 py-3">Stok</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Yüklənir...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Hələ məhsul yoxdur</td></tr>
            ) : items.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3 text-2xl">{p.image}</td>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.category_slug ?? "—"}</td>
                <td className="px-4 py-3 font-bold">{p.price} ₼</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs ${p.is_active ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"}`}>
                    {p.is_active ? "Aktiv" : "Passiv"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(p)} className="rounded p-1.5 hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => remove(p.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editing.id ? "Məhsulu redaktə et" : "Yeni məhsul"}</h2>
              <button onClick={() => setEditing(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Ad"><input className={inp} value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Qiymət (₼)"><input type="number" className={inp} value={editing.price ?? ""} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} /></Field>
                <Field label="Köhnə qiymət"><input type="number" className={inp} value={editing.old_price ?? ""} onChange={(e) => setEditing({ ...editing, old_price: Number(e.target.value) })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Endirim (%)"><input type="number" className={inp} value={editing.discount ?? ""} onChange={(e) => setEditing({ ...editing, discount: Number(e.target.value) })} /></Field>
                <Field label="Stok"><input type="number" className={inp} value={editing.stock ?? ""} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} /></Field>
              </div>
              <Field label="Şəkil (emoji və ya URL)"><input className={inp} value={editing.image ?? ""} onChange={(e) => setEditing({ ...editing, image: e.target.value })} /></Field>
              <Field label="Kateqoriya">
                <select className={inp} value={editing.category_slug ?? ""} onChange={(e) => setEditing({ ...editing, category_slug: e.target.value })}>
                  <option value="">— seçin —</option>
                  {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                Aktiv
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-lg border border-border px-4 py-2 font-medium">Ləğv</button>
              <button onClick={save} className="rounded-lg bg-[var(--brand)] px-4 py-2 font-semibold text-[var(--brand-foreground)]">Saxla</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const inp = "w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-[var(--brand)]";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-sm font-medium">{label}</label>{children}</div>;
}
