import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/SiteLayout";
import { MapPin, Phone, Clock } from "lucide-react";
import { api, type Store } from "@/lib/api";

export const Route = createFileRoute("/magazalar")({
  head: () => ({ meta: [{ title: "Mağazalar — Manqo" }, { name: "description", content: "Manqo mağaza şəbəkəsi və ünvanları." }] }),
  component: Magazalar,
});

// Azerbaijan bounding box: lat 38.4–41.9, lng 44.8–50.4
const MAP_LAT_MIN = 38.4, MAP_LAT_MAX = 41.9;
const MAP_LNG_MIN = 44.8, MAP_LNG_MAX = 50.4;
const SVG_W = 600, SVG_H = 300;

function latLngToSvg(lat: number, lng: number) {
  const x = ((lng - MAP_LNG_MIN) / (MAP_LNG_MAX - MAP_LNG_MIN)) * SVG_W;
  const y = SVG_H - ((lat - MAP_LAT_MIN) / (MAP_LAT_MAX - MAP_LAT_MIN)) * SVG_H;
  return { x, y };
}

function Magazalar() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => { api.getStores().then(setStores).catch(() => {}); }, []);

  const mappable = stores.filter(s => s.lat != null && s.lng != null);
  const selectedStore = stores.find(s => s.id === selected);

  return (
    <PageShell title="Mağazalar" subtitle="Yaxınlıqdakı mağazanı seçin.">
      {/* SVG xəritə */}
      {mappable.length > 0 && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ background: "#e8f4f8" }}>
            {/* Azərbaycan ölkə fonu */}
            <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="#e8f4f8" rx="0" />
            {/* Sadə ölkə outline — approximate polygon */}
            <path
              d="M72,220 L85,210 L90,195 L110,185 L125,175 L140,168 L158,162 L172,155 L185,148 L200,140 L215,132 L230,125 L248,118 L262,110 L275,105 L288,100 L300,96 L315,92 L328,88 L342,85 L356,82 L368,80 L380,78 L392,77 L404,76 L416,78 L428,82 L438,88 L446,96 L452,106 L455,118 L453,130 L448,142 L440,154 L430,164 L418,172 L405,178 L390,182 L374,185 L358,186 L342,186 L326,185 L310,183 L294,180 L278,178 L262,177 L246,178 L230,180 L214,184 L198,190 L182,197 L166,205 L150,213 L134,220 L118,226 L102,230 L88,232 L76,230 Z"
              fill="#c8e6c9" stroke="#81c784" strokeWidth="1.5"
            />
            {/* Xəzər dənizi */}
            <ellipse cx="530" cy="130" rx="55" ry="120" fill="#bbdefb" opacity="0.6" />
            <text x="520" y="135" fontSize="10" fill="#1565c0" textAnchor="middle" fontWeight="500">Xəzər</text>

            {/* Mağaza nöqtələri */}
            {mappable.map(s => {
              const { x, y } = latLngToSvg(s.lat!, s.lng!);
              const isSelected = selected === s.id;
              return (
                <g key={s.id} onClick={() => setSelected(s.id === selected ? null : s.id)} style={{ cursor: "pointer" }}>
                  {/* Pulse ring */}
                  {isSelected && (
                    <circle cx={x} cy={y} r="16" fill="none" stroke="#14b8a6" strokeWidth="2" opacity="0.5">
                      <animate attributeName="r" from="8" to="22" dur="1.2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.7" to="0" dur="1.2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {/* Outer glow */}
                  <circle cx={x} cy={y} r="10" fill={isSelected ? "#14b8a6" : "#fff"} stroke={isSelected ? "#0d9488" : "#14b8a6"} strokeWidth="2" />
                  {/* Inner dot */}
                  <circle cx={x} cy={y} r="4" fill={isSelected ? "#fff" : "#14b8a6"}>
                    {!isSelected && (
                      <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
                    )}
                  </circle>
                  {/* Label */}
                  <text x={x} y={y - 14} textAnchor="middle" fontSize="9" fontWeight="600" fill="#1e293b"
                    style={{ pointerEvents: "none", userSelect: "none" }}>
                    {s.city || s.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Seçilmiş mağaza info */}
          {selectedStore && (
            <div className="border-t border-border px-5 py-4 bg-[var(--brand)]/5 flex items-start gap-3">
              <MapPin className="h-5 w-5 text-[var(--brand)] flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm">{selectedStore.name}</div>
                {selectedStore.city && <div className="text-xs text-[var(--brand)] font-semibold">{selectedStore.city}</div>}
                <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  {selectedStore.address && <div>{selectedStore.address}</div>}
                  {selectedStore.phone && <div>{selectedStore.phone}</div>}
                  {selectedStore.hours && <div>{selectedStore.hours}</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mağaza kartları */}
      {stores.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">Hələ mağaza əlavə edilməyib</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((s) => (
            <div key={s.id}
              onClick={() => setSelected(s.id === selected ? null : s.id)}
              className={`rounded-2xl border bg-card p-5 cursor-pointer transition-all ${selected === s.id ? "border-[var(--brand)] shadow-md ring-1 ring-[var(--brand)]/30" : "border-border hover:border-[var(--brand)]/50"}`}>
              {s.city && <div className="text-xs font-semibold uppercase tracking-wider text-[var(--brand)]">{s.city}</div>}
              <h3 className="mt-1 text-lg font-bold">{s.name}</h3>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                {s.address && <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {s.address}</div>}
                {s.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {s.phone}</div>}
                {s.hours && <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {s.hours}</div>}
              </div>
              {s.lat && s.lng && (
                <div className="mt-3 flex items-center gap-1 text-xs text-[var(--brand)] font-medium">
                  <span className="inline-block h-2 w-2 rounded-full bg-[var(--brand)] animate-pulse" />
                  Xəritədə var
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
