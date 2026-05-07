import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Package, Tag, ShoppingBag, Users, LogOut } from "lucide-react";
import { useEffect } from "react";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/mehsullar", label: "Məhsullar", icon: Package },
  { to: "/admin/kateqoriyalar", label: "Kateqoriyalar", icon: Tag },
  { to: "/admin/sifarisler", label: "Sifarişlər", icon: ShoppingBag },
  { to: "/admin/istifadeciler", label: "İstifadəçilər", icon: Users },
] as const;

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading) return <div className="grid min-h-screen place-items-center">Yüklənir...</div>;
  if (!user) return null;
  if (!isAdmin)
    return (
      <div className="grid min-h-screen place-items-center p-8 text-center">
        <div>
          <h1 className="text-2xl font-bold">İcazəniz yoxdur</h1>
          <p className="mt-2 text-muted-foreground">Bu səhifə yalnız adminlərə açıqdır.</p>
          <Link to="/" className="mt-4 inline-block text-[var(--brand)]">← Ana səhifə</Link>
        </div>
      </div>
    );

  return (
    <div className="flex min-h-screen bg-secondary/20">
      <aside className="w-64 border-r border-border bg-background">
        <Link to="/" className="flex items-center gap-2 border-b border-border px-5 py-4">
          <div className="grid h-8 w-8 place-items-center rounded bg-[var(--brand)] font-black text-[var(--brand-foreground)]">M</div>
          <span className="font-extrabold">Admin Panel</span>
        </Link>
        <nav className="p-3">
          {items.map((it) => {
            const active = path === it.to;
            return (
              <Link key={it.to} to={it.to}
                className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-[var(--brand)] text-[var(--brand-foreground)]" : "hover:bg-secondary"
                }`}>
                <it.icon className="h-4 w-4" /> {it.label}
              </Link>
            );
          })}
          <button onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}
            className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10">
            <LogOut className="h-4 w-4" /> Çıxış
          </button>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
