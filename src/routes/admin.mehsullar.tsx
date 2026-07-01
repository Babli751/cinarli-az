import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { api, getImageUrl, type Product, type Category, type Brand } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Search, ImageIcon, TrendingUp, Flame, Shuffle } from "lucide-react";

export const Route = createFileRoute("/admin/mehsullar")({
  component: ProductsAdmin,
});

function ProductsAdmin() {
  const [items, setItems] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [uploading, setUploading] = useState(false);
  const [extraImages, setExtraImages] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    const [p, c, b] = await Promise.all([api.getProducts(), api.getCategoriesAll(), api.getBrandsAll()]);
    setItems(p);
    setCats(c);
    setBrands(b);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || (p.brand_slug ?? "").toLowerCase().includes(q);
    const matchCat = !filterCat || p.category_slug === filterCat;
    return matchSearch && matchCat;
  }), [items, search, filterCat]);

  const save = async () => {
    if (!editing?.name) return toast.error("Ad mütləqdir");
    if (!editing?.price && editing.price !== 0) return toast.error("Qiymət mütləqdir");
    try {
      const mainImage = extraImages[0] || editing.image || "";
      const payload = { ...editing, image: mainImage, images: JSON.stringify(extraImages) };
      if (editing.id) {
        await api.updateProduct(editing.id, payload);
      } else {
        await api.createProduct(payload);
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

  const togglePopular = async (p: Product) => {
    try {
      await api.setPopular(p.id, !p.is_popular);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const toggleMostSold = async (p: Product) => {
    try {
      await api.setMostSold(p.id, !p.most_sold);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const randomizePopular = async () => {
    try {
      const all = items.filter(p => p.is_active);
      const picked = [...all].sort(() => Math.random() - 0.5).slice(0, 12);
      await Promise.all(all.map(p => api.setPopular(p.id, picked.some(s => s.id === p.id))));
      load();
      toast.success("Populyar məhsullar yeniləndi");
    } catch { toast.error("Xəta"); }
  };

  const randomizeMostSold = async () => {
    try {
      const all = items.filter(p => p.is_active);
      const picked = [...all].sort(() => Math.random() - 0.5).slice(0, 12);
      await Promise.all(all.map(p => api.setMostSold(p.id, picked.some(s => s.id === p.id))));
      load();
      toast.success("Çox satılan məhsullar yeniləndi");
    } catch { toast.error("Xəta"); }
  };

const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(f => api.uploadFile(f)));
      setExtraImages(prev => {
        const updated = [...prev, ...urls];
        setEditing(ed => ed ? { ...ed, image: ed.image || updated[0] || "" } : ed);
        return updated;
      });
      toast.success(`${urls.length} şəkil yükləndi`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (<div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Məhsullar</h1>
          <p className="text-muted-foreground">{filtered.length} / {items.length} məhsul</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={randomizePopular} title="Populyar məhsulları random seç"
            className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition">
            <Shuffle className="h-4 w-4" /> Populyar
          </button>
          <button onClick={randomizeMostSold} title="Çox satılanları random seç"
            className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-100 transition">
            <Shuffle className="h-4 w-4" /> Çox satılan
          </button>
          <button onClick={() => { setEditing({ is_active: 1, image: "", stock: 0, price: 0, discount: 0 }); setExtraImages([]); }}
            className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2.5 font-semibold text-[var(--brand-foreground)] hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> Yeni məhsul
          </button>
        </div>
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
          {cats.map((c) => <option key={c.slug} value={c.slug}>{c.is_hidden ? "🔒 " : ""}{c.name}</option>)}
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
              <th className="px-4 py-3 text-center" title="Populyar">Populyar</th>
              <th className="px-4 py-3 text-center" title="Çox satılan">Çox satılan</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="p-10 text-center text-muted-foreground">Yüklənir...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="p-10 text-center text-muted-foreground">Məhsul tapılmadı</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                <td className="px-4 py-3">
                  {getImageUrl(p.image)
                    ? <img src={getImageUrl(p.image)!} alt="" className="h-11 w-11 rounded-lg object-cover border border-border" />
                    : <div className="h-11 w-11 rounded-lg bg-secondary flex items-center justify-center text-xl">{p.image || <ImageIcon className="h-5 w-5 text-muted-foreground" />}</div>}
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{p.name}</div>
                  {(() => {
                    if (p.extra_price != null) return <span className="text-xs text-[var(--brand)] font-medium">-{Math.round((1 - p.extra_price / p.price) * 100)}% endirim</span>;
                    if (p.sale_price != null) return <span className="text-xs text-[var(--brand)] font-medium">-{Math.round((1 - p.sale_price / p.price) * 100)}% endirim</span>;
                    if (p.discount > 0) return <span className="text-xs text-[var(--brand)] font-medium">-{p.discount}% endirim</span>;
                    return null;
                  })()}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{cats.find(c => c.slug === p.category_slug)?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  {(() => {
                    const active = p.extra_price != null ? p.extra_price
                      : p.sale_price != null ? p.sale_price
                      : p.old_price && p.old_price > p.price ? p.price
                      : p.discount > 0 ? Math.round(p.price * (1 - p.discount / 100))
                      : p.price;
                    const orig = p.extra_price != null || p.sale_price != null ? p.price
                      : p.old_price && p.old_price > p.price ? p.old_price
                      : p.discount > 0 ? p.price
                      : null;
                    return <>
                      <div className="font-bold">{active} AZN</div>
                      {orig && <div className="text-xs text-muted-foreground line-through">{orig} AZN</div>}
                    </>;
                  })()}
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
                <td className="px-4 py-3 text-center">
                  <button onClick={() => togglePopular(p)} title={p.is_popular ? "Populyardan çıxar" : "Populyar et"}
                    className={`rounded-full p-1.5 transition-colors ${p.is_popular ? "bg-blue-100 text-blue-600 hover:bg-blue-200" : "text-muted-foreground hover:text-blue-500 hover:bg-blue-50"}`}>
                    <TrendingUp className={`h-4 w-4 ${p.is_popular ? "stroke-[2.5]" : ""}`} />
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleMostSold(p)} title={p.most_sold ? "Çox satılandan çıxar" : "Çox satılan et"}
                    className={`rounded-full p-1.5 transition-colors ${p.most_sold ? "bg-orange-100 text-orange-600 hover:bg-orange-200" : "text-muted-foreground hover:text-orange-500 hover:bg-orange-50"}`}>
                    <Flame className={`h-4 w-4 ${p.most_sold ? "fill-orange-400" : ""}`} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button onClick={() => { setEditing(p); try { const imgs: string[] = JSON.parse(p.images || "[]"); const all = p.image ? [p.image, ...imgs.filter(x => x !== p.image)] : imgs; setExtraImages(all); } catch { setExtraImages(p.image ? [p.image] : []); } }} className="rounded-lg p-2 hover:bg-secondary transition-colors" title="Redaktə">
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
              {/* Qiymət strukturu */}
              <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Qiymət</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Əsas qiymət (AZN) *">
                    <input type="number" min="0" step="0.01" className={inp} value={editing.price ?? ""} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
                  </Field>
                  <Field label="Endirimli qiymət (AZN)">
                    <input type="number" min="0" step="0.01" className={inp} placeholder="Boş = endirim yox"
                      value={editing.sale_price ?? ""}
                      onChange={(e) => setEditing({ ...editing, sale_price: e.target.value === "" ? null : Number(e.target.value) })} />
                  </Field>
                </div>
                {editing.price && editing.sale_price ? (
                  <p className="text-xs text-green-600">
                    Endirim: <b>-{Math.round((1 - editing.sale_price / editing.price) * 100)}%</b> · {(editing.price - editing.sale_price).toFixed(2)} AZN ucuzlaşır
                  </p>
                ) : null}
                <Field label="Əlavə endirim qiyməti (AZN) — opsional">
                  <input type="number" min="0" step="0.01" className={inp} placeholder="Admin əlavə endirim istəyəndə"
                    value={editing.extra_price ?? ""}
                    onChange={(e) => setEditing({ ...editing, extra_price: e.target.value === "" ? null : Number(e.target.value) })} />
                </Field>
                {editing.price && editing.extra_price ? (
                  <p className="text-xs text-orange-600">
                    Əlavə endirim: <b>-{Math.round((1 - editing.extra_price / editing.price) * 100)}%</b> · {(editing.price - editing.extra_price).toFixed(2)} AZN ucuzlaşır
                  </p>
                ) : null}
              </div>
              <Field label="Stok miqdarı">
                <input type="number" min="0" className={inp} value={editing.stock ?? 0} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} />
              </Field>
              <Field label="Kateqoriya">
                <select className={inp} value={editing.category_slug ?? ""} onChange={(e) => setEditing({ ...editing, category_slug: e.target.value || undefined })}>
                  <option value="">— Kateqoriya seçin —</option>
                  {cats.map((c) => <option key={c.slug} value={c.slug}>{c.is_hidden ? "🔒 " : ""}{c.name}</option>)}
                </select>
              </Field>
              <Field label="Brend">
                <select className={inp} value={editing.brand_slug ?? ""} onChange={(e) => setEditing({ ...editing, brand_slug: e.target.value || undefined })}>
                  <option value="">— Brend seçin (opsional) —</option>
                  {brands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
                </select>
              </Field>
              <Field label="Şəkillər">
                {/* Image grid */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {extraImages.map((img, i) => {
                    const url = getImageUrl(img) || img;
                    return (
                      <div key={i} className="relative group">
                        <img src={url} alt="" className={`h-20 w-20 rounded-xl object-cover border-2 transition-colors ${editing.image === img ? "border-[var(--brand)]" : "border-border"}`} />
                        <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                          {editing.image !== img && (
                            <button type="button" onClick={() => setEditing({ ...editing, image: img })}
                              className="text-[10px] font-bold text-white bg-[var(--brand)] rounded px-1.5 py-0.5">Əsas</button>
                          )}
                          {editing.image === img && (
                            <span className="text-[10px] font-bold text-white bg-[var(--brand)] rounded px-1.5 py-0.5">Əsas ✓</span>
                          )}
                          <button type="button" onClick={() => {
                            const updated = extraImages.filter((_, j) => j !== i);
                            setExtraImages(updated);
                            if (editing.image === img) setEditing({ ...editing, image: updated[0] || "" });
                          }} className="text-[10px] font-bold text-white bg-destructive rounded px-1.5 py-0.5">Sil</button>
                        </div>
                      </div>
                    );
                  })}
                  {/* Upload button */}
                  <label className="flex h-20 w-20 flex-col items-center justify-center cursor-pointer rounded-xl border-2 border-dashed border-border hover:border-[var(--brand)] transition-colors flex-shrink-0">
                    {uploading
                      ? <span className="text-xs text-muted-foreground">...</span>
                      : <><ImageIcon className="h-5 w-5 text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Əlavə et</span></>
                    }
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                </div>
                {/* Manual URL input */}
                <input className={inp} value={editing.image ?? ""} onChange={(e) => {
                  const url = e.target.value;
                  setEditing({ ...editing, image: url });
                  if (url && !extraImages.includes(url)) setExtraImages(prev => [url, ...prev.filter(x => x !== editing.image)]);
                }} placeholder="və ya URL yapışdır..." />
              </Field>
              {/* Credit settings */}
              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="text-sm font-semibold">Kredit şərtləri</div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Faizsiz kredit limiti (ay)">
                    <select className={inp} value={editing.credit_months ?? 0} onChange={(e) => setEditing({ ...editing, credit_months: Number(e.target.value) })}>
                      <option value={0}>— Məhdudiyyət yoxdur (şirkət şərtlərinə görə)</option>
                      <option value={3}>3 aya kimi faizsiz</option>
                      <option value={6}>6 aya kimi faizsiz</option>
                      <option value={9}>9 aya kimi faizsiz</option>
                      <option value={12}>12 aya kimi faizsiz</option>
                      <option value={15}>15 aya kimi faizsiz</option>
                      <option value={18}>18 aya kimi faizsiz</option>
                      <option value={24}>24 aya kimi faizsiz</option>
                      <option value={36}>36 aya kimi faizsiz</option>
                    </select>
                  </Field>
                  <Field label="Növ">
                    <select className={inp} value={editing.interest_free ?? 1} onChange={(e) => setEditing({ ...editing, interest_free: Number(e.target.value), interest_rate: Number(e.target.value) === 1 ? 0 : editing.interest_rate })}>
                      <option value={1}>Faizsiz</option>
                      <option value={0}>Faizli</option>
                    </select>
                  </Field>
                </div>
                {!editing.interest_free && (
                  <Field label="Aylıq faiz (%)">
                    <input type="number" min="0" max="20" step="0.1" className={inp} value={editing.interest_rate ?? 0}
                      onChange={(e) => setEditing({ ...editing, interest_rate: Number(e.target.value) })}
                      placeholder="Məs: 2.5" />
                  </Field>
                )}
              </div>

              {/* Komissiyasız badge */}
              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="text-sm font-semibold">Komissiyasız badge</div>
                <Field label="Komissiyasız müddət (məhsul səhifəsində göstərilir)">
                  <select className={inp} value={editing.commission_free_months ?? 0}
                    onChange={(e) => setEditing({ ...editing, commission_free_months: Number(e.target.value) })}>
                    <option value={0}>Göstərmə</option>
                    <option value={3}>3 aya komissiyasız</option>
                    <option value={6}>6 aya komissiyasız</option>
                    <option value={9}>9 aya komissiyasız</option>
                    <option value={12}>12 aya komissiyasız</option>
                    <option value={18}>18 aya komissiyasız</option>
                    <option value={24}>24 aya komissiyasız</option>
                  </select>
                </Field>
              </div>

              {/* Dəst komponentləri */}
              <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dəst tərkibi (opsional)</p>
                  <button type="button" onClick={() => {
                    setEditing(prev => {
                      if (!prev) return prev;
                      const comps: {name: string; price: number}[] = JSON.parse(prev.components || "[]");
                      return { ...prev, components: JSON.stringify([...comps, { name: "", price: 0 }]) };
                    });
                  }} className="rounded-lg bg-[var(--brand)] px-3 py-1 text-xs font-semibold text-[var(--brand-foreground)]">+ Əlavə et</button>
                </div>
                {(() => {
                  const comps: {name: string; price: number}[] = JSON.parse(editing.components || "[]");
                  if (comps.length === 0) return <p className="text-xs text-muted-foreground">Komponent yoxdur. Məhsul dəstdirsə əlavə edin.</p>;
                  return comps.map((comp, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input className="flex-1 min-w-0 rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)] transition-colors" value={comp.name} placeholder="Hissə adı (Vitrin, Kamod...)"
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditing(prev => {
                            if (!prev) return prev;
                            const c: {name: string; price: number}[] = JSON.parse(prev.components || "[]");
                            c[idx] = { ...c[idx], name: val };
                            return { ...prev, components: JSON.stringify(c) };
                          });
                        }} />
                      <div className="relative flex-shrink-0">
                        <input type="number" min="0" step="0.01" className="w-28 rounded-xl border border-border bg-background pl-3 pr-10 py-2.5 text-sm outline-none focus:border-[var(--brand)] transition-colors" value={comp.price || ""} placeholder="0"
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setEditing(prev => {
                              if (!prev) return prev;
                              const c: {name: string; price: number}[] = JSON.parse(prev.components || "[]");
                              c[idx] = { ...c[idx], price: val };
                              return { ...prev, components: JSON.stringify(c) };
                            });
                          }} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">AZN</span>
                      </div>
                      <button type="button" onClick={() => {
                        setEditing(prev => {
                          if (!prev) return prev;
                          const c: {name: string; price: number}[] = JSON.parse(prev.components || "[]");
                          return { ...prev, components: JSON.stringify(c.filter((_, i) => i !== idx)) };
                        });
                      }} className="rounded-lg p-2 text-destructive hover:bg-destructive/10">✕</button>
                    </div>
                  ));
                })()}
              </div>

              <label onClick={() => setEditing({ ...editing, is_active: editing.is_active ? 0 : 1 })}
                className={`flex items-center gap-3 cursor-pointer rounded-xl border-2 px-4 py-3 transition-all ${editing.is_active ? "border-green-500 bg-green-50" : "border-red-300 bg-red-50"}`}>
                <div className={`relative h-7 w-13 rounded-full transition-colors flex-shrink-0 ${editing.is_active ? "bg-green-500" : "bg-red-400"}`}
                  style={{width: 52}}>
                  <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${editing.is_active ? "translate-x-6" : "translate-x-0.5"}`} />
                </div>
                <div>
                  <div className={`text-sm font-bold ${editing.is_active ? "text-green-700" : "text-red-600"}`}>
                    {editing.is_active ? "✓ Aktiv — saytda görünür" : "✗ Passiv — saytda görünmür"}
                  </div>
                </div>
              </label>
              <label onClick={() => setEditing({ ...editing, in_stock: editing.in_stock === 1 ? null : 1 })}
                className={`flex items-center gap-3 cursor-pointer rounded-xl border-2 px-4 py-3 transition-all ${editing.in_stock === 1 ? "border-green-500 bg-green-50" : "border-border bg-background"}`}>
                <div className={`relative h-7 rounded-full transition-colors flex-shrink-0 ${editing.in_stock === 1 ? "bg-green-500" : "bg-secondary"}`}
                  style={{width: 52}}>
                  <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${editing.in_stock === 1 ? "translate-x-6" : "translate-x-0.5"}`} />
                </div>
                <div>
                  <div className={`text-sm font-bold ${editing.in_stock === 1 ? "text-green-700" : "text-muted-foreground"}`}>
                    {editing.in_stock === 1 ? "✓ Stokda var (məcburi)" : "Stokda var (məcburi) — söndülü"}
                  </div>
                  <div className="text-xs text-muted-foreground">Stok sayı 0 olsa belə "Stokda var" görsənsin</div>
                </div>
              </label>

              {/* Specifications */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Texniki xüsusiyyətlər</p>
                  <button type="button" onClick={() => {
                    setEditing(prev => {
                      if (!prev) return prev;
                      let specs: {group: string; label: string; value: string}[] = [];
                      try { specs = JSON.parse(prev.specifications || "[]"); } catch {}
                      return { ...prev, specifications: JSON.stringify([...specs, { group: "Ümumi", label: "", value: "" }]) };
                    });
                  }} className="rounded-lg border border-border px-2 py-1 text-xs font-semibold hover:bg-secondary">+ Əlavə et</button>
                </div>
                {(() => {
                  let specs: {group: string; label: string; value: string}[] = [];
                  try { specs = JSON.parse(editing.specifications || "[]"); } catch {}
                  return specs.map((s, i) => {
                    const update = (key: string, val: string) => {
                      setEditing(prev => {
                        if (!prev) return prev;
                        let c: {group: string; label: string; value: string}[] = [];
                        try { c = JSON.parse(prev.specifications || "[]"); } catch {}
                        c = [...c];
                        c[i] = { ...c[i], [key]: val };
                        return { ...prev, specifications: JSON.stringify(c) };
                      });
                    };
                    return (
                      <div key={i} className="flex gap-2 items-center">
                        <input value={s.group} onChange={e => update("group", e.target.value)} placeholder="Qrup (məs: Şəbəkə)"
                          className="w-28 flex-shrink-0 rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-[var(--brand)]" />
                        <input value={s.label} onChange={e => update("label", e.target.value)} placeholder="Xüsusiyyət"
                          className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-[var(--brand)]" />
                        <input value={s.value} onChange={e => update("value", e.target.value)} placeholder="Dəyər"
                          className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-[var(--brand)]" />
                        <button type="button" onClick={() => {
                          setEditing(prev => {
                            if (!prev) return prev;
                            let c: {group: string; label: string; value: string}[] = [];
                            try { c = JSON.parse(prev.specifications || "[]"); } catch {}
                            return { ...prev, specifications: JSON.stringify(c.filter((_, j) => j !== i)) };
                          });
                        }} className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10">✕</button>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Colors */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rəng variantları</p>
                  <button type="button" onClick={() => {
                    setEditing(prev => {
                      if (!prev) return prev;
                      const c: {name: string; hex: string}[] = JSON.parse(prev.colors || "[]");
                      return { ...prev, colors: JSON.stringify([...c, { name: "", hex: "#14b8a6" }]) };
                    });
                  }} className="rounded-lg border border-border px-2 py-1 text-xs font-semibold hover:bg-secondary">+ Rəng əlavə et</button>
                </div>
                {(() => {
                  const cols: {name: string; hex: string}[] = JSON.parse(editing.colors || "[]");
                  if (cols.length === 0) return <p className="text-xs text-muted-foreground">Rəng yoxdur.</p>;
                  return cols.map((col, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input type="color" value={col.hex}
                        onChange={e => {
                          const val = e.target.value;
                          setEditing(prev => {
                            if (!prev) return prev;
                            const c: {name: string; hex: string}[] = JSON.parse(prev.colors || "[]");
                            c[i] = { ...c[i], hex: val };
                            return { ...prev, colors: JSON.stringify(c) };
                          });
                        }}
                        className="h-10 w-12 cursor-pointer rounded-lg border border-border p-0.5" />
                      <input value={col.name} placeholder="Rəng adı (Qri, Krem, Ceviz...)"
                        onChange={e => {
                          const val = e.target.value;
                          setEditing(prev => {
                            if (!prev) return prev;
                            const c: {name: string; hex: string}[] = JSON.parse(prev.colors || "[]");
                            c[i] = { ...c[i], name: val };
                            return { ...prev, colors: JSON.stringify(c) };
                          });
                        }}
                        className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
                      <button type="button" onClick={() => {
                        setEditing(prev => {
                          if (!prev) return prev;
                          const c: {name: string; hex: string}[] = JSON.parse(prev.colors || "[]");
                          return { ...prev, colors: JSON.stringify(c.filter((_, j) => j !== i)) };
                        });
                      }} className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10">✕</button>
                    </div>
                  ));
                })()}
              </div>
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
