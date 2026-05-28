import { useState, useRef, useEffect } from "react";
import { X, Gift } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const SECTORS = [
  { label: "10% Endirim",        color: "#14b8a6", prize: "DISCOUNT_10" },
  { label: "Şanssız 😢",         color: "#e2e8f0", prize: null },
  { label: "20% Endirim",        color: "#f97316", prize: "DISCOUNT_20" },
  { label: "Şanssız 😢",         color: "#e2e8f0", prize: null },
  { label: "Pulsuz Çatdırılma",  color: "#8b5cf6", prize: "FREE_DELIVERY" },
  { label: "Şanssız 😢",         color: "#e2e8f0", prize: null },
  { label: "30% Endirim",        color: "#ef4444", prize: "DISCOUNT_30" },
  { label: "10% Endirim",        color: "#14b8a6", prize: "DISCOUNT_10" },
];

const PRIZE_LABELS: Record<string, string> = {
  DISCOUNT_10: "10% Endirim Kuponu",
  DISCOUNT_20: "20% Endirim Kuponu",
  DISCOUNT_30: "30% Endirim Kuponu",
  FREE_DELIVERY: "Pulsuz Çatdırılma",
};

function genCode(prize: string) {
  return `${prize}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
}

const STORAGE_KEY = "spin_used";
const COUPON_KEY  = "spin_coupon";

export function SpinWheelBanner({ onLogin }: { onLogin: () => void }) {
  const { user } = useAuth();
  const alreadyUsed = typeof window !== "undefined" && !!localStorage.getItem(STORAGE_KEY);
  const [open, setOpen] = useState(false);
  const coupon = typeof window !== "undefined" ? localStorage.getItem(COUPON_KEY) : null;

  if (alreadyUsed && !coupon) return null;
  if (alreadyUsed && coupon) {
    const [type] = coupon.split("-");
    return (
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--brand)] bg-[var(--brand)]/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-[var(--brand)]" />
          <div>
            <div className="text-xs font-semibold text-[var(--brand)]">{PRIZE_LABELS[type] ?? "Kuponunuz"}</div>
            <div className="text-xs text-muted-foreground font-mono">{coupon}</div>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground">Səbətdə tətbiq et</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => { if (!user) { onLogin(); } else { setOpen(true); } }}
        className="mt-4 w-full rounded-2xl border-2 border-dashed border-[var(--accent-orange)] bg-[var(--accent-orange)]/5 py-4 text-center transition hover:bg-[var(--accent-orange)]/10 active:scale-95">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">🎡</span>
          <div className="text-left">
            <div className="text-sm font-bold text-[var(--accent-orange)]">Şans Çarxını Fırlat!</div>
            <div className="text-xs text-muted-foreground">Endirim qazanmaq şansın var</div>
          </div>
        </div>
      </button>
      {open && <SpinModal onClose={() => setOpen(false)} />}
    </>
  );
}

function SpinModal({ onClose }: { onClose: () => void }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ prize: string | null; label: string; code?: string } | null>(null);
  const animRef = useRef<number>(0);

  const n = SECTORS.length;
  const arc = 360 / n;

  function spin() {
    if (spinning || result) return;
    const idx = Math.floor(Math.random() * n);
    const targetDeg = 360 * 8 + (360 - idx * arc - arc / 2);
    setSpinning(true);
    setRotation(prev => prev + targetDeg);
    setTimeout(() => {
      setSpinning(false);
      const s = SECTORS[idx];
      const code = s.prize ? genCode(s.prize) : null;
      if (code) localStorage.setItem(COUPON_KEY, code);
      localStorage.setItem(STORAGE_KEY, "1");
      setResult({ prize: s.prize, label: s.label, code: code ?? undefined });
    }, 4000);
  }

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  const cx = 140, cy = 140, r = 130;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => !spinning && !result && onClose()}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black">🎡 Şans Çarxı</h2>
          {!spinning && <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary"><X className="h-4 w-4" /></button>}
        </div>

        {!result ? (
          <>
            <p className="text-sm text-muted-foreground mb-4 text-center">Bir dəfə fırlada bilərsiniz!</p>
            {/* Wheel */}
            <div className="relative flex justify-center mb-4">
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-0 h-0"
                style={{ borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: "22px solid #ef4444" }} />
              <svg width="280" height="280" viewBox="0 0 280 280"
                style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? "transform 4s cubic-bezier(0.17,0.67,0.12,1)" : "none" }}>
                {SECTORS.map((s, i) => {
                  const startAngle = (i * arc - 90) * Math.PI / 180;
                  const endAngle = ((i + 1) * arc - 90) * Math.PI / 180;
                  const x1 = cx + r * Math.cos(startAngle);
                  const y1 = cy + r * Math.sin(startAngle);
                  const x2 = cx + r * Math.cos(endAngle);
                  const y2 = cy + r * Math.sin(endAngle);
                  const midAngle = ((i + 0.5) * arc - 90) * Math.PI / 180;
                  const tx = cx + (r * 0.65) * Math.cos(midAngle);
                  const ty = cy + (r * 0.65) * Math.sin(midAngle);
                  const textAngle = (i + 0.5) * arc;
                  return (
                    <g key={i}>
                      <path d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`} fill={s.color} stroke="white" strokeWidth="2" />
                      <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
                        fontSize="9" fontWeight="700" fill={s.color === "#e2e8f0" ? "#64748b" : "white"}
                        transform={`rotate(${textAngle}, ${tx}, ${ty})`}>
                        {s.label.split(" ").map((w, wi) => (
                          <tspan key={wi} x={tx} dy={wi === 0 ? (s.label.split(" ").length > 1 ? "-0.6em" : "0") : "1.2em"}>{w}</tspan>
                        ))}
                      </text>
                    </g>
                  );
                })}
                <circle cx={cx} cy={cy} r="22" fill="white" stroke="#e2e8f0" strokeWidth="2" />
              </svg>
            </div>
            <button onClick={spin} disabled={spinning}
              className="w-full rounded-2xl bg-[var(--accent-orange)] py-3 font-black text-white text-lg disabled:opacity-60 transition hover:opacity-90 active:scale-95">
              {spinning ? "Fırlanır..." : "🎯 Fırlat!"}
            </button>
          </>
        ) : (
          <div className="text-center py-4">
            {result.prize ? (
              <>
                <div className="text-5xl mb-3">🎉</div>
                <h3 className="text-xl font-black text-[var(--brand)] mb-1">Təbrik edirik!</h3>
                <p className="text-sm text-muted-foreground mb-4">{PRIZE_LABELS[result.prize]} qazandınız!</p>
                <div className="rounded-2xl bg-[var(--brand)]/10 border border-[var(--brand)] px-4 py-3 mb-4">
                  <div className="text-xs text-muted-foreground mb-1">Kupon kodunuz:</div>
                  <div className="font-mono text-lg font-black text-[var(--brand)] tracking-wider">{result.code}</div>
                  <div className="text-xs text-muted-foreground mt-1">Səbətdə tətbiq edin</div>
                </div>
              </>
            ) : (
              <>
                <div className="text-5xl mb-3">😢</div>
                <h3 className="text-xl font-black mb-1">Bu dəfə olmadı</h3>
                <p className="text-sm text-muted-foreground mb-4">Növbəti dəfə şansınız gətirər!</p>
              </>
            )}
            <button onClick={onClose} className="w-full rounded-2xl bg-[var(--brand)] py-3 font-semibold text-[var(--brand-foreground)]">Bağla</button>
          </div>
        )}
      </div>
    </div>
  );
}
