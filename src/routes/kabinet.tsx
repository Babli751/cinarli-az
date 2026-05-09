import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/SiteLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Package, Heart, Scale, MapPin, LogOut, Shield } from "lucide-react";

export const Route = createFileRoute("/kabinet")({
  head: () => ({ meta: [{ title: "Şəxsi kabinet — MebelMart" }] }),
  component: KabinetPage,
});

function KabinetPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Xoş gəldiniz!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/kabinet`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Qeydiyyat tamamlandı!");
      }
    } catch (err: any) {
      toast.error(err.message || "Xəta baş verdi");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("Çıxış edildi");
  };

  if (loading) {
    return <PageShell title="Şəxsi kabinet"><div className="text-muted-foreground">Yüklənir...</div></PageShell>;
  }

  if (user) {
    return (
      <PageShell title="Şəxsi kabinet" subtitle={user.email ?? ""}>
        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          <aside className="rounded-2xl border border-border bg-card p-4">
            {[
              { icon: User, t: "Profil" },
              { icon: Package, t: "Sifarişlərim" },
              { icon: Heart, t: "Bəyəndiklərim" },
              { icon: Scale, t: "Müqayisə" },
              { icon: MapPin, t: "Ünvanlar" },
            ].map((i) => (
              <div key={i.t} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-secondary">
                <i.icon className="h-4 w-4 text-[var(--brand)]" /> {i.t}
              </div>
            ))}
            {isAdmin && (
              <button
                onClick={() => navigate({ to: "/admin" })}
                className="mt-2 flex w-full items-center gap-3 rounded-lg bg-[var(--brand)]/10 px-3 py-2 text-sm font-semibold text-[var(--brand)]"
              >
                <Shield className="h-4 w-4" /> Admin panel
              </button>
            )}
            <button
              onClick={logout}
              className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" /> Çıxış
            </button>
          </aside>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold">Salam, {user.user_metadata?.full_name || user.email}!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Hesabınıza xoş gəldiniz. Sifarişlərinizi və profil məlumatlarınızı buradan idarə edə bilərsiniz.
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Şəxsi kabinet" subtitle="Hesabınıza daxil olun və ya qeydiyyatdan keçin.">
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex gap-2 rounded-lg bg-secondary p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${mode === "login" ? "bg-background shadow" : ""}`}
          >Daxil ol</button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${mode === "signup" ? "bg-background shadow" : ""}`}
          >Qeydiyyat</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="mb-1 block text-sm font-medium">Ad Soyad</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-[var(--brand)]"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-[var(--brand)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Şifrə</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-[var(--brand)]"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-[var(--brand)] py-3 font-semibold text-[var(--brand-foreground)] hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "..." : mode === "login" ? "Daxil ol" : "Qeydiyyatdan keç"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          İlk qeydiyyatdan keçən istifadəçi avtomatik admin olur.
        </p>
        <Link to="/" className="mt-4 block text-center text-sm text-[var(--brand)]">← Ana səhifəyə qayıt</Link>
      </div>
    </PageShell>
  );
}
