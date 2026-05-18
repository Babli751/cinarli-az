interface Props {
  slug: string;
  className?: string;
}

// Outline SVG icons for furniture categories
// strokeWidth=1.5, no fill — irshad.az style
const icons: Record<string, (cls: string) => JSX.Element> = {
  // Sofas / divans
  divan: (cls) => (
    <svg className={cls} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="22" width="40" height="14" rx="4" />
      <path d="M4 28h4a4 4 0 0 1 4 4v4H4v-8z" />
      <path d="M44 28h-4a4 4 0 0 0-4 4v4h8v-8z" />
      <path d="M8 22v-4a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v4" />
      <line x1="10" y1="36" x2="10" y2="42" />
      <line x1="38" y1="36" x2="38" y2="42" />
    </svg>
  ),
  // Beds / yataq
  yataq: (cls) => (
    <svg className={cls} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 32V18a2 2 0 0 1 2-2h32a2 2 0 0 1 2 2v14" />
      <rect x="2" y="30" width="44" height="8" rx="2" />
      <path d="M6 38v4M42 38v4" />
      <rect x="8" y="20" width="12" height="10" rx="2" />
      <rect x="28" y="20" width="12" height="10" rx="2" />
      <line x1="20" y1="25" x2="28" y2="25" />
    </svg>
  ),
  // Soft sets / yumşaq dəstlər
  "yumsuq-destler": (cls) => (
    <svg className={cls} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="24" width="28" height="14" rx="3" />
      <rect x="32" y="26" width="14" height="12" rx="3" />
      <path d="M2 30h4a3 3 0 0 1 3 3v5H2v-8z" />
      <path d="M30 30h-4a3 3 0 0 0-3 3v5h7v-8z" />
      <path d="M5 24v-4a3 3 0 0 1 3-3h19a3 3 0 0 1 3 3v4" />
      <line x1="6" y1="38" x2="6" y2="44" />
      <line x1="24" y1="38" x2="24" y2="44" />
      <line x1="34" y1="38" x2="34" y2="44" />
      <line x1="44" y1="38" x2="44" y2="44" />
    </svg>
  ),
  // Bedroom sets / yataq dəstləri
  "yataq-destleri": (cls) => (
    <svg className={cls} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="28" width="40" height="10" rx="2" />
      <path d="M4 38v4M44 38v4" />
      <path d="M6 28V20a2 2 0 0 1 2-2h32a2 2 0 0 1 2 2v8" />
      <rect x="8" y="22" width="10" height="6" rx="1.5" />
      <rect x="30" y="22" width="10" height="6" rx="1.5" />
      <rect x="2" y="10" width="10" height="18" rx="2" />
      <rect x="36" y="10" width="10" height="18" rx="2" />
      <line x1="7" y1="14" x2="7" y2="24" />
      <line x1="41" y1="14" x2="41" y2="24" />
    </svg>
  ),
  // Kitchen sets / mətbəx
  "metbex-destleri": (cls) => (
    <svg className={cls} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="8" width="40" height="32" rx="2" />
      <line x1="4" y1="22" x2="44" y2="22" />
      <line x1="24" y1="22" x2="24" y2="40" />
      <rect x="8" y="12" width="12" height="6" rx="1" />
      <rect x="28" y="12" width="12" height="6" rx="1" />
      <circle cx="16" cy="29" r="3" />
      <circle cx="32" cy="29" r="3" />
      <line x1="14" y1="36" x2="18" y2="36" />
      <line x1="30" y1="36" x2="34" y2="36" />
    </svg>
  ),
  // Corner sofa / künc divan
  "kunc-divan": (cls) => (
    <svg className={cls} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 44v-8a4 4 0 0 1 4-4h16v12H4z" />
      <path d="M24 32h16a4 4 0 0 1 4 4v8H24V32z" />
      <path d="M4 36h4a3 3 0 0 1 3 3v5" />
      <path d="M44 36h-4a3 3 0 0 0-3 3v5" />
      <path d="M8 32v-8a3 3 0 0 1 3-3h14v11" />
      <path d="M24 21v11" />
      <line x1="8" y1="44" x2="4" y2="48" />
      <line x1="44" y1="44" x2="44" y2="48" />
    </svg>
  ),
  // Dining table / yemek masasi
  "yemek-masasi": (cls) => (
    <svg className={cls} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="18" width="36" height="6" rx="2" />
      <line x1="12" y1="24" x2="12" y2="38" />
      <line x1="36" y1="24" x2="36" y2="38" />
      <line x1="9" y1="38" x2="15" y2="38" />
      <line x1="33" y1="38" x2="39" y2="38" />
      <path d="M16 18v-4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
    </svg>
  ),
  // Wardrobe / gardırop
  "gardirop": (cls) => (
    <svg className={cls} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="40" height="40" rx="2" />
      <line x1="24" y1="4" x2="24" y2="44" />
      <line x1="4" y1="44" x2="44" y2="44" />
      <path d="M14 20 Q16 24 14 28" />
      <path d="M34 20 Q32 24 34 28" />
      <line x1="4" y1="8" x2="44" y2="8" />
    </svg>
  ),
  // Bookshelf / kitab rəfi
  "raf": (cls) => (
    <svg className={cls} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="40" height="40" rx="2" />
      <line x1="4" y1="18" x2="44" y2="18" />
      <line x1="4" y1="32" x2="44" y2="32" />
      <line x1="14" y1="4" x2="14" y2="18" />
      <line x1="28" y1="18" x2="28" y2="32" />
      <line x1="18" y1="32" x2="18" y2="44" />
    </svg>
  ),
  // TV unit / TV stend
  "tv-stend": (cls) => (
    <svg className={cls} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="20" width="44" height="18" rx="2" />
      <line x1="16" y1="20" x2="16" y2="38" />
      <line x1="32" y1="20" x2="32" y2="38" />
      <line x1="2" y1="29" x2="16" y2="29" />
      <line x1="32" y1="29" x2="46" y2="29" />
      <line x1="10" y1="38" x2="10" y2="44" />
      <line x1="38" y1="38" x2="38" y2="44" />
      <rect x="12" y="6" width="24" height="14" rx="1.5" />
    </svg>
  ),
  // Office chair / ofis kreslası
  "ofis": (cls) => (
    <svg className={cls} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 10h20a2 2 0 0 1 2 2v14H12V12a2 2 0 0 1 2-2z" />
      <path d="M10 26h28a2 2 0 0 1 0 4H10a2 2 0 0 1 0-4z" />
      <line x1="24" y1="30" x2="24" y2="40" />
      <path d="M16 40 Q24 44 32 40" />
      <path d="M10 26v-4" />
      <path d="M38 26v-4" />
    </svg>
  ),
  // Default — generic furniture
  default: (cls) => (
    <svg className={cls} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="16" width="32" height="20" rx="3" />
      <line x1="8" y1="28" x2="40" y2="28" />
      <line x1="24" y1="16" x2="24" y2="36" />
      <line x1="12" y1="36" x2="12" y2="42" />
      <line x1="36" y1="36" x2="36" y2="42" />
      <line x1="4" y1="42" x2="44" y2="42" />
    </svg>
  ),
};

