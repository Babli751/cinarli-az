import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type Product, type FeaturedSettings, type FeaturedProductItem } from "@/lib/api";
import { getImageUrl } from "@/lib/api";
import { toast } from "sonner";
import { Search, X, Star, Check, ChevronDown, ChevronUp } from "lucide-react";

export const Route = createFileRoute("/admin/heftenin-teklifi")({
  component: FeaturedAdmin,
});

const CREDIT_OPTIONS = [6, 12, 18, 24, 36, 48, 60];

function FeaturedAdmin() {
  const [settings, setSettings] = useState<FeaturedSettings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<FeaturedProductItem[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getFeaturedSettings().then((s) => {
      setSettings(s);
      setNote(s.note || "");
      const loaded: FeaturedProductItem[] = Array.isArray(s.product_items) && s.product_items.length
        ? s.product_items
        : Array.isArray(s.product_ids)
          ? s.product_ids.map(id => ({ id, discount: 0, credit_months: 24, until: null }))
          : [];
      setItems(loaded);
    }).catch(() => {});
    api.getProducts({ active: true }).then(setProducts).catch(() => {});
  }, []);

  const selectedIds = items.map(i => i.id);

  const toggleProduct = (p: Product) => {
    if (selectedIds.includes(p.id)) {
      setItems(prev => prev.filter(i => i.id !== p.id));
      if (expanded === p.id) setExpanded(null);
    } else {
      setItems(prev => [...prev, { id: p.id, discount: 0, credit_months: 24, until: null }]);
    }
  };

  const updateItem = (id: number, patch: Partial<FeaturedProductItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  };

  const save = async () => {
    if (items.length === 0) return toast.error("Ən az 1 məhsul seçin");
    setBusy(true);
    try {
      await api.updateFeaturedSettings({
        product_items: items,
        until: null,
        note,
        discount: 0,
        credit_months: 24,
      } as any);
      const updated = await api.getFeaturedSettings();
      setSettings(updated);
      toast.success("Saxlanıldı");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    if (!confirm("Həftənin teklifini silmək istədiyinizə əminsiniz?")) return;
    await api.updateFeaturedSettings({ product_items: [], until: null, note: "", discount: 0, credit_months: 24 } as any);
    setItems([]);
    setNote("");
    setSettings(s => s ? { ...s, product_items: [], product_ids: [], featured_products: [] } : s);
    toast.success("Silindi");
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedProducts = products.filter(p => selectedIds.includes(p.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black md:text-3xl">Həftənin teklifi</h1>
        <p className="text-muted-foreground">Məhsul seç, hər məhsul üçün ayrıca endirim/kredit/vaxt təyin et</p>
      </div>

      {/* Selected products with per-product settings */}
      <div className="rounded-2xl border border-border bg-background p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Seçilmiş məhsullar ({items.length})</h2>
          {items.length > 0 && (
            <button onClick={clear} className="text-xs text-destructive hover:underline">Hamısını sil</button>
          )}
        </div>
        {selectedProducts.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground text-sm">Məhsul seçilməyib</div>
        ) : (
          <div className="space-y-2">
            {selectedProducts.map(p => {
              const img = getImageUrl(p.image);
              const item = items.find(i => i.id === p.id) || { id: p.id, discount: 0, credit_months: 24, until: null };
              const isOpen = expanded === p.id;
              return (
                <div key={p.id} className="rounded-xl border border-[var(--brand)] bg-[var(--brand)]/5 overflow-hidden">
                  {/* Header row */}
                  <div className="flex items-center gap-3 p-3">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
                      {img ? <img src={img} alt={p.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xl">{p.image || "📦"}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm line-clamp-1">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.price} ₼
                        {item.discount ? ` · −${item.discount}%` : ""}
                        {` · ${item.credit_months || 24} ay`}
                        {item.until ? ` · ${new Date(item.until).toLocaleDateString("az")}` : ""}
                      </div>
                    </div>
                    <button onClick={() => setExpanded(isOpen ? null : p.id)}
                      className="flex-shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <button onClick={() => toggleProduct(p)} className="flex-shrink-0 rounded-lg p-1.5 text-destructive hover:bg-destructive/10">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Expanded per-product settings */}
                  {isOpen && (
                    <div className="border-t border-[var(--brand)]/20 px-4 py-4 bg-background space-y-4">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Xüsusi endirim (%)</label>
                          <input type="number" min={0} max={99}
                            value={item.discount || ""}
                            onChange={e => updateItem(p.id, { discount: Number(e.target.value) })}
                            placeholder="0"
                            className={inp} />
                          <p className="mt-1 text-xs text-muted-foreground">0 → məhsulun öz endirimi ({p.discount}%)</p>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Bitmə vaxtı</label>
                          <input type="datetime-local"
                            value={item.until ? item.until.slice(0, 16) : ""}
                            onChange={e => updateItem(p.id, { until: e.target.value || null })}
                            className={inp} />
                          <p className="mt-1 text-xs text-muted-foreground">Boş → sayaç görünməz</p>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Kredit müddəti</label>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {CREDIT_OPTIONS.map(m => (
                              <button key={m} onClick={() => updateItem(p.id, { credit_months: m })}
                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition-colors ${(item.credit_months || 24) === m ? "bg-[var(--brand)] text-[var(--brand-foreground)] border-[var(--brand)]" : "border-border hover:bg-secondary"}`}>
                                {m} ay
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Global note + save */}
      <div className="rounded-2xl border border-border bg-background p-5 space-y-4">
        <h2 className="font-bold">Ümumi parametrlər</h2>
        <div className="max-w-sm">
          <label className="mb-1.5 block text-sm font-medium">Qeyd</label>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Məs: Yay kampaniyası" className={inp} />
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Məhsul axtar..." className={`${inp} pl-9`} />
        </div>
        <div className="max-h-96 overflow-y-auto space-y-2">
          {filtered.map(p => {
            const img = getImageUrl(p.image);
            const isSelected = selectedIds.includes(p.id);
            return (
              <button key={p.id} onClick={() => toggleProduct(p)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-secondary/50 ${isSelected ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-border"}`}>
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
                  {img ? <img src={img} alt={p.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xl">{p.image || "📦"}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm line-clamp-1">{p.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex gap-2">
                    <span>{p.price} ₼</span>
                    {p.discount > 0 && <span className="text-[var(--accent-orange)]">−{p.discount}%</span>}
                    <span className={p.stock === 0 ? "text-red-500" : ""}>{p.stock} stok</span>
                  </div>
                </div>
                {isSelected
                  ? <Check className="h-4 w-4 flex-shrink-0 text-[var(--brand)]" />
                  : <Star className="h-4 w-4 flex-shrink-0 text-muted-foreground/30" />
                }
              </button>
            );
          })}
          {filtered.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">Məhsul tapılmadı</div>}
        </div>
      </div>
    </div>
  );
}

const inp = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)] transition-colors";
