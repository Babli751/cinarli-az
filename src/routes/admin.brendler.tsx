import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, getImageUrl, type Brand } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, ImageIcon } from "lucide-react";

export const Route = createFileRoute("/admin/brendler")({
  component: BrandsAdmin,
});

function BrandsAdmin() {
  const [items, setItems] = useState<Brand[]>([]);
  const [editing, setEditing] = useState<Partial<Brand> | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = () => api.getBrandsAll().then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.name) return toast.error("Ad mütləqdir");
    const slug = editing.slug || editing.name.toLowerCase()
      .replace(/ə/g, "e").replace(/ö/g, "o").replace(/ü/g, "u")
      .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ş/g, "s").replace(/ç/g, "c")
      .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    try {
      if (editing.id) await api.updateBrand(editing.id, { ...editing, slug });
      else await api.createBrand({ ...editing, slug });
      toast.success("Saxlanıldı");
      setEditing(null);
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const remove = async (id: number) => {
    if (!confirm("Brendi silmək istədiyinizə əminsiniz?")) return;
    await api.deleteBrand(id);
    toast.success("Silindi");
    load();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await api.uploadFile(file);
      setEditing(ed => ed ? { ...ed, logo: url } : ed);
    } catch (err: any) { toast.error(err.message); }
    finally { setUploading(false); e.target.value = ""; }
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Brendlər</h1>
          <p className="text-muted-foreground">{items.length} brend</p>
        </div>
        <button onClick={() => setEditing({ is_active: 1, logo: "" })}
          className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 font-semibold text-[var(--brand-foreground)] hover:opacity-90 text-sm">
          <Plus className="h-4 w-4" /> Yeni brend
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((b) => {
          const logoUrl = getImageUrl(b.logo);
          return (
            <div key={b.id} className={`relative flex flex-col items-center rounded-2xl border p-4 shadow-sm hover:shadow-md transition-shadow ${b.is_active ? "border-border bg-background" : "border-dashed border-muted-foreground/30 bg-secondary/30 opacity-60"}`}>
              <div className="flex h-16 w-full items-center justify-center rounded-xl bg-secondary/50 p-2">
                {logoUrl
                  ? <img src={logoUrl} alt={b.name} className="max-h-12 max-w-full object-contain" />
                  : <span className="text-2xl font-black text-muted-foreground">{b.name[0]}</span>
                }
              </div>
              <div className="mt-2 text-center text-xs font-semibold truncate w-full">{b.name}</div>
              <div className="mt-2 flex gap-1">
                <button onClick={() => setEditing(b)} className="rounded-lg p-1.5 hover:bg-secondary"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => remove(b.id)} className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="col-span-6 py-12 text-center text-muted-foreground">Hələ brend yoxdur</div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-xl font-bold">{editing.id ? "Redaktə et" : "Yeni brend"}</h2>
              <button onClick={() => setEditing(null)} className="rounded-lg p-1.5 hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Ad *</label>
                <input className={inp} value={editing.name ?? ""} onChange={e => setEditing({ ...editing, name: e.target.value, slug: "" })} placeholder="Məs: Samsung" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Logo</label>
                <div className="flex items-center gap-3">
                  {getImageUrl(editing.logo ?? "") && (
                    <img src={getImageUrl(editing.logo ?? "")!} alt="" className="h-12 w-20 object-contain rounded-lg border border-border bg-secondary/30 p-1" />
                  )}
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-sm hover:border-[var(--brand)] transition-colors">
                    {uploading ? "Yüklənir..." : <><ImageIcon className="h-4 w-4" /> Logo yüklə</>}
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
                  </label>
                </div>
                <input className={`${inp} mt-2`} value={editing.logo ?? ""} onChange={e => setEditing({ ...editing, logo: e.target.value })} placeholder="və ya URL yapışdır..." />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setEditing({ ...editing, is_active: editing.is_active ? 0 : 1 })}
                  className={`relative h-6 w-11 rounded-full transition-colors ${editing.is_active ? "bg-[var(--brand)]" : "bg-secondary"}`}>
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${editing.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm font-medium">Aktiv (sliderdə görünsün)</span>
              </label>
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
    </div>
  );
}

const inp = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)] transition-colors";
