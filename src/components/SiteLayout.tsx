import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search, Heart, ShoppingCart, Scale, User, Menu, X, ChevronRight, Shield, Home, Grid3x3 } from "lucide-react";
import { categories } from "@/data/catalog";
import { useAuth } from "@/hooks/useAuth";
import logoChinarli from "@/assets/logo-chinarli.png";

export function SiteHeader() {
  const [catOpen, setCatOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState(categories[0].slug);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const anyOpen = catOpen || mobileMenuOpen;
    if (!anyOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCatOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [catOpen, mobileMenuOpen]);

  const activeCategory = categories.find((c) => c.slug === activeSlug)!;

  return (
    <>
      {/* Top bar — desktop only */}
      <div className="hidden border-b border-border bg-secondary/40 text-sm lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
          <div className="flex items-center gap-5 text-muted-foreground">
            <Link to="/kampaniyalar" className="hover:text-foreground">Kampaniyalar</Link>
            <Link to="/magazalar" className="hover:text-foreground">Mağazalar</Link>
            <Link to="/korporativ" className="hover:text-foreground">Korporativ</Link>
            <span className="font-bold tracking-wider text-foreground/80">EMBAWOOD</span>
            <span className="rounded border border-border bg-background px-2 py-0.5 text-xs font-bold">IKEA</span>
            <span className="font-serif text-base italic text-foreground/80">Natuzzi</span>
            <Link to="/outlet" className="hover:text-foreground">Outlet</Link>
            <Link to="/kateqoriya/$slug" params={{ slug: "divanlar" }} className="rounded-md border border-[var(--accent-orange)] px-2 py-0.5 font-medium text-[var(--accent-orange)]">Künc divanlar</Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-bold text-[var(--brand)]">*0171</span>
            <span>🇦🇿 Azərbaycan dili</span>
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-1 rounded-md bg-[var(--brand)] px-2 py-0.5 font-semibold text-[var(--brand-foreground)]">
                <Shield className="h-3.5 w-3.5" /> Admin
              </Link>
            )}
            <Link to="/kabinet" className="flex items-center gap-1 hover:text-foreground"><User className="h-4 w-4" /> Şəxsi kabinet</Link>
          </div>
        </div>
      </div>

      {/* Header — desktop */}
      <header className="hidden border-b border-border bg-background lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
          <Link to="/" className="flex items-center" aria-label="Chinarli Mebel">
            <img src={logoChinarli} alt="Chinarli Mebel" width={1536} height={1024} className="h-20 w-auto md:h-24 lg:h-28" />
          </Link>

          <button
            onClick={() => setCatOpen((v) => !v)}
            className="ml-8 flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-3 font-semibold text-[var(--brand-foreground)] hover:opacity-90"
          >
            {catOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />} Kataloq
          </button>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Məhsul axtar..."
              className="w-full rounded-lg border border-border bg-secondary/50 py-3 pl-10 pr-4 outline-none focus:border-[var(--brand)]"
            />
          </div>

          <div className="flex items-center gap-5 text-muted-foreground">
            <Link to="/muqayise" className="flex flex-col items-center text-xs hover:text-foreground"><Scale className="h-5 w-5" />Müqayisə</Link>
            <Link to="/beyendim" className="flex flex-col items-center text-xs hover:text-foreground"><Heart className="h-5 w-5" />Bəyəndim</Link>
            <Link to="/sebet" className="flex flex-col items-center text-xs hover:text-foreground"><ShoppingCart className="h-5 w-5" />Səbət</Link>
          </div>

          <Link to="/aylik-odenis" className="flex items-center gap-2 rounded-lg border-2 border-[var(--brand)] px-4 py-3 font-semibold text-[var(--brand)] hover:bg-[var(--brand)]/10">
            💳 Aylıq ödəniş
          </Link>
        </div>
      </header>

      {/* Header — mobile/tablet */}
      <header className="sticky top-0 z-40 border-b border-border bg-background lg:hidden">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-lg text-foreground hover:bg-secondary"
            aria-label="Menyu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link to="/" className="flex flex-1 items-center justify-center" aria-label="Chinarli Mebel">
            <img src={logoChinarli} alt="Chinarli Mebel" className="h-20 w-auto sm:h-24" />
          </Link>

          <button
            onClick={() => setMobileSearchOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-lg text-foreground hover:bg-secondary"
            aria-label="Axtar"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link to="/sebet" className="grid h-10 w-10 place-items-center rounded-lg text-foreground hover:bg-secondary" aria-label="Səbət">
            <ShoppingCart className="h-5 w-5" />
          </Link>
        </div>

        {mobileSearchOpen && (
          <div className="border-t border-border px-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Məhsul axtar..."
                autoFocus
                className="w-full rounded-lg border border-border bg-secondary/50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--brand)]"
              />
            </div>
          </div>
        )}
      </header>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-0 flex h-full w-[85%] max-w-sm flex-col bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <img src={logoChinarli} alt="Chinarli Mebel" className="h-10 w-auto" />
              <button onClick={() => setMobileMenuOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-secondary" aria-label="Bağla">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Kateqoriyalar</p>
                <div className="space-y-0.5">
                  {categories.map((c) => (
                    <Link
                      key={c.slug}
                      to="/kateqoriya/$slug"
                      params={{ slug: c.slug }}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-secondary"
                    >
                      <span className="text-xl">{c.icon}</span>
                      <span className="flex-1">{c.name}</span>
                      <ChevronRight className="h-4 w-4 opacity-40" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="border-t border-border px-4 py-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Menyu</p>
                <div className="space-y-0.5">
                  {[
                    { to: "/kampaniyalar", label: "Kampaniyalar" },
                    { to: "/yeni", label: "Yeni məhsullar" },
                    { to: "/outlet", label: "Outlet" },
                    { to: "/aylik-odenis", label: "💳 Aylıq ödəniş" },
                    { to: "/magazalar", label: "Mağazalar" },
                    { to: "/korporativ", label: "Korporativ" },
                    { to: "/catdirilma", label: "Çatdırılma" },
                    { to: "/geri-qaytarma", label: "Geri qaytarma" },
                    { to: "/haqqimizda", label: "Haqqımızda" },
                    { to: "/elaqe", label: "Əlaqə" },
                  ].map((l) => (
                    <Link key={l.to} to={l.to as any} onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm hover:bg-secondary">
                      {l.label}
                    </Link>
                  ))}
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 rounded-lg bg-[var(--brand)]/10 px-3 py-2.5 text-sm font-semibold text-[var(--brand)]">
                      <Shield className="h-4 w-4" /> Admin panel
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-border px-4 py-3 text-sm">
              <a href="tel:*0171" className="font-bold text-[var(--brand)]">📞 *0171</a>
              <p className="mt-1 text-xs text-muted-foreground">🇦🇿 Azərbaycan dili</p>
            </div>
          </div>
        </div>
      )}

      {/* Desktop catalog mega menu */}
      {catOpen && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setCatOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-auto mt-[140px] max-h-[calc(100vh-160px)] max-w-7xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
          >
            <div className="grid grid-cols-[260px_1fr] max-h-[calc(100vh-160px)]">
              <div className="overflow-y-auto border-r border-border bg-secondary/30 py-2">
                {categories.map((c) => (
                  <button
                    key={c.slug}
                    onMouseEnter={() => setActiveSlug(c.slug)}
                    onClick={() => setActiveSlug(c.slug)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
                      activeSlug === c.slug
                        ? "bg-background font-semibold text-[var(--brand)]"
                        : "hover:bg-background/60"
                    }`}
                  >
                    <span className="text-xl">{c.icon}</span>
                    <span className="flex-1">{c.name}</span>
                    <ChevronRight className="h-4 w-4 opacity-40" />
                  </button>
                ))}
              </div>
              <div className="overflow-y-auto p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{activeCategory.name}</h3>
                    <p className="text-sm text-muted-foreground">{activeCategory.description}</p>
                  </div>
                  <Link
                    to="/kateqoriya/$slug"
                    params={{ slug: activeCategory.slug }}
                    onClick={() => setCatOpen(false)}
                    className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--brand-foreground)] hover:opacity-90"
                  >
                    Hamısına bax →
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {categories.map((c) => (
                    <Link
                      key={c.slug}
                      to="/kateqoriya/$slug"
                      params={{ slug: c.slug }}
                      onClick={() => setCatOpen(false)}
                      className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition hover:border-[var(--brand)] hover:shadow-md"
                    >
                      <span className="text-4xl">{c.icon}</span>
                      <span className="text-xs font-medium group-hover:text-[var(--brand)]">{c.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function MobileBottomNav() {
  const items = [
    { to: "/" as const, icon: Home, label: "Ana" },
    { to: "/kateqoriya/$slug" as const, params: { slug: "divanlar" }, icon: Grid3x3, label: "Kataloq" },
    { to: "/sebet" as const, icon: ShoppingCart, label: "Səbət" },
    { to: "/beyendim" as const, icon: Heart, label: "Bəyəndim" },
    { to: "/kabinet" as const, icon: User, label: "Kabinet" },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur lg:hidden">
      <div className="grid grid-cols-5">
        {items.map((it) => {
          const Icon = it.icon;
          const props = "params" in it ? { to: it.to, params: it.params } as const : { to: it.to } as const;
          return (
            <Link
              key={it.label}
              {...props}
              className="flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] text-muted-foreground hover:text-[var(--brand)] [&.active]:text-[var(--brand)]"
              activeProps={{ className: "text-[var(--brand)]" }}
              activeOptions={{ exact: it.to === "/" }}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/30 pb-20 lg:pb-0">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <div className="mb-3">
            <img src={logoChinarli} alt="Chinarli Mebel" className="h-14 w-auto md:h-20" />
          </div>
          <p className="text-sm text-muted-foreground">Etibarlı mebel mağazası. 24/7 dəstək.</p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Şirkət</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/haqqimizda">Haqqımızda</Link></li>
            <li><Link to="/magazalar">Mağazalar</Link></li>
            <li><Link to="/korporativ">Korporativ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Kömək</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/catdirilma">Çatdırılma</Link></li>
            <li><Link to="/geri-qaytarma">Geri qaytarma</Link></li>
            <li><Link to="/elaqe">Əlaqə</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Əlaqə</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>*0171</li><li>info@chinarlimebel.az</li><li>Bakı, Azərbaycan</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">© 2026 Chinarli Mebel</div>
      <MobileBottomNav />
    </footer>
  );
}

export function PageShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        <h1 className="text-2xl font-black md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">{subtitle}</p>}
        <div className="mt-6 md:mt-8">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
