import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Search, Heart, ShoppingCart, Scale, User, Menu, X, ChevronRight, Shield, Home, Grid3x3 } from "lucide-react";
import { api, getImageUrl, type Category, type Product } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { CategoryIcon } from "@/components/CategoryIcon";
import logoManqo from "@/assets/logo-manqo.png";

interface SearchResult {
  id: number;
  name: string;
  price: number;
  image: string;
  compLabel?: string; // "Fiona Yataq Dəsti — Termo"
}

function useProductSearch() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.getProducts({ active: true }).then(setAllProducts).catch(() => {});
  }, []);

  const results: SearchResult[] = query.trim().length >= 2 ? (() => {
    const q = query.toLowerCase();
    const seen = new Set<string>();
    const out: SearchResult[] = [];

    for (const p of allProducts) {
      if (out.length >= 8) break;
      // direct name match
      if (p.name.toLowerCase().includes(q)) {
        const key = `p-${p.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          const active = p.extra_price ?? p.sale_price ?? p.price;
          out.push({ id: p.id!, name: p.name, price: active, image: p.image });
        }
      }
      // component match
      try {
        const comps: { name: string; price: number }[] = JSON.parse(p.components || "[]");
        for (const c of comps) {
          if (out.length >= 8) break;
          if (c.name.toLowerCase().includes(q)) {
            const key = `c-${p.id}-${c.name}`;
            if (!seen.has(key)) {
              seen.add(key);
              out.push({ id: p.id!, name: c.name, price: c.price, image: p.image, compLabel: `${p.name} — ${c.name}` });
            }
          }
        }
      } catch {}
    }
    return out;
  })() : [];

  return { query, setQuery, results, open, setOpen };
}

function AppInstallModal({ onClose, deferredPrompt, isInstalled }: { onClose: () => void; deferredPrompt: any; isInstalled: boolean }) {
  const [tab, setTab] = useState<"ios" | "android">("ios");

  const installAndroid = async () => {
    if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; onClose(); }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-2xl bg-background border border-border shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 bg-[var(--brand)] px-5 py-4">
          <img src="/favicon.jpg" alt="" className="h-10 w-10 rounded-xl flex-shrink-0" />
          <div className="flex-1">
            <div className="font-bold text-white text-base leading-tight">Manqo tətbiqini yüklə</div>
            <div className="text-xs text-white/70">Ana ekrana əlavə et</div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex border-b border-border">
          <button onClick={() => setTab("ios")}
            className={`flex-1 py-3 text-sm font-semibold transition ${tab === "ios" ? "border-b-2 border-[var(--brand)] text-[var(--brand)]" : "text-muted-foreground"}`}>
            🍎 iPhone / iPad
          </button>
          <button onClick={() => setTab("android")}
            className={`flex-1 py-3 text-sm font-semibold transition ${tab === "android" ? "border-b-2 border-[var(--brand)] text-[var(--brand)]" : "text-muted-foreground"}`}>
            🤖 Android
          </button>
        </div>
        <div className="px-5 py-5">
          {tab === "ios" ? (
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-white text-xs font-bold">1</span>
                <span>Safari ilə <strong>manqo.az</strong> saytını açın</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-white text-xs font-bold">2</span>
                <span>Aşağıdakı <strong>Paylaş</strong> düyməsinə basın <span className="text-lg">⬆️</span></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-white text-xs font-bold">3</span>
                <span><strong>"Ana Ekrana əlavə et"</strong> seçin → <strong>Əlavə et</strong></span>
              </li>
            </ol>
          ) : (
            <div className="space-y-4 text-sm">
              {deferredPrompt ? (
                <>
                  <p className="text-muted-foreground">Aşağıdakı düyməyə basın:</p>
                  <button onClick={installAndroid}
                    className="w-full rounded-xl bg-[var(--brand)] py-3 font-bold text-white text-base">
                    Quraşdır
                  </button>
                </>
              ) : isInstalled ? (
                <div className="text-center space-y-3">
                  <div className="text-4xl">✅</div>
                  <p className="font-bold text-base">Tətbiq artıq quraşdırılıb!</p>
                  <p className="text-muted-foreground text-xs">Ana ekranda Manqo ikonuna basın</p>
                  <a href="https://manqo.az" target="_blank" rel="noreferrer"
                    className="block w-full rounded-xl bg-[var(--brand)] py-3 font-bold text-white text-base text-center">
                    Tətbiqi aç
                  </a>
                </div>
              ) : (
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-white text-xs font-bold">1</span>
                    <span>Chrome menyusunu açın <strong>⋮</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-white text-xs font-bold">2</span>
                    <span><strong>"Ana ekrana əlavə et"</strong> seçin</span>
                  </li>
                </ol>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AppInstallButton() {
  const promptRef = useRef<any>(null);
  const isIos = /iphone|ipad|ipod/i.test(typeof navigator !== "undefined" ? navigator.userAgent : "");

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); promptRef.current = e; };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleClick = async () => {
    if (isIos) {
      window.location.href = "/manqo.mobileconfig";
      return;
    }
    if (promptRef.current) {
      promptRef.current.prompt();
      await promptRef.current.userChoice;
    }
  };

  return (
    <button onClick={handleClick} title="Tətbiqi yüklə"
      className="flex-shrink-0 flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 transition px-2.5 py-1">
      <img src="/favicon.jpg" alt="" className="h-5 w-5 rounded-full flex-shrink-0" />
      <span className="text-[11px] font-bold text-white hidden sm:inline">Tətbiqi yüklə</span>
    </button>
  );
}

export function SiteHeader() {
  const navigate = useNavigate();
  const [catOpen, setCatOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const ds = useProductSearch();
  const ms = useProductSearch();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeSlug, setActiveSlug] = useState("");
  const { isAdmin } = useAuth();
  const { count: cartCount } = useCart();
  const [compareCount, setCompareCount] = useState(0);

  useEffect(() => {
    api.getCompare().then(list => setCompareCount(list.length)).catch(() => {});
  }, []);

  useEffect(() => {
    api.getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) setActiveSlug(cats[0].slug);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(e.target as Node)) ds.setOpen(false);
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) ms.setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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
      {/* Announcement bar */}
      <div className="w-full py-2.5 text-center relative flex items-center justify-center px-3" style={{background: "linear-gradient(90deg, #1e293b 0%, #0f4c81 50%, #1e293b 100%)"}}>
        <span className="text-base font-black uppercase tracking-widest text-yellow-400">★ Bizdən Sərfəlisi Yoxdur ★</span>
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <AppInstallButton />
        </div>
      </div>

      {/* Top bar — desktop only */}
      <div className="hidden border-b border-border bg-secondary/40 text-sm lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
          <div className="flex items-center gap-5 text-muted-foreground">
            <Link to="/kampaniyalar" className="hover:text-foreground">Kampaniyalar</Link>
            <Link to="/magazalar" className="hover:text-foreground">Mağazalar</Link>
            <Link to="/korporativ" className="hover:text-foreground">Korporativ</Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-bold text-[var(--brand)]">+994 50 707 22 21</span>
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
          <Link to="/" className="flex items-center" aria-label="Manqo">
            <img src={logoManqo} alt="Manqo" className="h-20 w-auto md:h-24 lg:h-28" />
          </Link>

          <button
            onClick={() => setCatOpen((v) => !v)}
            className="ml-4 flex items-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-[var(--brand-foreground)] hover:opacity-90"
          >
            {catOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />} Kataloq
          </button>

          <div className="relative flex-1" ref={desktopSearchRef}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Məhsul axtar..."
              value={ds.query}
              onChange={e => { ds.setQuery(e.target.value); ds.setOpen(true); }}
              onFocus={() => ds.setOpen(true)}
              onKeyDown={e => {
                if (e.key === "Enter" && ds.query.trim().length >= 1) {
                  navigate({ to: "/axtar", search: { q: ds.query.trim() } });
                  ds.setQuery(""); ds.setOpen(false);
                }
                if (e.key === "Escape") ds.setOpen(false);
              }}
              className="w-full rounded-lg border border-border bg-secondary/50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[var(--brand)]"
            />
            {ds.open && ds.results.length > 0 && (
              <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border border-border bg-background shadow-xl overflow-hidden">
                {ds.results.map(p => {
                  const url = getImageUrl(p.image);
                  return (
                    <Link key={p.id} to="/mehsul/$slug" params={{ slug: String(p.id) }}
                      onClick={() => { ds.setQuery(""); ds.setOpen(false); }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/60 transition-colors">
                      <div className="h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden border border-border bg-secondary">
                        {url ? <img src={url} alt="" className="h-full w-full object-contain" /> : <div className="flex h-full w-full items-center justify-center text-lg">{p.image || "📦"}</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium">{p.compLabel ?? p.name}</div>
                        <div className="text-xs text-[var(--brand)] font-semibold">{p.price} AZN</div>
                      </div>
                    </Link>
                  );
                })}
                <Link to="/axtar" search={{ q: ds.query.trim() }}
                  onClick={() => { ds.setQuery(""); ds.setOpen(false); }}
                  className="flex items-center justify-center gap-2 border-t border-border px-4 py-2.5 text-sm font-medium text-[var(--brand)] hover:bg-secondary/40 transition-colors">
                  Bütün nəticələrə bax →
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-muted-foreground">
            <Link to="/muqayise" className="relative flex flex-col items-center text-xs hover:text-foreground">
              <Scale className="h-5 w-5" />
              {compareCount > 0 && <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">{compareCount}</span>}
              Müqayisə
            </Link>
            <Link to="/beyendim" className="flex flex-col items-center text-xs hover:text-foreground"><Heart className="h-5 w-5" />Bəyəndim</Link>
            <Link to="/sebet" className="relative flex flex-col items-center text-xs hover:text-foreground">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">{cartCount}</span>}
              Səbət
            </Link>
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

          <Link to="/" className="flex flex-1 items-center justify-center" aria-label="Manqo">
            <img src={logoManqo} alt="Manqo" className="h-12 w-auto sm:h-14"  />
          </Link>

          <button
            onClick={() => setMobileSearchOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-lg text-foreground hover:bg-secondary"
            aria-label="Axtar"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link to="/muqayise" className="relative grid h-10 w-10 place-items-center rounded-lg text-foreground hover:bg-secondary" aria-label="Müqayisə">
            <Scale className="h-5 w-5" />
            {compareCount > 0 && <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">{compareCount}</span>}
          </Link>
          <Link to="/sebet" className="relative grid h-10 w-10 place-items-center rounded-lg text-foreground hover:bg-secondary" aria-label="Səbət">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">{cartCount}</span>}
          </Link>
        </div>

        {mobileSearchOpen && (
          <div className="border-t border-border px-3 py-2">
            <div className="relative" ref={mobileSearchRef}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Məhsul axtar..."
                autoFocus
                value={ms.query}
                onChange={e => { ms.setQuery(e.target.value); ms.setOpen(true); }}
                onKeyDown={e => {
                  if (e.key === "Enter" && ms.query.trim().length >= 1) {
                    navigate({ to: "/axtar", search: { q: ms.query.trim() } });
                    ms.setQuery(""); ms.setOpen(false); setMobileSearchOpen(false);
                  }
                  if (e.key === "Escape") { ms.setOpen(false); setMobileSearchOpen(false); }
                }}
                className="w-full rounded-lg border border-border bg-secondary/50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--brand)]"
              />
              {ms.open && ms.results.length > 0 && (
                <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border border-border bg-background shadow-xl overflow-hidden">
                  {ms.results.map(p => {
                    const url = getImageUrl(p.image);
                    return (
                      <Link key={p.id} to="/mehsul/$slug" params={{ slug: String(p.id) }}
                        onClick={() => { ms.setQuery(""); ms.setOpen(false); setMobileSearchOpen(false); }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/60 transition-colors">
                        <div className="h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden border border-border bg-secondary">
                          {url ? <img src={url} alt="" className="h-full w-full object-contain" /> : <div className="flex h-full w-full items-center justify-center text-lg">{p.image || "📦"}</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm font-medium">{p.name}</div>
                          <div className="text-xs text-[var(--brand)] font-semibold">{p.price} AZN</div>
                        </div>
                      </Link>
                    );
                  })}
                  <Link to="/axtar" search={{ q: ms.query.trim() }}
                    onClick={() => { ms.setQuery(""); ms.setOpen(false); setMobileSearchOpen(false); }}
                    className="flex items-center justify-center gap-2 border-t border-border px-4 py-2.5 text-sm font-medium text-[var(--brand)] hover:bg-secondary/40 transition-colors">
                    Bütün nəticələrə bax →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile menu drawer — irshad.az drill-down style */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => { setMobileMenuOpen(false); }}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-0 flex h-full w-[85%] max-w-sm flex-col bg-background shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3 flex-shrink-0">
              <img src={logoManqo} alt="Manqo" className="h-10 w-auto" />
              <button onClick={() => setMobileMenuOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-secondary" aria-label="Bağla">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {(
                /* Root view — always show parent cats, click goes directly to page */
                <div>
                  {categories.filter(c => !c.parent_id).map((c) => (
                    <Link
                      key={c.slug}
                      to="/kateqoriya/$slug"
                      params={{ slug: c.slug }}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-4 border-b border-border/50 px-4 py-3.5 text-sm hover:bg-secondary"
                    >
                      <CategoryIcon slug={c.slug} className="h-7 w-7 flex-shrink-0 text-foreground" />
                      <span className="flex-1 font-medium">{c.name}</span>
                    </Link>
                  ))}
                  <div className="border-t border-border mt-2 pt-2">
                    {[
                      { to: "/kampaniyalar", label: "Kampaniyalar" },
                      { to: "/aylik-odenis", label: "💳 Aylıq ödəniş" },
                      { to: "/magazalar", label: "Mağazalar" },
                      { to: "/korporativ", label: "Korporativ" },
                      { to: "/haqqimizda", label: "Haqqımızda" },
                      { to: "/elaqe", label: "Əlaqə" },
                    ].map((l) => (
                      <Link key={l.to} to={l.to as any} onClick={() => { setMobileMenuOpen(false); }} className="block border-b border-border/50 px-4 py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
                        {l.label}
                      </Link>
                    ))}
                    {isAdmin && (
                      <Link to="/admin" onClick={() => { setMobileMenuOpen(false); }} className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[var(--brand)]">
                        <Shield className="h-4 w-4" /> Admin panel
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border px-4 py-3 text-sm flex-shrink-0">
              <a href="tel:+994507072221" className="font-bold text-[var(--brand)]">📞 +994 50 707 22 21</a>
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
                {categories.filter(c => !c.parent_id).map((c) => (
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
                    <CategoryIcon slug={c.slug} className="h-6 w-6 flex-shrink-0" />
                    <span className="flex-1">{c.name}</span>
                    {categories.some(sub => sub.parent_id === c.id) && (
                      <ChevronRight className="h-4 w-4 opacity-40" />
                    )}
                  </button>
                ))}
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
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {subs.map((c) => (
                        <Link
                          key={c.slug}
                          to="/kateqoriya/$slug"
                          params={{ slug: c.slug }}
                          onClick={() => setCatOpen(false)}
                          className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition hover:border-[var(--brand)] hover:shadow-md"
                        >
                          <span className="text-xs font-medium group-hover:text-[var(--brand)]">{c.name}</span>
                        </Link>
                      ))}
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
  const { user } = useAuth();
  const { items: cartItems } = useCart();
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  const navItems = [
    { to: "/" as const, icon: Home, label: "Ana" },
    { to: "/kateqoriya/$slug" as const, params: { slug: "mebel-bazari" }, icon: Grid3x3, label: "Kataloq" },
    { to: "/sebet" as const, icon: ShoppingCart, label: "Səbət" },
    { to: "/beyendim" as const, icon: Heart, label: "Bəyəndim" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur lg:hidden">
      <div className="grid grid-cols-5">
        {navItems.map((it) => {
          const Icon = it.icon;
          const props = "params" in it ? { to: it.to, params: it.params } as const : { to: it.to } as const;
          const isSabet = it.to === "/sebet";
          return (
            <Link
              key={it.label}
              {...props}
              className="relative flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] text-muted-foreground hover:text-[var(--brand)] [&.active]:text-[var(--brand)]"
              activeProps={{ className: "text-[var(--brand)]" }}
              activeOptions={{ exact: it.to === "/" }}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {isSabet && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand)] text-[9px] font-bold text-white">{cartCount > 9 ? "9+" : cartCount}</span>
                )}
              </div>
              <span className="font-medium">{it.label}</span>
            </Link>
          );
        })}

        {/* Kabinet — user info göstər */}
        <Link
          to="/kabinet"
          className="flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] text-muted-foreground hover:text-[var(--brand)] [&.active]:text-[var(--brand)]"
          activeProps={{ className: "text-[var(--brand)]" }}
        >
          {user ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand)] text-white text-[9px] font-bold">
              {user.full_name ? user.full_name[0].toUpperCase() : user.email[0].toUpperCase()}
            </div>
          ) : (
            <User className="h-5 w-5" />
          )}
          <span className="font-medium max-w-[56px] truncate">
            {user ? (user.role === "admin" ? "Admin" : (user.full_name?.split(" ")[0] || "Kabinet")) : "Kabinet"}
          </span>
        </Link>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-[#18181a] text-white pb-20 lg:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-2 md:grid-cols-5">
          {/* Col 1: Logo + QR — desktop only */}
          <div className="hidden sm:block sm:col-span-1">
            <div className="mb-6 rounded-xl bg-white p-3 w-fit">
              <img src={logoManqo} alt="Manqo" className="h-28 w-auto" />
            </div>
            <p className="mb-6 text-sm text-gray-400">Onlayn Ticarət Mərkəzi. 24/7 dəstək.</p>
          </div>

          {/* Col 2: Şirkət */}
          <div>
            <h3 className="mb-3 font-semibold text-white text-sm md:text-lg">Şirkət</h3>
            <ul className="space-y-2 text-xs md:text-sm text-gray-400">
              <li><Link to="/haqqimizda" className="hover:text-[var(--brand)] transition">Haqqımızda</Link></li>
              <li><Link to="/magazalar" className="hover:text-[var(--brand)] transition">Mağazalar</Link></li>
              <li><Link to="/korporativ" className="hover:text-[var(--brand)] transition">Korporativ</Link></li>
              <li><Link to="/kampaniyalar" className="hover:text-[var(--brand)] transition">Kampaniyalar</Link></li>
              <li><Link to="/catdirilma" className="hover:text-[var(--brand)] transition">Çatdırılma qaydaları</Link></li>
            </ul>
          </div>

          {/* Col 3: Müştəri üçün */}
          <div>
            <h3 className="mb-3 font-semibold text-white text-sm md:text-lg">Müştəri üçün</h3>
            <ul className="space-y-2 text-xs md:text-sm text-gray-400">
              <li><Link to="/elaqe" className="hover:text-[var(--brand)] transition">Sual-Cavab</Link></li>
              <li><Link to="/aylik-odenis" className="hover:text-[var(--brand)] transition">Hissə-hissə ödəniş</Link></li>
              <li><Link to="/privacy" className="hover:text-[var(--brand)] transition">Məxfilik siyasəti</Link></li>
              <li><Link to="/geri-qaytarma" className="hover:text-[var(--brand)] transition">Geri qaytarma</Link></li>
              <li><Link to="/terms" className="hover:text-[var(--brand)] transition">İstifadə qaydaları</Link></li>
            </ul>
          </div>

          {/* Col 4: Əlaqə (Contact) */}
          <div className="sm:col-span-1">
            <h3 className="mb-3 font-semibold text-white text-sm md:text-lg">Əlaqə</h3>

            <div className="flex flex-col gap-2">
              {/* WhatsApp */}
              <a href="https://wa.me/994507072221" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-[#25D366] px-3 py-2 text-white hover:bg-[#1ebe5d] transition w-fit">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-sm font-semibold">WhatsApp</span>
              </a>

              {/* Instagram */}
              <a href="https://www.instagram.com/manqo.az" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] px-3 py-2 text-white hover:opacity-90 transition w-fit">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span className="text-sm font-semibold">Instagram</span>
              </a>

              {/* TikTok */}
              <a href="https://www.tiktok.com/@manqo.az" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-black border border-white/20 px-3 py-2 text-white hover:bg-white/10 transition w-fit">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
                </svg>
                <span className="text-sm font-semibold">TikTok</span>
              </a>

              {/* Facebook */}
              <a href="https://www.facebook.com/manqo.az" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-[#1877F2] px-3 py-2 text-white hover:bg-[#1464d8] transition w-fit">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-sm font-semibold">Facebook</span>
              </a>
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
