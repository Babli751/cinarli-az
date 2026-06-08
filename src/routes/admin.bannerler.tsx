import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, getImageUrl, type Banner } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, ImageIcon, ChevronUp, ChevronDown, X } from "lucide-react";
import { ImageCropUploader } from "@/components/ImageCropUploader";

export const Route = createFileRoute("/admin/bannerler")({
  component: BannersAdmin,
});

function BannersAdmin() {
  const [items, setItems] = useState<Banner[]>([]);
  const [adding, setAdding] = useState(false);
  const [pendingUrl, setPendingUrl] = useState("");

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

  const handleCropDone = async (url: string) => {
    setPendingUrl(url);
  };

  const confirmAdd = async () => {
    if (!pendingUrl) return;
    try {
      await api.createBanner({ image: pendingUrl });
      toast.success("Banner əlavə edildi");
      setAdding(false);
      setPendingUrl("");
      load();
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Bannerlər</h1>
          <p className="text-muted-foreground">{items.length} banner · Ana səhifədə dönən göstərilir</p>
        </div>
        <button onClick={() => { setAdding(true); setPendingUrl(""); }}
          className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 font-semibold text-[var(--brand-foreground)] hover:opacity-90 text-sm">
          <Plus className="h-4 w-4" /> Şəkil əlavə et
        </button>
      </div>

      {adding && (
        <div className="mt-6 rounded-2xl border border-border bg-background p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Yeni banner</p>
            <button onClick={() => { setAdding(false); setPendingUrl(""); }} className="rounded-lg p-1.5 hover:bg-secondary"><X className="h-4 w-4" /></button>
          </div>
          <ImageCropUploader
            ratio={16 / 9}
            value={pendingUrl}
            onChange={handleCropDone}
            label="Banner şəkli yüklə (tövsiyə: 1200×675 px)"
          />
          {pendingUrl && (
            <button onClick={confirmAdd}
              className="w-full rounded-xl bg-[var(--brand)] px-4 py-2.5 font-semibold text-[var(--brand-foreground)] hover:opacity-90 text-sm">
              Banneri əlavə et
            </button>
          )}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {items.length === 0 && !adding && (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
            <ImageIcon className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p>Hələ banner yoxdur. Şəkil yükləyin.</p>
            <p className="mt-1 text-xs">Tövsiyə: 1200×675 px, 16:9 format</p>
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
