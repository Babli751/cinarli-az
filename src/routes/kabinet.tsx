import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageShell } from "@/components/SiteLayout";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { api, type Order, type Product, type Address } from "@/lib/api";
import { getImageUrl } from "@/lib/api";
import {
  User, Package, Heart, Scale, MapPin, LogOut,
  Plus, Pencil, Trash2, X, Star, Check, ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/kabinet")({
  head: () => ({ meta: [{ title: "Şəxsi kabinet — Çınarlı" }] }),
  component: KabinetPage,
});

type Tab = "profil" | "sifarisler" | "beyendiklerim" | "muqayise" | "unvanlar";

function KabinetPage() {
  const { user, isAdmin, loading, login, register, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("profil");

  useEffect(() => {
    if (!loading && isAdmin) navigate({ to: "/admin" });
  }, [loading, isAdmin]);

  const submit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const u = await login(email, password);
        toast.success("Xoş gəldiniz!");
        if (u.role === "admin") navigate({ to: "/admin" });
      } else {
        await register(email, password, fullName);
        toast.success("Qeydiyyat tamamlandı!");
      }
    } catch (err: any) {
      toast.error(err.message || "Xəta baş verdi");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Çıxış edildi");
  };

  if (loading) {
    return <PageShell title="Şəxsi kabinet"><div className="text-muted-foreground">Yüklənir...</div></PageShell>;
  }

  if (user) {
    const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
      { id: "profil", label: "Profil", icon: User },
      { id: "sifarisler", label: "Sifarişlərim", icon: Package },
      { id: "beyendiklerim", label: "Bəyəndiklərim", icon: Heart },
      { id: "muqayise", label: "Müqayisə", icon: Scale },
      { id: "unvanlar", label: "Ünvanlar", icon: MapPin },
    ];

    return (
      <PageShell title="Şəxsi kabinet" subtitle={user.email}>
        <div className="grid gap-4 md:gap-6 md:grid-cols-[260px_1fr]">
          <aside className="rounded-2xl border border-border bg-card p-3">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors mb-0.5 ${
                  tab === t.id
                    ? "bg-[var(--brand)] text-[var(--brand-foreground)]"
                    : "hover:bg-secondary"
                }`}
              >
                <t.icon className="h-4 w-4 flex-shrink-0" />
                {t.label}
                {tab !== t.id && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-40" />}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Çıxış
            </button>
          </aside>

          <div className="min-h-[400px]">
            {tab === "profil" && <ProfilTab user={user} onUpdate={(u) => setUser?.(u)} />}
            {tab === "sifarisler" && <SifarislerTab />}
            {tab === "beyendiklerim" && <BeyendiklerimTab />}
            {tab === "muqayise" && <MuqayiseTab />}
            {tab === "unvanlar" && <UnvanlarTab />}
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Şəxsi kabinet" subtitle="Hesabınıza daxil olun və ya qeydiyyatdan keçin.">
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex gap-2 rounded-lg bg-secondary p-1">
          <button type="button" onClick={() => setMode("login")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${mode === "login" ? "bg-background shadow" : ""}`}>
            Daxil ol
          </button>
          <button type="button" onClick={() => setMode("signup")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${mode === "signup" ? "bg-background shadow" : ""}`}>
            Qeydiyyat
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="mb-1 block text-sm font-medium">Ad Soyad</label>
              <input required value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-[var(--brand)]" />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-[var(--brand)]" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Şifrə</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-[var(--brand)]" />
          </div>
          <button type="submit" disabled={busy}
            className="w-full rounded-lg bg-[var(--brand)] py-3 font-semibold text-[var(--brand-foreground)] hover:opacity-90 disabled:opacity-50">
            {busy ? "..." : mode === "login" ? "Daxil ol" : "Qeydiyyatdan keç"}
          </button>
        </form>
        <Link to="/" className="mt-4 block text-center text-sm text-[var(--brand)]">← Ana səhifəyə qayıt</Link>
      </div>
    </PageShell>
  );
}

// ─── PROFIL TAB ─────────────────────────────────────────
function ProfilTab({ user, onUpdate }: { user: any; onUpdate?: (u: any) => void }) {
  const [name, setName] = useState(user.full_name || "");
  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const payload: any = { full_name: name };
      if (newPwd) {
        if (!curPwd) { toast.error("Mövcud şifrəni daxil edin"); setBusy(false); return; }
        payload.password = curPwd;
        payload.new_password = newPwd;
      }
      const { user: updated } = await api.updateProfile(payload);
      onUpdate?.(updated);
      toast.success("Profil yeniləndi");
      setCurPwd(""); setNewPwd("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="mb-5 text-lg font-bold">Profil məlumatları</h2>
      <div className="space-y-4 max-w-sm">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Ad Soyad</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Email</label>
          <input value={user.email} disabled
            className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm opacity-60" />
        </div>
        <hr className="border-border" />
        <p className="text-sm font-semibold text-muted-foreground">Şifrə dəyişmə (istəyə görə)</p>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Mövcud şifrə</label>
          <input type="password" value={curPwd} onChange={(e) => setCurPwd(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Yeni şifrə</label>
          <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]" />
        </div>
        <button onClick={save} disabled={busy}
          className="rounded-xl bg-[var(--brand)] px-6 py-2.5 text-sm font-semibold text-[var(--brand-foreground)] hover:opacity-90 disabled:opacity-50">
          {busy ? "..." : "Yadda saxla"}
        </button>
      </div>
    </div>
  );
}

// ─── SIFARISLER TAB ──────────────────────────────────────
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: "Gözləyir",    color: "bg-yellow-100 text-yellow-800" },
  confirmed:  { label: "Təsdiqləndi", color: "bg-blue-100 text-blue-800" },
  shipped:    { label: "Yolda",       color: "bg-purple-100 text-purple-800" },
  delivered:  { label: "Çatdırıldı",  color: "bg-green-100 text-green-800" },
  cancelled:  { label: "Ləğv edildi", color: "bg-red-100 text-red-800" },
};

function SifarislerTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyOrders().then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rounded-2xl border border-border bg-card p-6 text-muted-foreground">Yüklənir...</div>;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="mb-5 text-lg font-bold">Sifarişlərim</h2>
      {orders.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">Hələ sifarişiniz yoxdur</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const st = STATUS_LABELS[o.status] ?? { label: o.status, color: "bg-gray-100 text-gray-800" };
            const items = (() => { try { return JSON.parse(o.items); } catch { return []; } })();
            return (
              <div key={o.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">Sifariş #{o.id}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{o.created_at?.slice(0, 10)}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.color}`}>{st.label}</span>
                </div>
                {items.length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {items.map((it: any) => `${it.name} × ${it.qty}`).join(", ")}
                  </div>
                )}
                <div className="mt-2 font-bold">{o.total.toFixed(2)} ₼</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── BEYENDIKLERIM TAB ───────────────────────────────────
