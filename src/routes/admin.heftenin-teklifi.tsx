import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type Product, type FeaturedSettings } from "@/lib/api";
import { getImageUrl } from "@/lib/api";
import { toast } from "sonner";
import { Search, X, Star } from "lucide-react";

export const Route = createFileRoute("/admin/heftenin-teklifi")({
  component: FeaturedAdmin,
});

function FeaturedAdmin() {
  const [settings, setSettings] = useState<FeaturedSettings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [until, setUntil] = useState("");
  const [note, setNote] = useState("");
  const [discount, setDiscount] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getFeaturedSettings().then((s) => {
      setSettings(s);
      setUntil(s.until ? s.until.slice(0, 16) : "");
      setNote(s.note || "");
      setDiscount(s.discount || 0);
    }).catch(() => {});
    api.getProducts({ active: true }).then(setProducts).catch(() => {});
  }, []);

  const select = async (p: Product) => {
    setBusy(true);
    try {
      await api.updateFeaturedSettings({ product_id: p.id, until: until || null, note, discount });
      const updated = await api.getFeaturedSettings();
      setSettings(updated);
      toast.success(`"${p.name}" həftənin teklifi oldu`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!settings?.product_id) return toast.error("Əvvəlcə məhsul seçin");
    setBusy(true);
    try {
      await api.updateFeaturedSettings({ product_id: settings.product_id, until: until || null, note, discount });
      toast.success("Saxlanıldı");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    if (!confirm("Həftənin teklifini silmək istədiyinizə əminsiniz?")) return;
    await api.updateFeaturedSettings({ product_id: null, until: null, note: "" });
    setSettings((s) => s ? { ...s, product_id: null, product: undefined, until: null, note: "" } : s);
    setUntil(""); setNote("");
    toast.success("Silindi");
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const current = settings?.product;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black md:text-3xl">Həftənin teklifi</h1>
        <p className="text-muted-foreground">Seçilmiş məhsul ana səhifədə göstərilir</p>
      </div>

      {/* Current selection */}
      <div className="rounded-2xl border border-border bg-background p-5">
        <h2 className="mb-4 font-bold">Hazırkı seçim</h2>
        {current ? (
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-secondary">
              {(() => {
                const img = getImageUrl(current.image);
                return img
                  ? <img src={img} alt={current.name} className="h-full w-full object-cover" />
                  : <div className="flex h-full items-center justify-center text-3xl">{current.image || "📦"}</div>;
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold line-clamp-1">{current.name}</div>
              <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>Qiymət: <strong className="text-foreground">{current.price} ₼</strong></span>
                {current.discount ? <span>Endirim: <strong className="text-[var(--accent-orange)]">{current.discount}%</strong></span> : null}
                <span>Stok: <strong className={current.stock === 0 ? "text-red-500" : current.stock! < 5 ? "text-yellow-600" : "text-foreground"}>{current.stock} ədəd</strong></span>
              </div>
            </div>
            <button onClick={clear} className="flex-shrink-0 rounded-lg p-2 text-destructive hover:bg-destructive/10 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="py-6 text-center text-muted-foreground text-sm">Seçilmiş məhsul yoxdur</div>
        )}
      </div>

      {/* Settings */}
      <div className="rounded-2xl border border-border bg-background p-5 space-y-4">
        <h2 className="font-bold">Teklif parametrləri</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Bitmə vaxtı</label>
            <input
              type="datetime-local"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
              className={inp}
            />
            <p className="mt-1 text-xs text-muted-foreground">Boş qalarsa sayaç göstərilməyəcək</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Xüsusi endirim (%)</label>
            <input
              type="number"
              min={0}
              max={99}
              value={discount || ""}
              onChange={(e) => setDiscount(Number(e.target.value))}
              placeholder="0"
              className={inp}
            />
            <p className="mt-1 text-xs text-muted-foreground">0 — məhsulun öz endirimi istifadə olunur</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Qeyd (isteğe bağlı)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Məs: Yay kampaniyası"
              className={inp}
            />
          </div>
        </div>
        <button onClick={save} disabled={busy}
          className="rounded-xl bg-[var(--brand)] px-6 py-2.5 text-sm font-semibold text-[var(--brand-foreground)] hover:opacity-90 disabled:opacity-50">
          {busy ? "..." : "Yadda saxla"}
        </button>
      </div>

      {/* Product picker */}
      <div className="rounded-2xl border border-border bg-background p-5">
        <h2 className="mb-4 font-bold">Məhsul seç</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Məhsul axtar..."
            className={`${inp} pl-9`}
          />
        </div>
        <div className="max-h-96 overflow-y-auto space-y-2">
          {filtered.map((p) => {
            const img = getImageUrl(p.image);
            const isSelected = settings?.product_id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => select(p)}
                disabled={busy}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-secondary/50 ${isSelected ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-border"}`}
              >
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
                  {img
                    ? <img src={img} alt={p.name} className="h-full w-full object-cover" />
                    : <div className="flex h-full items-center justify-center text-xl">{p.image || "📦"}</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm line-clamp-1">{p.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex gap-2">
                    <span>{p.price} ₼</span>
                    {p.discount > 0 && <span className="text-[var(--accent-orange)]">−{p.discount}%</span>}
                    <span className={p.stock === 0 ? "text-red-500" : ""}>{p.stock} stok</span>
                  </div>
                </div>
                {isSelected && <Star className="h-4 w-4 flex-shrink-0 fill-yellow-400 text-yellow-400" />}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">Məhsul tapılmadı</div>
          )}
        </div>
      </div>
    </div>
  );
}

const inp = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)] transition-colors";
