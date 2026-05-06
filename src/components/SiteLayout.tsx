import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search, Heart, ShoppingCart, Scale, User, Menu, X, ChevronRight } from "lucide-react";
import { categories, products } from "@/data/catalog";

export function SiteHeader() {
  const [catOpen, setCatOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState(categories[0].slug);

  useEffect(() => {
    if (!catOpen) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setCatOpen(false);
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [catOpen]);

  const activeCategory = categories.find((c) => c.slug === activeSlug)!;
  const activeProducts = products.filter((p) => p.category === activeSlug).slice(0, 8);

  return (
    <>
      {/* Top bar */}
      <div className="border-b border-border bg-secondary/40 text-sm">
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
            <Link to="/kabinet" className="flex items-center gap-1 hover:text-foreground"><User className="h-4 w-4" /> Şəxsi kabinet</Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex flex-col items-start rounded-lg border-2 border-[var(--brand)] bg-[var(--brand)]/5 px-3 py-1.5 leading-none">
              <span className="text-lg font-black text-[var(--brand)]">mebel</span>
              <span className="-mt-0.5 text-lg font-black italic text-[var(--accent-orange)]">mart</span>
            </div>
          </Link>

          <button
            onClick={() => setCatOpen((v) => !v)}
            className="ml-2 flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-3 font-semibold text-[var(--brand-foreground)] hover:opacity-90"
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
                  {activeProducts.map((p) => (
                    <Link
                      key={p.name}
                      to="/kateqoriya/$slug"
                      params={{ slug: p.category }}
                      onClick={() => setCatOpen(false)}
                      className="group rounded-xl border border-border bg-card p-3 transition hover:border-[var(--brand)] hover:shadow-md"
                    >
                      <div className="grid h-20 place-items-center text-4xl">{p.img}</div>
                      <div className="mt-2 line-clamp-2 text-xs font-medium group-hover:text-[var(--brand)]">{p.name}</div>
                      <div className="mt-1 text-sm font-bold">{p.price} ₼</div>
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

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded bg-[var(--brand)] font-black text-[var(--brand-foreground)]">M</div>
            <span className="font-extrabold">MebelMart</span>
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
            <li>*0171</li><li>info@mebelmart.az</li><li>Bakı, Azərbaycan</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">© 2026 MebelMart</div>
    </footer>
  );
}

export function PageShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-3xl font-black md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