function BeyendiklerimTab() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWishlist().then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const remove = async (id: number) => {
    await api.removeFromWishlist(id).catch(() => {});
    setItems((p) => p.filter((x) => x.id !== id));
    toast.success("Silindi");
  };

  if (loading) return <div className="rounded-2xl border border-border bg-card p-6 text-muted-foreground">Yüklənir...</div>;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="mb-5 text-lg font-bold">Bəyəndiklərim</h2>
      {items.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">Bəyəndiyiniz məhsul yoxdur</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((p) => {
            const img = getImageUrl(p.image);
            return (
              <div key={p.id} className="relative rounded-xl border border-border bg-background overflow-hidden group">
                <button onClick={() => remove(p.id)}
                  className="absolute right-2 top-2 z-10 grid h-6 w-6 place-items-center rounded-full bg-background/80 text-destructive hover:bg-destructive hover:text-white transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
                <Link to="/mehsul/$slug" params={{ slug: String(p.id) }}>
                  <div className="aspect-square bg-secondary overflow-hidden">
                    {img
                      ? <img src={img} alt={p.name} className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300" />
                      : <div className="flex h-full items-center justify-center text-4xl">{p.image || "📦"}</div>
                    }
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-semibold line-clamp-2">{p.name}</div>
                    <div className="mt-1 font-bold text-[var(--brand)]">{p.price.toFixed(2)} ₼</div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MUQAYISE TAB ────────────────────────────────────────
function MuqayiseTab() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCompare().then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const remove = async (id: number) => {
    await api.removeFromCompare(id).catch(() => {});
    setItems((p) => p.filter((x) => x.id !== id));
  };

  if (loading) return <div className="rounded-2xl border border-border bg-card p-6 text-muted-foreground">Yüklənir...</div>;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="mb-1 text-lg font-bold">Müqayisə</h2>
      <p className="mb-5 text-sm text-muted-foreground">Maksimum 4 məhsul müqayisə edilə bilər</p>
      {items.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">Müqayisəyə əlavə edilmiş məhsul yoxdur</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <td className="w-32 text-xs text-muted-foreground pb-3">Xüsusiyyət</td>
                {items.map((p) => {
                  const img = getImageUrl(p.image);
                  return (
                    <th key={p.id} className="pb-3 px-2 text-left font-semibold min-w-[140px]">
                      <div className="relative">
                        <button onClick={() => remove(p.id)}
                          className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-destructive text-white">
                          <X className="h-3 w-3" />
                        </button>
                        <div className="aspect-square w-24 rounded-lg bg-secondary overflow-hidden">
                          {img
                            ? <img src={img} alt={p.name} className="h-full w-full object-contain" />
                            : <div className="flex h-full items-center justify-center text-3xl">{p.image || "📦"}</div>
                          }
                        </div>
                        <div className="mt-1.5 text-xs font-semibold line-clamp-2">{p.name}</div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { label: "Qiymət", fn: (p: Product) => `${p.price.toFixed(2)} ₼` },
                { label: "Endirim", fn: (p: Product) => p.discount ? `${p.discount}%` : "—" },
                { label: "Stok", fn: (p: Product) => p.stock > 0 ? `${p.stock} ədəd` : "Yoxdur" },
                { label: "Kateqoriya", fn: (p: Product) => p.category_slug || "—" },
              ].map((row) => (
                <tr key={row.label}>
                  <td className="py-2.5 pr-3 text-xs text-muted-foreground font-medium">{row.label}</td>
                  {items.map((p) => (
                    <td key={p.id} className="py-2.5 px-2 text-xs">{row.fn(p)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── UNVANLAR TAB ────────────────────────────────────────
function UnvanlarTab() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Address> | null>(null);

  const load = () => api.getAddresses().then(setAddresses).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.address) return toast.error("Ünvan mütləqdir");
    try {
      if (editing.id) {
        await api.updateAddress(editing.id, editing);
      } else {
        await api.createAddress(editing);
      }
      toast.success("Saxlanıldı");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const remove = async (id: number) => {
    await api.deleteAddress(id);
    toast.success("Silindi");
    load();
  };

  const setDefault = async (addr: Address) => {
    await api.updateAddress(addr.id, { ...addr, is_default: 1 });
    load();
  };

  if (loading) return <div className="rounded-2xl border border-border bg-card p-6 text-muted-foreground">Yüklənir...</div>;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold">Ünvanlar</h2>
        <button onClick={() => setEditing({ title: "", address: "", city: "", is_default: 0 })}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--brand-foreground)] hover:opacity-90">
          <Plus className="h-4 w-4" /> Yeni ünvan
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">Ünvan əlavə edilməyib</div>
      ) : (
        <div className="space-y-3">
          {addresses.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-3 rounded-xl border border-border p-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--brand)]" />
                <div>
                  {a.title && <div className="font-semibold text-sm">{a.title}</div>}
                  <div className="text-sm text-muted-foreground">{a.address}</div>
                  {a.city && <div className="text-xs text-muted-foreground">{a.city}</div>}
                  {a.is_default === 1 && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      <Check className="h-3 w-3" /> Əsas ünvan
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {a.is_default !== 1 && (
                  <button onClick={() => setDefault(a)} title="Əsas et"
                    className="rounded-lg p-2 hover:bg-secondary transition-colors text-muted-foreground">
                    <Star className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => setEditing(a)} className="rounded-lg p-2 hover:bg-secondary transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove(a.id)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-bold">{editing.id ? "Ünvanı redaktə et" : "Yeni ünvan"}</h2>
              <button onClick={() => setEditing(null)} className="rounded-lg p-1.5 hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Başlıq (məs: Ev, İş)</label>
                <input className={inp} placeholder="Ev" value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Ünvan *</label>
                <input className={inp} placeholder="Neftçilər pr. 123, m. 45" value={editing.address ?? ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Şəhər</label>
                <input className={inp} placeholder="Bakı" value={editing.city ?? ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={editing.is_default === 1} onChange={(e) => setEditing({ ...editing, is_default: e.target.checked ? 1 : 0 })} className="h-4 w-4 accent-[var(--brand)]" />
                Əsas ünvan kimi təyin et
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
