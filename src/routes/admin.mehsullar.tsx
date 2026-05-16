import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { api, getImageUrl, type Product, type Category } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Search, ImageIcon, Star } from "lucide-react";

export const Route = createFileRoute("/admin/mehsullar")({
  component: ProductsAdmin,
});

function ProductsAdmin() {
  const [items, setItems] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [p, c] = await Promise.all([api.getProducts(), api.getCategories()]);
    setItems(p);
    setCats(c);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || p.category_slug === filterCat;
    return matchSearch && matchCat;
  }), [items, search, filterCat]);

  const save = async () => {
    if (!editing?.name) return toast.error("Ad mütləqdir");
    if (!editing?.price && editing.price !== 0) return toast.error("Qiymət mütləqdir");
    try {
      if (editing.id) {
        await api.updateProduct(editing.id, editing);
      } else {
        await api.createProduct(editing);
      }
      toast.success("Saxlanıldı");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Məhsulu silmək istədiyinizə əminsiniz?")) return;
    try {
      await api.deleteProduct(id);
      toast.success("Silindi");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const toggleActive = async (p: Product) => {
    try {
      await api.updateProduct(p.id, { ...p, is_active: p.is_active ? 0 : 1 });
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const toggleFeatured = async (p: Product) => {
    try {
      await api.setFeatured(p.id, !p.is_featured);
      toast.success(p.is_featured ? "Həftənin teklifi silindi" : `"${p.name}" həftənin teklifi oldu`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await api.uploadFile(file);
      setEditing((prev) => prev ? { ...prev, image: url } : prev);
      toast.success("Şəkil yükləndi");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (<div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Məhsullar</h1>
          <p className="text-muted-foreground">{filtered.length} / {items.length} məhsul</p>
        </div>
        <button onClick={() => setEditing({ is_active: 1, image: "", stock: 0, price: 0, discount: 0 })}
          className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2.5 font-semibold text-[var(--brand-foreground)] hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Yeni məhsul
        </button>
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Məhsul axtar..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]" />
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]">
          <option value="">Bütün kateqoriyalar</option>
          {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-background shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-secondary/40 text-left text-xs text-muted-foreground uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 w-16">Şəkil</th>
              <th className="px-4 py-3">Ad</th>
              <th className="px-4 py-3">Kateqoriya</th>
              <th className="px-4 py-3">Qiymət</th>
              <th className="px-4 py-3">Stok</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Teklif</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-10 text-center text-muted-foreground">Yüklənir...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="p-10 text-center text-muted-foreground">Məhsul tapılmadı</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                <td className="px-4 py-3">
                  {getImageUrl(p.image)
                    ? <img src={getImageUrl(p.image)!} alt="" className="h-11 w-11 rounded-lg object-cover border border-border" />
                    : <div className="h-11 w-11 rounded-lg bg-secondary flex items-center justify-center text-xl">{p.image || <ImageIcon className="h-5 w-5 text-muted-foreground" />}</div>}
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{p.name}</div>
                  {p.discount > 0 && <span className="text-xs text-[var(--brand)] font-medium">-{p.discount}% endirim</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{cats.find(c => c.slug === p.category_slug)?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="font-bold">{p.price} ₼</div>
                  {p.old_price ? <div className="text-xs text-muted-foreground line-through">{p.old_price} ₼</div> : null}
                </td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${p.stock === 0 ? "text-red-500" : p.stock < 5 ? "text-yellow-600" : "text-foreground"}`}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(p)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${p.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
                    {p.is_active ? "Aktiv" : "Passiv"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleFeatured(p)} title={p.is_featured ? "Həftənin teklifi — klik edib sil" : "Həftənin teklifi et"}
                    className={`rounded-full p-1.5 transition-colors ${p.is_featured ? "text-yellow-500 bg-yellow-50 hover:bg-yellow-100" : "text-muted-foreground hover:text-yellow-500 hover:bg-yellow-50"}`}>
                    <Star className={`h-4 w-4 ${p.is_featured ? "fill-yellow-400" : ""}`} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button onClick={() => setEditing(p)} className="rounded-lg p-2 hover:bg-secondary transition-colors" title="Redaktə">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(p.id)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10 transition-colors" title="Sil">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl rounded-2xl bg-background shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-xl font-bold">{editing.id ? "Məhsulu redaktə et" : "Yeni məhsul əlavə et"}</h2>
              <button onClick={() => setEditing(null)} className="rounded-lg p-1.5 hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              <Field label="Məhsul adı *">
                <input className={inp} value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Məs: Divan Milano" />
              </Field>
              <Field label="Təsvir">
                <textarea className={inp} rows={3} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Məhsul haqqında..." />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Qiymət (₼) *">
                  <input type="number" min="0" step="0.01" className={inp} value={editing.price ?? ""} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
                </Field>
                <Field label="Köhnə qiymət (₼)">
                  <input type="number" min="0" step="0.01" className={inp} value={editing.old_price ?? ""} onChange={(e) => setEditing({ ...editing, old_price: Number(e.target.value) || undefined })} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Endirim (%)">
                  <input type="number" min="0" max="100" className={inp} value={editing.discount ?? 0} onChange={(e) => setEditing({ ...editing, discount: Number(e.target.value) })} />
                </Field>
                <Field label="Stok miqdarı">
                  <input type="number" min="0" className={inp} value={editing.stock ?? 0} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} />
                </Field>
              </div>
              <Field label="Kateqoriya">
                <select className={inp} value={editing.category_slug ?? ""} onChange={(e) => setEditing({ ...editing, category_slug: e.target.value || undefined })}>
                  <option value="">— Kateqoriya seçin —</option>
                  {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Şəkil URL">
                <input className={inp} value={editing.image ?? ""} onChange={(e) => setEditing({ ...editing, image: e.target.value })} placeholder="https://... " />
              </Field>
              <Field label="və ya şəkil yüklə">
                <label className="flex items-center gap-2 cursor-pointer rounded-xl border-2 border-dashed border-border px-4 py-3 hover:border-[var(--brand)] transition-colors">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{uploading ? "Yüklənir..." : "Fayl seç (maks 5MB)"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </Field>
              {getImageUrl(editing.image) && (
                <img src={getImageUrl(editing.image)!} alt="" className="h-28 w-28 rounded-xl object-cover border border-border" />
              )}
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setEditing({ ...editing, is_active: editing.is_active ? 0 : 1 })}
                  className={`relative h-6 w-11 rounded-full transition-colors ${editing.is_active ? "bg-[var(--brand)]" : "bg-secondary"}`}>
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${editing.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm font-medium">Aktiv (saytda görünsün)</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
              <button onClick={() => setEditing(null)} className="rounded-xl border border-border px-5 py-2.5 font-medium hover:bg-secondary transition-colors">Ləğv et</button>
              <button onClick={save} className="rounded-xl bg-[var(--brand)] px-5 py-2.5 font-semibold text-[var(--brand-foreground)] hover:opacity-90 transition-opacity">
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
