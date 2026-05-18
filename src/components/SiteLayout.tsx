import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search, Heart, ShoppingCart, Scale, User, Menu, X, ChevronRight, ArrowLeft, Shield, Home, Grid3x3 } from "lucide-react";
import { api, type Category } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { getCategoryIcon } from "@/lib/icons";
import logoChinarli from "@/assets/logo-chinarli.png";

export function SiteHeader() {
  const [catOpen, setCatOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [drillCat, setDrillCat] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeSlug, setActiveSlug] = useState("");
  const { isAdmin } = useAuth();

  useEffect(() => {
    api.getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) setActiveSlug(cats[0].slug);
    }).catch(() => {});
  }, []);

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

  const activeCategory = categories.find((c) => c.slug === activeSlug) ?? categories[0];

  return (
    <>
      {/* Top bar — desktop only */}
      <div className="hidden border-b border-border bg-secondary/40 text-sm lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
          <div className="flex items-center gap-5 text-muted-foreground">
            <Link to="/kampaniyalar" className="hover:text-foreground">Kampaniyalar</Link>
            <Link to="/magazalar" className="hover:text-foreground">Mağazalar</Link>
            <Link to="/korporativ" className="hover:text-foreground">Korporativ</Link>
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
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2">
          <Link to="/" className="flex items-center" aria-label="Chinarli Mebel">
            <img src={logoChinarli} alt="Chinarli Mebel" width={1536} height={1024} className="h-20 w-auto md:h-24 lg:h-28" />
          </Link>

          <button
            onClick={() => setCatOpen((v) => !v)}
            className="ml-4 flex items-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-[var(--brand-foreground)] hover:opacity-90"
          >
            {catOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />} Kataloq
          </button>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Məhsul axtar..."
              className="w-full rounded-lg border border-border bg-secondary/50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[var(--brand)]"
            />
          </div>

          <div className="flex items-center gap-4 text-muted-foreground">
            <Link to="/muqayise" className="flex flex-col items-center text-xs hover:text-foreground"><Scale className="h-5 w-5" />Müqayisə</Link>
            <Link to="/beyendim" className="flex flex-col items-center text-xs hover:text-foreground"><Heart className="h-5 w-5" />Bəyəndim</Link>
            <Link to="/sebet" className="flex flex-col items-center text-xs hover:text-foreground"><ShoppingCart className="h-5 w-5" />Səbət</Link>
          </div>

          <Link to="/aylik-odenis" className="flex items-center gap-1.5 rounded-lg border-2 border-[var(--brand)] px-3 py-2 text-sm font-semibold text-[var(--brand)] hover:bg-[var(--brand)]/10">
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

      {/* Mobile menu drawer — irshad.az drill-down style */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => { setMobileMenuOpen(false); setDrillCat(null); }}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-0 flex h-full w-[85%] max-w-sm flex-col bg-background shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3 flex-shrink-0">
              {drillCat ? (
                <button
                  onClick={() => setDrillCat(null)}
                  className="flex items-center gap-2 font-semibold text-base"
                >
                  <ArrowLeft className="h-5 w-5" />
                  {drillCat.name}
                </button>
              ) : (
                <img src={logoChinarli} alt="Chinarli Mebel" className="h-10 w-auto" />
              )}
              <button onClick={() => { setMobileMenuOpen(false); setDrillCat(null); }} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-secondary" aria-label="Bağla">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {drillCat ? (
                /* Sub-category view — irshad.az style with 2-column grid */
                <div className="space-y-4 px-4 py-4">
                  {(() => {
                    const DrillIconComponent = getCategoryIcon(drillCat.name);
                    return (
                      <Link
                        to="/kateqoriya/$slug"
                        params={{ slug: drillCat.slug }}
                        onClick={() => { setMobileMenuOpen(false); setDrillCat(null); }}
                        className="flex items-center gap-3 font-semibold text-[var(--brand)] text-base"
                      >
                        <DrillIconComponent className="h-6 w-6" />
                        Hamısına bax →
                      </Link>
                    );
                  })()}
                  {(() => {
                    const subs = categories.filter(s => s.parent_id === drillCat.id);
                    return subs.length > 0 ? (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        {subs.map((s) => (
                          <Link
                            key={s.slug}
                            to="/kateqoriya/$slug"
                            params={{ slug: s.slug }}
                            onClick={() => { setMobileMenuOpen(false); setDrillCat(null); }}
                            className="text-sm text-foreground hover:text-[var(--brand)]"
                          >
                            {s.name}
                          </Link>
                        ))}
                      </div>
                    ) : null;
                  })()}
                </div>
              ) : (
                /* Root view — irshad.az style with larger icons */
                <div className="space-y-2 px-4 py-3">
                  <div className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">KATEQORİYALAR</div>
                  {categories.filter(c => !c.parent_id).map((c) => {
                    const hasSubs = categories.some(s => s.parent_id === c.id);
                    const IconComponent = getCategoryIcon(c.name);
                    return hasSubs ? (
                      <button
                        key={c.slug}
                        onClick={() => setDrillCat(c)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition hover:bg-secondary"
                      >
                        <IconComponent className="h-6 w-6 flex-shrink-0 text-[var(--brand)]" />
                        <span className="flex-1">{c.name}</span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </button>
                    ) : (
                      <Link
                        key={c.slug}
                        to="/kateqoriya/$slug"
                        params={{ slug: c.slug }}
                        onClick={() => { setMobileMenuOpen(false); setDrillCat(null); }}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition hover:bg-secondary"
                      >
                        <IconComponent className="h-6 w-6 flex-shrink-0 text-[var(--brand)]" />
                        <span className="flex-1">{c.name}</span>
                      </Link>
                    );
                  })}
                  <div className="border-t border-border mt-2 pt-2">
                    {[
                      { to: "/kampaniyalar", label: "Kampaniyalar" },
                      { to: "/aylik-odenis", label: "💳 Aylıq ödəniş" },
                      { to: "/magazalar", label: "Mağazalar" },
                      { to: "/korporativ", label: "Korporativ" },
                      { to: "/haqqimizda", label: "Haqqımızda" },
                      { to: "/elaqe", label: "Əlaqə" },
                    ].map((l) => (
                      <Link key={l.to} to={l.to as any} onClick={() => { setMobileMenuOpen(false); setDrillCat(null); }} className="block border-b border-border/50 px-4 py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
                        {l.label}
                      </Link>
                    ))}
                    {isAdmin && (
                      <Link to="/admin" onClick={() => { setMobileMenuOpen(false); setDrillCat(null); }} className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[var(--brand)]">
                        <Shield className="h-4 w-4" /> Admin panel
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border/30 bg-foreground/5 px-4 py-3 text-sm flex-shrink-0">
              <a href="tel:*0171" className="font-bold text-[var(--brand)]">📞 *0171</a>
              <div className="mt-2 text-xs text-muted-foreground">🇦🇿 Azərbaycan dili</div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop catalog mega menu */}
      {catOpen && activeCategory && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setCatOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-auto mt-[140px] max-h-[calc(100vh-160px)] max-w-7xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
          >
            <div className="grid grid-cols-[260px_1fr] max-h-[calc(100vh-160px)]">
              {/* Sol: yalnız ana kateqoriyalar */}
              <div className="overflow-y-auto border-r border-border bg-secondary/30 py-2">
                {categories.filter(c => !c.parent_id).map((c) => {
                  const IconComponent = getCategoryIcon(c.name);
                  return (
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
                      <IconComponent className="h-5 w-5 flex-shrink-0" />
                      <span className="flex-1">{c.name}</span>
                      {categories.some(sub => sub.parent_id === c.id) && (
                        <ChevronRight className="h-4 w-4 opacity-40" />
                      )}
                    </button>
                  );
                })}
              </div>
              {/* Sağ: aktiv kateqoriyanın alt kateqoriyaları */}
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
                {(() => {
                  const subs = categories.filter(c => c.parent_id === activeCategory.id);
                  return subs.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {subs.map((c) => {
                        const IconComponent = getCategoryIcon(c.name);
                        return (
                          <Link
                            key={c.slug}
                            to="/kateqoriya/$slug"
                            params={{ slug: c.slug }}
                            onClick={() => setCatOpen(false)}
                            className="flex items-start gap-3 rounded-lg px-3 py-3 transition hover:bg-secondary"
                          >
                            <IconComponent className="h-6 w-6 mt-0.5 flex-shrink-0 text-[var(--brand)]" />
                            <span className="text-sm font-medium">{c.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Bu kateqoriyada alt bölmə yoxdur.</p>
                  );
                })()}
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
    <footer className="bg-[#18181a] text-white pb-20 lg:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-5">
          {/* Col 1: Logo + QR */}
          <div className="sm:col-span-1">
            <div className="mb-6 rounded-xl bg-white p-3 w-fit">
              <img src={logoChinarli} alt="Chinarli Mebel" className="h-28 w-auto" />
            </div>
            <p className="mb-6 text-sm text-gray-400">Etibarlı mebel mağazası. 24/7 dəstək.</p>
          </div>

          {/* Col 2: Şirkət */}
          <div>
            <h3 className="mb-4 font-semibold text-white text-lg">Şirkət</h3>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li><Link to="/haqqimizda" className="hover:text-[var(--brand)] transition">Haqqımızda</Link></li>
              <li><Link to="/magazalar" className="hover:text-[var(--brand)] transition">Mağazalar</Link></li>
              <li><Link to="/korporativ" className="hover:text-[var(--brand)] transition">Korporativ</Link></li>
              <li><Link to="/kampaniyalar" className="hover:text-[var(--brand)] transition">Kampaniyalar</Link></li>
              <li><Link to="/catdirilma" className="hover:text-[var(--brand)] transition">Çatdırılma qaydaları</Link></li>
            </ul>
          </div>

          {/* Col 3: Müştəri üçün */}
          <div>
            <h3 className="mb-4 font-semibold text-white text-lg">Müştəri üçün</h3>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li><Link to="/elaqe" className="hover:text-[var(--brand)] transition">Sual-Cavab</Link></li>
              <li><Link to="/aylik-odenis" className="hover:text-[var(--brand)] transition">Hissə-hissə ödəniş</Link></li>
              <li><Link to="/privacy" className="hover:text-[var(--brand)] transition">Məxfilik siyasəti</Link></li>
              <li><Link to="/geri-qaytarma" className="hover:text-[var(--brand)] transition">Geri qaytarma</Link></li>
              <li><Link to="/terms" className="hover:text-[var(--brand)] transition">İstifadə qaydaları</Link></li>
            </ul>
          </div>

          {/* Col 4: Əlaqə (Contact) */}
          <div className="sm:col-span-1">
            <h3 className="mb-4 font-semibold text-white text-lg">Əlaqə</h3>

            {/* Phone */}
            <div className="mb-6">
              <a href="tel:*0171" className="flex items-center gap-3 text-[var(--brand)] font-bold text-lg hover:opacity-80 transition">
                📞 *0171
              </a>
            </div>

            {/* Address */}
            <div className="mb-6 text-sm text-gray-400">
              <p className="mb-1">📍 Bakı, Azərbaycan</p>
              <p className="text-xs">Etibarlı mebel mağazası</p>
            </div>

            {/* Social Media */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-300 mb-3">Bizi izləyin</p>
              <div className="flex gap-2 flex-wrap">
                <a href="https://www.facebook.com/chinarli" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/10 text-white hover:bg-[var(--brand)] transition" title="Facebook">f</a>
                <a href="https://www.instagram.com/chinarli" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/10 text-white hover:bg-[var(--brand)] transition" title="Instagram">📷</a>
                <a href="https://www.youtube.com/@chinarli" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/10 text-white hover:bg-[var(--brand)] transition" title="YouTube">▶</a>
                <a href="https://api.whatsapp.com/send?phone=994777770171" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/10 text-white hover:bg-[var(--brand)] transition" title="WhatsApp">💬</a>
                <a href="https://t.me/chinarli" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/10 text-white hover:bg-[var(--brand)] transition" title="Telegram">✈</a>
              </div>
            </div>

            {/* Apps */}
            <div className="flex gap-2">
              <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-[var(--brand)] transition">Google Play</a>
              <span className="text-gray-500">·</span>
              <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-[var(--brand)] transition">App Store</a>
            </div>
          </div>
        </div>
      </div>


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
