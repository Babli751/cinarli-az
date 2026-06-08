import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Package, Tag, ShoppingBag, Users, LogOut, Megaphone, MapPin, Star, Menu, X, Award, Image, CreditCard, Ticket } from "lucide-react";
import { useEffect, useState } from "react";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/mehsullar", label: "Məhsullar", icon: Package },
  { to: "/admin/kateqoriyalar", label: "Kateqoriyalar", icon: Tag },
  { to: "/admin/brendler", label: "Brendlər", icon: Award },
  { to: "/admin/bannerler", label: "Bannerlər", icon: Image },
  { to: "/admin/kampaniyalar", label: "Kampaniyalar", icon: Megaphone },
  { to: "/admin/heftenin-teklifi", label: "Həftənin teklifi", icon: Star },
  { to: "/admin/kreditler", label: "Kredit şirkətləri", icon: CreditCard },
  { to: "/admin/promokodlar", label: "Promokodlar", icon: Ticket },
  { to: "/admin/sifarisler", label: "Sifarişlər", icon: ShoppingBag },
  { to: "/admin/magazalar", label: "Mağazalar", icon: MapPin },
  { to: "/admin/istifadeciler", label: "İstifadəçilər", icon: Users },
] as const;

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, logout } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const NavItems = ({ onClose }: { onClose?: () => void }) => (
    <>
      {items.map((it) => {
        const active = path === it.to;
        return (
          <Link key={it.to} to={it.to} onClick={onClose}
            className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active ? "bg-[var(--brand)] text-[var(--brand-foreground)]" : "hover:bg-secondary"
            }`}>
            <it.icon className="h-4 w-4 flex-shrink-0" /> {it.label}
          </Link>
        );
      })}
      <button onClick={() => { logout(); navigate({ to: "/auth" }); }}
        className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10">
        <LogOut className="h-4 w-4" /> Çıxış
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-secondary/20">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background px-4 py-3 lg:hidden">
        <button onClick={() => setDrawerOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-secondary">
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-extrabold">Admin Panel</span>
        <Link to="/" className="text-xs text-[var(--brand)]">Sayta keç</Link>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-0 flex h-full w-72 flex-col bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="font-extrabold">Admin Panel</span>
              <button onClick={() => setDrawerOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3">
              <NavItems onClose={() => setDrawerOpen(false)} />
            </nav>
            <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">{user.email}</div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 flex-shrink-0 border-r border-border bg-background lg:block lg:min-h-screen">
          <Link to="/" className="flex items-center gap-2 border-b border-border px-5 py-4">
            <div className="grid h-8 w-8 place-items-center rounded bg-[var(--brand)] font-black text-[var(--brand-foreground)]">A</div>
            <span className="font-extrabold">Admin Panel</span>
          </Link>
          <nav className="p-3">
            <NavItems />
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
