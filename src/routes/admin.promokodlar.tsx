import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { api, type PromoCode } from "@/lib/api";
import { Plus, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/promokodlar")({
  component: AdminPromoCodes,
});

const inp = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--brand)]";

function AdminPromoCodes() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", type: "percent" as "percent" | "amount", value: "", min_order: "", max_uses: "", expires_at: "", is_active: true });
  const [saving, setSaving] = useState(false);

  const load = () => api.getPromoCodes().then(setCodes).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.code.trim() || !form.value) return toast.error("Kod və dəyər mütləqdir");
    setSaving(true);
    try {
      await api.createPromoCode({
        code: form.code.toUpperCase().trim(),
        type: form.type,
        value: Number(form.value),
        min_order: Number(form.min_order) || 0,
        max_uses: Number(form.max_uses) || 0,
        expires_at: form.expires_at || null,
        is_active: form.is_active ? 1 : 0,
      });
      toast.success("Promokod əlavə edildi");
      setShowForm(false);
      setForm({ code: "", type: "percent", value: "", min_order: "", max_uses: "", expires_at: "", is_active: true });
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const toggleActive = async (p: PromoCode) => {
    await api.updatePromoCode(p.id, { is_active: p.is_active ? 0 : 1 });
    load();
  };

  const del = async (id: number) => {
    if (!confirm("Silinsin?")) return;
    await api.deletePromoCode(id);
    toast.success("Silindi");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Promokodlar</h1>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          <Plus className="h-4 w-4" /> Yeni kod
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold">Yeni promokod</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Kod *</label>
              <input className={inp} value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="BOBIK40" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Növ</label>
              <select className={inp} value={form.type} onChange={e => setForm({...form, type: e.target.value as "percent" | "amount"})}>
                <option value="percent">Faiz (%)</option>
                <option value="amount">Məbləğ (AZN)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">{form.type === "percent" ? "Endirim (%) *" : "Endirim (AZN) *"}</label>
              <input className={inp} type="number" value={form.value} onChange={e => setForm({...form, value: e.target.value})} placeholder={form.type === "percent" ? "40" : "50"} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Min. sifariş (AZN)</label>
              <input className={inp} type="number" value={form.min_order} onChange={e => setForm({...form, min_order: e.target.value})} placeholder="0" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Maks. istifadə (0 = limitsiz)</label>
              <input className={inp} type="number" value={form.max_uses} onChange={e => setForm({...form, max_uses: e.target.value})} placeholder="0" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Bitmə tarixi</label>
              <input className={inp} type="date" value={form.expires_at} onChange={e => setForm({...form, expires_at: e.target.value})} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <div onClick={() => setForm({...form, is_active: !form.is_active})}
              className={`relative h-5 w-9 rounded-full transition-colors ${form.is_active ? "bg-green-500" : "bg-secondary"}`}>
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
            Aktiv
          </label>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="rounded-xl bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
              {saving ? "..." : "Yadda saxla"}
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-xl border border-border px-5 py-2 text-sm hover:bg-secondary">Ləğv et</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-muted-foreground">Yüklənir...</div>
      ) : codes.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">Hələ promokod yoxdur</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/40">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Kod</th>
                <th className="px-4 py-3 text-left font-semibold">Endirim</th>
                <th className="px-4 py-3 text-left font-semibold">Min. sifariş</th>
                <th className="px-4 py-3 text-left font-semibold">İstifadə</th>
                <th className="px-4 py-3 text-left font-semibold">Bitmə tarixi</th>
                <th className="px-4 py-3 text-center font-semibold">Aktiv</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {codes.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/20">
                  <td className="px-4 py-3 font-bold tracking-wider">{p.code}</td>
                  <td className="px-4 py-3 font-semibold text-[var(--brand)]">
                    {p.type === "percent" ? `${p.value}%` : `${p.value} AZN`}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.min_order > 0 ? `${p.min_order} AZN` : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.used_count}{p.max_uses > 0 ? ` / ${p.max_uses}` : ""}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.expires_at ? p.expires_at.slice(0, 10) : "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(p)}>
                      {p.is_active
                        ? <Check className="h-4 w-4 text-green-600 mx-auto" />
                        : <X className="h-4 w-4 text-muted-foreground mx-auto" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => del(p.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