// Map slug keywords to icon keys
function resolveIconKey(slug: string): string {
  const s = slug.toLowerCase();
  if (s.includes("kunc") || s.includes("künc") || s.includes("corner")) return "kunc-divan";
  if (s.includes("divan") || s.includes("sofa") || s.includes("kreslo")) return "divan";
  if (s.includes("yataq") || s.includes("bed")) return "yataq";
  if (s.includes("metbex") || s.includes("mətbəx") || s.includes("mutfak") || s.includes("kitchen")) return "metbex-destleri";
  if (s.includes("yumsuq") || s.includes("yumşaq") || s.includes("dest") || s.includes("dəst") || s.includes("set")) return "yumsuq-destler";
  if (s.includes("gardirop") || s.includes("shkaf") || s.includes("dolap")) return "gardirop";
  if (s.includes("masa") || s.includes("table") || s.includes("yemek")) return "yemek-masasi";
  if (s.includes("raf") || s.includes("kitab") || s.includes("shelf")) return "raf";
  if (s.includes("tv") || s.includes("stend") || s.includes("media")) return "tv-stend";
  if (s.includes("ofis") || s.includes("office")) return "ofis";
  return "default";
}

export function CategoryIcon({ slug, className = "h-8 w-8" }: Props) {
  const key = resolveIconKey(slug);
  const render = icons[key] ?? icons.default;
  return render(className);
}
