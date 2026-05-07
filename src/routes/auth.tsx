import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/SiteLayout";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else {
        toast.success("Daxil oldunuz");
        navigate({ to: "/admin" });
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      if (error) toast.error(error.message);
      else {
        toast.success("Qeydiyyat uğurlu! İlk istifadəçi avtomatik admin olur.");
        navigate({ to: "/admin" });
      }
    }
    setLoading(false);
  };

  return (
    <PageShell title="Admin girişi" subtitle="Mağazanı idarə etmək üçün daxil olun">
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex gap-2 rounded-lg bg-secondary p-1">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${mode === "login" ? "bg-background shadow" : ""}`}
          >Giriş</button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${mode === "signup" ? "bg-background shadow" : ""}`}
          >Qeydiyyat</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
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
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-[var(--brand)] py-3 font-semibold text-[var(--brand-foreground)] hover:opacity-90 disabled:opacity-50">
            {loading ? "..." : mode === "login" ? "Daxil ol" : "Qeydiyyatdan keç"}
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
