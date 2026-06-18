import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { api, type Store } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/magazalar")({
  component: StoresAdmin,
});

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  class?: string;
}

// AZ bounding box — excludes occupied territories geometrically
const AZ_BOUNDS = { minLat: 38.4, maxLat: 41.9, minLng: 44.8, maxLng: 50.4 };

function inBounds(r: NominatimResult) {
  const lat = parseFloat(r.lat), lng = parseFloat(r.lon);
  return lat >= AZ_BOUNDS.minLat && lat <= AZ_BOUNDS.maxLat &&
         lng >= AZ_BOUNDS.minLng && lng <= AZ_BOUNDS.maxLng;
}

async function searchAddresses(query: string, city: string): Promise<NominatimResult[]> {
  try {
    const q = city ? `${query}, ${city}, Azərbaycan` : `${query}, Azərbaycan`;
    const params = new URLSearchParams({
      q,
      format: "json",
      limit: "6",
      countrycodes: "az",
      addressdetails: "0",
      viewbox: "44.8,41.9,50.4,38.4",
      bounded: "1",
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { "Accept-Language": "az,ru" },
    });
    const data: NominatimResult[] = await res.json();
    return data.filter(inBounds);
  } catch { return []; }
}

function Autocomplete({
  label, placeholder, value, onChange, onSelect, searchFn,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSelect: (r: NominatimResult) => void;
  searchFn: (v: string) => Promise<NominatimResult[]>;
}) {
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (v: string) => {
    onChange(v);
    if (timer.current) clearTimeout(timer.current);
    if (v.trim().length < 2) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      const data = await searchFn(v);
      setResults(data);
      setOpen(data.length > 0);
      setLoading(false);
    }, 400);
  };

  const pick = (r: NominatimResult) => {
    onChange(r.display_name.split(",")[0].trim());
    onSelect(r);
    setOpen(false);
    setResults([]);
  };

  return (
    <div ref={wrapRef} className="relative">
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="relative">
        <input
          className={inp}
          placeholder={placeholder}
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-xl border border-border bg-background shadow-lg overflow-hidden">
          {results.map((r, i) => {
            const parts = r.display_name.split(",");
            const main = parts[0].trim();
            const sub = parts.slice(1, 3).join(", ").trim();
            return (
              <button key={i} type="button" onMouseDown={() => pick(r)}
                className="w-full px-3 py-2.5 text-left hover:bg-secondary transition-colors border-b border-border last:border-0">
                <div className="text-sm font-medium">{main}</div>
                {sub && <div className="text-xs text-muted-foreground truncate">{sub}</div>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StoresAdmin() {
  const [items, setItems] = useState<Store[]>([]);
  const [editing, setEditing] = useState<Partial<Store> | null>(null);
  const [coordFound, setCoordFound] = useState(false);

  const load = () => api.getStores().then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);

  const openEdit = (s: Store) => {
    setEditing(s);
    setCoordFound(!!(s.lat && s.lng));
  };

  const openNew = () => {
    setEditing({ phone: "+994 50 707 22 21", hours: "10:00 — 22:00" });
    setCoordFound(false);
  };

  const save = async () => {
    if (!editing?.name) return toast.error("Ad mütləqdir");
    try {
      if (editing.id) {
        await api.updateStore(editing.id, editing);
      } else {
        await api.createStore(editing);
      }
      toast.success("Saxlanıldı");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Mağazanı silmək istədiyinizə əminsiniz?")) return;
    await api.deleteStore(id);
    toast.success("Silindi");
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">Mağazalar</h1>
          <p className="text-muted-foreground">{items.length} mağaza</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2.5 font-semibold text-[var(--brand-foreground)] hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Yeni mağaza
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <div key={s.id} className="rounded-2xl border border-border bg-background p-4 shadow-sm">
            {s.city && <div className="text-xs font-semibold uppercase tracking-wider text-[var(--brand)] mb-1">{s.city}</div>}
            <div className="font-bold">{s.name}</div>
            <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              {s.address && <div>📍 {s.address}</div>}
              {s.phone && <div>📞 {s.phone}</div>}
              {s.hours && <div>🕐 {s.hours}</div>}
              {s.lat && s.lng && <div className="text-green-600">📌 Xəritədə var</div>}
            </div>
            <div className="mt-3 flex gap-1.5">
              <button onClick={() => openEdit(s)} className="rounded-lg p-2 hover:bg-secondary transition-colors"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => remove(s.id)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-3 py-12 text-center text-muted-foreground">Mağaza yoxdur</div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-background shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-xl font-bold">{editing.id ? "Mağazanı redaktə et" : "Yeni mağaza"}</h2>
              <button onClick={() => setEditing(null)} className="rounded-lg p-1.5 hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Mağaza adı *</label>
                <input className={inp} placeholder="Çınarlı Gənclik Mall"
                  value={editing.name ?? ""}
                  onChange={e => setEditing({ ...editing, name: e.target.value })} />
              </div>

              <Autocomplete
                label="Şəhər / Rayon / Ünvan"
                placeholder="Bakı, N.Nərimanov küç., İmişli..."
                value={editing.address ?? ""}
                onChange={v => setEditing(prev => prev ? { ...prev, address: v } : prev)}
                searchFn={v => searchAddresses(v, "")}
                onSelect={r => {
                  const parts = r.display_name.split(",");
                  const short = parts[0].trim();
                  const city = parts.find(p => /rayon|şəhər|city|district/i.test(p))?.trim() ?? parts[1]?.trim() ?? "";
                  setEditing(prev => prev ? {
                    ...prev,
                    address: short,
                    city: prev.city || city,
                    lat: parseFloat(r.lat),
                    lng: parseFloat(r.lon),
                  } : prev);
                  setCoordFound(true);
                }}
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium">Telefon</label>
                <input className={inp} placeholder="+994 50 707 22 21"
                  value={editing.phone ?? ""}
                  onChange={e => setEditing({ ...editing, phone: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">İş saatları</label>
                <input className={inp} placeholder="10:00 — 22:00"
                  value={editing.hours ?? ""}
                  onChange={e => setEditing({ ...editing, hours: e.target.value })} />
              </div>

              <div className={`rounded-xl px-3 py-2 text-xs flex items-center gap-2 ${coordFound ? "bg-green-50 text-green-700" : "bg-secondary/40 text-muted-foreground"}`}>
                {coordFound
                  ? <>✓ Xəritədə tapıldı — mağaza xəritədə görünəcək</>
                  : <>📍 Şəhər və ya ünvan yazıb dropdown-dan seçin</>}
              </div>
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
