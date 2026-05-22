import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, getImageUrl, type Banner } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, ImageIcon, ChevronUp, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/admin/bannerler")({
  component: BannersAdmin,
});

function BannersAdmin() {
  const [items, setItems] = useState<Banner[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = () => api.getBannersAll().then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);

  const remove = async (id: number) => {
    if (!confirm("Banneri silmək istədiyinizə əminsiniz?")) return;
    await api.deleteBanner(id);
    toast.success("Silindi");
    load();
  };

  const toggle = async (b: Banner) => {
    await api.updateBanner(b.id, { is_active: b.is_active ? 0 : 1 });
    load();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const a = items[idx];
    const b = items[idx + dir];
    if (!b) return;
    await Promise.all([
      api.updateBanner(a.id, { position: b.position }),
      api.updateBanner(b.id, { position: a.position }),
    ]);
    load();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await api.uploadFile(file);
      await api.createBanner({ image: url });
      toast.success("Banner əlavə edildi");
      load();
    } catch (err: any) { toast.error(err.message); }
    finally { setUploading(false); e.target.value = ""; }
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Bannerlər</h1>
          <p className="text-muted-foreground">{items.length} banner · Ana səhifədə dönən göstərilir</p>
        </div>
        <label className={`flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 font-semibold text-[var(--brand-foreground)] hover:opacity-90 text-sm ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
          {uploading ? "Yüklənir..." : <><Plus className="h-4 w-4" /> Şəkil əlavə et</>}
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      <div className="mt-6 space-y-3">
        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
            <ImageIcon className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p>Hələ banner yoxdur. Şəkil yükləyin.</p>
            <p className="mt-1 text-xs">Tövsiyə: 1200×400 px, geniş format</p>
          </div>
        )}
        {items.map((b, idx) => {
          const url = getImageUrl(b.image);
          return (
            <div key={b.id} className={`flex items-center gap-4 rounded-2xl border border-border bg-background p-3 transition ${!b.is_active ? "opacity-50" : ""}`}>
              <div className="flex flex-col gap-1">
                <button onClick={() => move(idx, -1)} disabled={idx === 0} className="rounded p-1 hover:bg-secondary disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
                <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1} className="rounded p-1 hover:bg-secondary disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
              </div>
              <div className="h-20 w-36 flex-shrink-0 overflow-hidden rounded-xl bg-secondary/40">
                {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><ImageIcon className="h-6 w-6" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{b.image}</p>
                <p className="mt-1 text-xs text-muted-foreground">Sıra: {b.position}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggle(b)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${b.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-secondary text-muted-foreground hover:bg-secondary/70"}`}>
                  {b.is_active ? "Aktiv" : "Gizli"}
                </button>
                <button onClick={() => remove(b.id)} className="rounded-xl p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
