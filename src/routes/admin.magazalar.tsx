import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type Store } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/admin/magazalar")({
  component: StoresAdmin,
});

function StoresAdmin() {
  const [items, setItems] = useState<Store[]>([]);
  const [editing, setEditing] = useState<Partial<Store> | null>(null);

  const load = () => api.getStores().then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.name) return toast.error("Ad mütləqdir");
    try {
      if (editing.id) {
        await api.updateStore(editing.id, editing);
      } else {
        await api.createStore(editing);
      }
      toast.success("Saxlanıldı");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Mağazanı silmək istədiyinizə əminsiniz?")) return;
    await api.deleteStore(id);
    toast.success("Silindi");
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Mağazalar</h1>
          <p className="text-muted-foreground">{items.length} mağaza</p>
        </div>
        <button onClick={() => setEditing({ phone: "+994 50 707 22 21", hours: "10:00 — 22:00" })}
          className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2.5 font-semibold text-[var(--brand-foreground)] hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Yeni mağaza
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <div key={s.id} className="rounded-2xl border border-border bg-background p-4 shadow-sm">
            {s.city && <div className="text-xs font-semibold uppercase tracking-wider text-[var(--brand)] mb-1">{s.city}</div>}
            <div className="font-bold">{s.name}</div>
            <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              {s.address && <div>📍 {s.address}</div>}
              {s.phone && <div>📞 {s.phone}</div>}
              {s.hours && <div>🕐 {s.hours}</div>}
            </div>
            <div className="mt-3 flex gap-1.5">
              <button onClick={() => setEditing(s)} className="rounded-lg p-2 hover:bg-secondary transition-colors"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => remove(s.id)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-3 py-12 text-center text-muted-foreground">Mağaza yoxdur</div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-xl font-bold">{editing.id ? "Mağazanı redaktə et" : "Yeni mağaza"}</h2>
              <button onClick={() => setEditing(null)} className="rounded-lg p-1.5 hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <Field label="Mağaza adı *">
                <input className={inp} placeholder="Məs: Çınarlı Gənclik Mall" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </Field>
              <Field label="Şəhər">
                <input className={inp} placeholder="Bakı" value={editing.city ?? ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
              </Field>
              <Field label="Ünvan">
                <input className={inp} placeholder="Neftçilər pr. 123" value={editing.address ?? ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
              </Field>
              <Field label="Telefon">
                <input className={inp} placeholder="+994 50 707 22 21" value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
              </Field>
              <Field label="İş saatları">
                <input className={inp} placeholder="10:00 — 22:00" value={editing.hours ?? ""} onChange={(e) => setEditing({ ...editing, hours: e.target.value })} />
              </Field>
              <Field label="Enlik (lat)">
                <input className={inp} type="number" step="0.0001" placeholder="məs: 40.4093" value={editing.lat ?? ""} onChange={(e) => setEditing({ ...editing, lat: e.target.value ? Number(e.target.value) : undefined })} />
              </Field>
              <Field label="Uzunluq (lng)">
                <input className={inp} type="number" step="0.0001" placeholder="məs: 49.8671" value={editing.lng ?? ""} onChange={(e) => setEditing({ ...editing, lng: e.target.value ? Number(e.target.value) : undefined })} />
              </Field>
              <div className="col-span-2 rounded-xl bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                💡 Google Maps-dən koordinat: mağazanı sağ klik → "Bu nədir?" → rəqəmləri köçür
              </div>
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
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-medium">{label}</label>{children}</div>;
}
