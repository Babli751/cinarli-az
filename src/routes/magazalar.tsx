import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PageShell } from "@/components/SiteLayout";
import { MapPin, Phone, Clock } from "lucide-react";
import { api, type Store } from "@/lib/api";
import "leaflet/dist/leaflet.css";

export const Route = createFileRoute("/magazalar")({
  head: () => ({ meta: [{ title: "Mağazalar — Manqo" }, { name: "description", content: "Manqo mağaza şəbəkəsi və ünvanları." }] }),
  component: Magazalar,
});

const PULSE_STYLE = `
  .store-dot { position:relative; width:20px; height:20px; }
  .store-dot-inner { position:absolute; inset:3px; background:#14b8a6; border-radius:50%; border:2px solid #fff; box-shadow:0 0 0 1px #14b8a6; z-index:1; }
  .store-dot-ring { position:absolute; inset:0; border-radius:50%; background:#14b8a6; opacity:0.5; animation:storePulse 1.8s ease-out infinite; }
  @keyframes storePulse { 0%{transform:scale(0.5);opacity:0.7} 100%{transform:scale(2.2);opacity:0} }
`;

function StoreMap({ stores, selected, onSelect }: { stores: Store[]; selected: number | null; onSelect: (id: number | null) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<Record<number, import("leaflet").Marker>>({});

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    if (!document.getElementById("store-pulse-css")) {
      const style = document.createElement("style");
      style.id = "store-pulse-css";
      style.textContent = PULSE_STYLE;
      document.head.appendChild(style);
    }

    import("leaflet").then(L => {
      const map = L.map(mapRef.current!, { zoomControl: true, scrollWheelZoom: false });
      leafletMap.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const mappable = stores.filter(s => s.lat != null && s.lng != null);

      map.setView([40.4, 47.5], 7);

      if (mappable.length === 0) return;

      const pulseIcon = L.divIcon({
        className: "",
        html: `<div class="store-dot"><div class="store-dot-ring"></div><div class="store-dot-inner"></div></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -12],
      });

      mappable.forEach(s => {
        const marker = L.marker([s.lat!, s.lng!], { icon: pulseIcon })
          .addTo(map)
          .bindPopup(
            `<strong style="font-size:13px">${s.name}</strong>${s.city ? `<br/><span style="color:#14b8a6;font-size:11px">${s.city}</span>` : ""}${s.address ? `<br/><span style="font-size:11px">${s.address}</span>` : ""}${s.phone ? `<br/><span style="font-size:11px">${s.phone}</span>` : ""}`,
            { closeButton: false, maxWidth: 200 }
          );
        marker.on("click", () => onSelect(s.id === selected ? null : s.id));
        markersRef.current[s.id] = marker;
      });

    });

    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
      markersRef.current = {};
    };
  }, [stores]);

  useEffect(() => {
    if (!leafletMap.current) return;
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      if (Number(id) === selected) {
        marker.openPopup();
      } else {
        marker.closePopup();
      }
    });
  }, [selected]);

  return <div ref={mapRef} style={{ height: 340 }} className="w-full rounded-2xl overflow-hidden" />;
}

function Magazalar() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => { api.getStores().then(setStores).catch(() => {}); }, []);

  const mappable = stores.filter(s => s.lat != null && s.lng != null);

  return (
    <PageShell title="Mağazalar" subtitle="Yaxınlıqdakı mağazanı seçin.">
      <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <StoreMap stores={stores} selected={selected} onSelect={setSelected} />
        {mappable.length === 0 && (
          <div className="px-5 py-3 text-xs text-muted-foreground border-t border-border">
            Mağaza ünvanları xəritədə göstərilmək üçün koordinat tələb edir.
          </div>
        )}
      </div>

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
