import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, getImageUrl, type Campaign } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, ImageIcon, Calendar } from "lucide-react";

export const Route = createFileRoute("/admin/kampaniyalar")({
  component: CampaignsAdmin,
});

function CampaignsAdmin() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [editing, setEditing] = useState<Partial<Campaign> | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    api.getCampaigns().then(setItems).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.title) return toast.error("Başlıq mütləqdir");
    try {
      if (editing.id) {
        await api.updateCampaign(editing.id, editing);
      } else {
        await api.createCampaign(editing);
      }
      toast.success("Saxlanıldı");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Kampaniyanı silmək istədiyinizə əminsiniz?")) return;
    try {
      await api.deleteCampaign(id);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const toggleActive = async (c: Campaign) => {
    try {
      await api.updateCampaign(c.id, { ...c, is_active: c.is_active ? 0 : 1 });
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

  const isExpired = (c: Campaign) => c.end_date ? new Date(c.end_date) < new Date() : false;

  return (<div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Kampaniyalar</h1>
          <p className="text-muted-foreground">{items.filter(c => c.is_active).length} aktiv / {items.length} ümumi</p>
        </div>
        <button onClick={() => setEditing({ is_active: 1, discount_percent: 0 })}
          className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2.5 font-semibold text-[var(--brand-foreground)] hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Yeni kampaniya
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-muted-foreground">Kampaniya yoxdur</div>
        ) : items.map((c) => (
          <div key={c.id} className={`rounded-2xl border bg-background overflow-hidden shadow-sm transition-all ${isExpired(c) ? "opacity-60 border-border" : "border-border hover:shadow-md"}`}>
            {getImageUrl(c.image)
              ? <img src={getImageUrl(c.image)!} alt="" className="h-40 w-full object-cover" />
              : <div className="h-40 bg-secondary flex items-center justify-center text-muted-foreground text-sm">Şəkil yoxdur</div>}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold leading-tight">{c.title}</h3>
                <button onClick={() => toggleActive(c)}
                  className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.is_active ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"}`}>
                  {c.is_active ? "Aktiv" : "Passiv"}
                </button>
              </div>
              {c.discount_percent > 0 && (
                <div className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-0.5 text-sm font-bold text-red-600 mb-2">
                  -{c.discount_percent}% endirim
                </div>
              )}
              {c.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{c.description}</p>}
              {(c.start_date || c.end_date) && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  <Calendar className="h-3.5 w-3.5" />
                  {c.start_date && <span>{new Date(c.start_date).toLocaleDateString("az-AZ")}</span>}
                  {c.start_date && c.end_date && <span>—</span>}
                  {c.end_date && <span className={isExpired(c) ? "text-red-500 font-medium" : ""}>{new Date(c.end_date).toLocaleDateString("az-AZ")}{isExpired(c) ? " (bitmişdir)" : ""}</span>}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setEditing(c)} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-sm font-medium hover:bg-secondary transition-colors">
                  <Pencil className="h-3.5 w-3.5" /> Redaktə
                </button>
                <button onClick={() => remove(c.id)} className="rounded-xl border border-destructive/30 p-2 text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl rounded-2xl bg-background shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-xl font-bold">{editing.id ? "Kampaniyanı redaktə et" : "Yeni kampaniya"}</h2>
              <button onClick={() => setEditing(null)} className="rounded-lg p-1.5 hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              <Field label="Başlıq *">
                <input className={inp} placeholder="Məs: Yaz endirimi" value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </Field>
              <Field label="Təsvir">
                <textarea className={inp} rows={3} placeholder="Kampaniya haqqında..." value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </Field>
              <Field label="Endirim faizi (%)">
                <input type="number" min="0" max="100" className={inp} value={editing.discount_percent ?? 0} onChange={(e) => setEditing({ ...editing, discount_percent: Number(e.target.value) })} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Başlama tarixi">
                  <input type="date" className={inp} value={editing.start_date ?? ""} onChange={(e) => setEditing({ ...editing, start_date: e.target.value || undefined })} />
                </Field>
                <Field label="Bitmə tarixi">
                  <input type="date" className={inp} value={editing.end_date ?? ""} onChange={(e) => setEditing({ ...editing, end_date: e.target.value || undefined })} />
                </Field>
              </div>
              <Field label="Şəkil URL">
                <input className={inp} value={editing.image ?? ""} onChange={(e) => setEditing({ ...editing, image: e.target.value })} placeholder="https://..." />
              </Field>
              <Field label="və ya şəkil yüklə">
                <label className="flex items-center gap-2 cursor-pointer rounded-xl border-2 border-dashed border-border px-4 py-3 hover:border-[var(--brand)] transition-colors">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{uploading ? "Yüklənir..." : "Fayl seç"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </Field>
              {getImageUrl(editing.image) && (
                <img src={getImageUrl(editing.image)!} alt="" className="h-32 w-full rounded-xl object-cover border border-border" />
              )}
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setEditing({ ...editing, is_active: editing.is_active ? 0 : 1 })}
                  className={`relative h-6 w-11 rounded-full transition-colors ${editing.is_active ? "bg-[var(--brand)]" : "bg-secondary"}`}>
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${editing.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm font-medium">Aktiv</span>
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

  </div>);
}

const inp = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)] transition-colors";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-medium">{label}</label>{children}</div>;
}
