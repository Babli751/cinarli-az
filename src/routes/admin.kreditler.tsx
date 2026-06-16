import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, X, GripVertical, Upload } from "lucide-react";
import { api, getImageUrl, type CreditCompany, type CreditPlan } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/kreditler")({
  component: CreditCompaniesPage,
});

function parsePlans(raw: CreditPlan[] | string): CreditPlan[] {
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw as string); } catch { return []; }
}

function CreditCompaniesPage() {
  const [companies, setCompanies] = useState<CreditCompany[]>([]);
  const [editing, setEditing] = useState<Partial<CreditCompany> & { plans: CreditPlan[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploading(true);
    try {
      const url = await api.uploadFile(file);
      setEditing(prev => prev ? { ...prev, logo: url } : prev);
    } catch { toast.error("Yükləmə xətası"); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const load = () => api.getCreditCompaniesAll().then(setCompanies).catch(() => {});
  useEffect(() => { load(); }, []);

  const openNew = () => setEditing({ name: "", logo: "", plans: [{ months: 12, rate: 0 }], is_active: 1, position: 0 });
  const openEdit = (c: CreditCompany) => setEditing({ ...c, plans: parsePlans(c.plans) });

  const save = async () => {
    if (!editing?.name?.trim()) return toast.error("Ad mütləqdir");
    setBusy(true);
    try {
      const payload = { ...editing, plans: editing.plans };
      if (editing.id) {
        await api.updateCreditCompany(editing.id, payload);
        toast.success("Yeniləndi");
      } else {
        await api.createCreditCompany(payload);
        toast.success("Əlavə edildi");
      }
      setEditing(null);
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const del = async (id: number) => {
    if (!confirm("Silmək istəyirsiniz?")) return;
    await api.deleteCreditCompany(id);
    load();
  };

  const addPlan = () => setEditing(e => e ? { ...e, plans: [...e.plans, { months: 6, rate: 0 }] } : e);
  const updatePlan = (i: number, key: keyof CreditPlan, val: string) =>
    setEditing(e => e ? { ...e, plans: e.plans.map((p, j) => j === i ? { ...p, [key]: key === "label" ? val : Number(val) } : p) } : e);
  const removePlan = (i: number) =>
    setEditing(e => e ? { ...e, plans: e.plans.filter((_, j) => j !== i) } : e);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Kredit Şirkətləri</h1>
          <p className="text-sm text-muted-foreground mt-1">Bircard, Tamcard, Premium Kapital, İdeal və s.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 font-semibold text-[var(--brand-foreground)] hover:opacity-90">
          <Plus className="h-4 w-4" /> Yeni şirkət
        </button>
      </div>

      <div className="space-y-3">
        {companies.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Kredit şirkəti əlavə edilməyib
          </div>
        )}
        {companies.map(c => {
          const plans = parsePlans(c.plans);
          const logoUrl = c.logo ? getImageUrl(c.logo) : null;
          return (
            <div key={c.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
              <GripVertical className="h-5 w-5 text-muted-foreground/40 flex-shrink-0" />
              {logoUrl
                ? <img src={logoUrl} alt={c.name} className="h-12 w-24 flex-shrink-0 rounded-xl border border-border bg-white object-cover" />
                : <div className="h-12 w-24 flex-shrink-0 rounded-xl border border-dashed border-border bg-secondary flex items-center justify-center text-xs text-muted-foreground">Logo</div>}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{c.name}</span>
                  {c.is_active ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Aktiv</span>
                  ) : (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">Deaktiv</span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {plans.map((p, i) => (
                    <span key={i} className="rounded-lg border border-border bg-secondary/50 px-2 py-0.5 text-xs">
                      {p.months} ay{p.rate > 0 ? ` · +${p.rate}%` : " · faizsiz"}{p.label ? ` (${p.label})` : ""}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(c)} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-secondary">Düzəlt</button>
                <button onClick={() => del(c.id)} className="rounded-lg border border-destructive/30 p-1.5 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditing(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-background shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-bold">{editing.id ? "Şirkəti düzəlt" : "Yeni kredit şirkəti"}</h2>
              <button onClick={() => setEditing(null)} className="rounded-lg p-1.5 hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Şirkət adı *</label>
                <input className={inp} value={editing.name ?? ""} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="məs: Bircard" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Logo</label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <div className="flex items-center gap-3">
                  {editing.logo
                    ? <img src={getImageUrl(editing.logo) ?? undefined} alt="logo" className="h-12 w-24 object-contain rounded-xl border border-border bg-secondary" />
                    : <div className="h-12 w-24 rounded-xl border border-dashed border-border bg-secondary flex items-center justify-center text-xs text-muted-foreground">Logo yox</div>}
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50">
                    <Upload className="h-4 w-4" />
                    {uploading ? "Yüklənir..." : "Şəkil seç"}
                  </button>
                  {editing.logo && (
                    <button type="button" onClick={() => setEditing(prev => prev ? { ...prev, logo: "" } : prev)}
                      className="rounded-xl border border-destructive/30 p-2 text-destructive hover:bg-destructive/10">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tip seçimi */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">Növ</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditing({ ...editing, type: "credit" })}
                    className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition ${(editing.type ?? "credit") === "credit" ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]" : "border-border hover:bg-secondary"}`}>
                    💳 Kredit şirkəti
                  </button>
                  <button type="button" onClick={() => setEditing({ ...editing, type: "nisye" })}
                    className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition ${editing.type === "nisye" ? "border-orange-500 bg-orange-50 text-orange-700" : "border-border hover:bg-secondary"}`}>
                    🤝 Nisyə al
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setEditing({ ...editing, is_active: editing.is_active ? 0 : 1 })}
                  className={`relative h-6 w-11 rounded-full transition-colors flex-shrink-0 ${editing.is_active ? "bg-[var(--brand)]" : "bg-secondary"}`}>
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${editing.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm font-medium">Aktiv (məhsul səhifəsində görünsün)</span>
              </label>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Kredit planları</label>
                  <button onClick={addPlan} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-semibold hover:bg-secondary">
                    <Plus className="h-3 w-3" /> Plan əlavə et
                  </button>
                </div>
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="grid grid-cols-4 bg-secondary/60 px-3 py-2 text-xs font-semibold text-muted-foreground">
                    <span>Müddət (ay)</span>
                    <span>Faiz (%)</span>
                    <span>Ad (opsional)</span>
                    <span></span>
                  </div>
                  {editing.plans.map((p, i) => (
                    <div key={i} className="grid grid-cols-4 gap-2 border-t border-border px-3 py-2 items-center">
                      <input type="number" min="1" max="60" value={p.months} onChange={e => updatePlan(i, "months", e.target.value)}
                        className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-[var(--brand)]" />
                      <input type="number" min="0" step="0.1" value={p.rate} onChange={e => updatePlan(i, "rate", e.target.value)}
                        className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-[var(--brand)]"
                        placeholder="0 = faizsiz" />
                      <input type="text" value={p.label ?? ""} onChange={e => updatePlan(i, "label", e.target.value)}
                        className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-[var(--brand)]"
                        placeholder="Standart..." />
                      <button onClick={() => removePlan(i)} className="justify-self-end rounded-lg p-1.5 text-destructive hover:bg-destructive/10">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {editing.plans.length === 0 && (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">Plan əlavə edin</div>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">Faiz 0 = faizsiz/komissiyasız. Müsbət dəyər = həmin faiz üstəlik hesablanır.</p>
              </div>

              <button onClick={save} disabled={busy}
                className="w-full rounded-xl bg-[var(--brand)] py-3 font-semibold text-[var(--brand-foreground)] hover:opacity-90 disabled:opacity-50">
                {busy ? "Saxlanılır..." : editing.id ? "Yadda saxla" : "Əlavə et"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inp = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)] transition-colors";
