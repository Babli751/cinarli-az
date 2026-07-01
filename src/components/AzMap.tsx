import { useState } from "react";
import type { Store } from "@/lib/api";

// Azerbaijan approximate bounding box:
// lng: 44.7 – 50.7, lat: 38.4 – 41.9
// SVG viewBox: 0 0 600 350
const LNG_MIN = 44.7, LNG_MAX = 50.7;
const LAT_MIN = 38.4, LAT_MAX = 41.9;
const VW = 600, VH = 350;

function toSvg(lat: number, lng: number) {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * VW;
  const y = VH - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * VH;
  return { x, y };
}

// Simplified Azerbaijan mainland SVG path (approximate polygon)
const AZ_PATH =
  "M 95,160 L 110,140 L 130,125 L 160,110 L 185,100 L 210,95 L 240,90 L 270,88 L 300,85 L 330,82 L 360,80 L 390,78 L 420,80 L 450,85 L 475,92 L 495,105 L 510,118 L 520,132 L 525,148 L 522,165 L 515,180 L 500,195 L 480,208 L 455,218 L 430,225 L 400,230 L 370,232 L 340,230 L 310,228 L 280,226 L 250,222 L 220,218 L 192,210 L 168,200 L 148,188 L 128,175 L 108,168 Z";

// Nakhchivan exclave
const NAKH_PATH =
  "M 68,230 L 80,220 L 95,215 L 108,218 L 115,228 L 112,240 L 100,248 L 85,248 L 73,240 Z";

export default function AzMap({ stores }: { stores: Store[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const mappable = stores.filter(s => s.lat != null && s.lng != null);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl"
      style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 50%, #071221 100%)" }}>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full"
        style={{ maxHeight: 340 }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="mapGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1a3a4a" />
            <stop offset="100%" stopColor="#0d1b2a" />
          </radialGradient>
          <filter id="dotGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {[...Array(8)].map((_, i) => (
          <line key={`v${i}`} x1={i * 75} y1={0} x2={i * 75} y2={VH}
            stroke="#14b8a620" strokeWidth="0.5" />
        ))}
        {[...Array(5)].map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 87} x2={VW} y2={i * 87}
            stroke="#14b8a620" strokeWidth="0.5" />
        ))}

        {/* Azerbaijan mainland */}
        <path d={AZ_PATH} fill="url(#mapGrad)" stroke="#14b8a6" strokeWidth="1.5"
          filter="url(#glow)" opacity="0.9" />

        {/* Nakhchivan */}
        <path d={NAKH_PATH} fill="url(#mapGrad)" stroke="#14b8a6" strokeWidth="1.5"
          filter="url(#glow)" opacity="0.9" />

        {/* Triangle network lines between store dots */}
        {mappable.length > 1 && mappable.map((s, i) => {
          if (i === 0) return null;
          const a = toSvg(s.lat!, s.lng!);
          const b = toSvg(mappable[i - 1].lat!, mappable[i - 1].lng!);
          return <line key={`line${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke="#14b8a640" strokeWidth="0.8" strokeDasharray="3 3" />;
        })}

        {/* Store dots */}
        {mappable.map(s => {
          const { x, y } = toSvg(s.lat!, s.lng!);
          const isHov = hovered === s.id;
          return (
            <g key={s.id} transform={`translate(${x},${y})`}
              onMouseEnter={() => setHovered(s.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
              filter="url(#dotGlow)">
              {/* Outer pulse ring 1 */}
              <circle r="14" fill="#14b8a6" opacity="0">
                <animate attributeName="r" values="6;18" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0" dur="2s" repeatCount="indefinite" />
              </circle>
              {/* Outer pulse ring 2 — offset */}
              <circle r="10" fill="#14b8a6" opacity="0">
                <animate attributeName="r" values="4;14" dur="2s" begin="0.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0" dur="2s" begin="0.6s" repeatCount="indefinite" />
              </circle>
              {/* Core dot */}
              <circle r={isHov ? 6 : 5} fill={isHov ? "#fff" : "#14b8a6"}
                stroke="#fff" strokeWidth="1.5" style={{ transition: "r 0.2s" }} />
              {/* Label on hover */}
              {isHov && (
                <g>
                  <rect x="-40" y="-32" width="80" height="20" rx="4"
                    fill="#0d1b2a" stroke="#14b8a6" strokeWidth="1" />
                  <text x="0" y="-18" textAnchor="middle"
                    fill="#14b8a6" fontSize="10" fontWeight="bold">{s.name}</text>
                </g>
              )}
            </g>
          );
        })}

        {/* Baku label */}
        <text x="470" y="148" fill="#14b8a660" fontSize="9" fontFamily="sans-serif">Bakı</text>
      </svg>
    </div>
  );
}
