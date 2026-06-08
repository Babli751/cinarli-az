import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteLayout";
import { Truck, Clock, MapPin } from "lucide-react";

export const Route = createFileRoute("/catdirilma")({
  head: () => ({ meta: [{ title: "Çatdırılma — Manqo — Onlayn Ticarət Mərkəzi" }] }),
  component: () => (
    <PageShell title="Çatdırılma və quraşdırma" subtitle="Bakı və regionlara sürətli çatdırılma.">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Truck, t: "Bakı daxili", d: "1-2 iş günü, 200 AZN-dan yuxarı pulsuz" },
          { icon: MapPin, t: "Regionlara", d: "3-5 iş günü, kuryer və ya terminal" },
          { icon: Clock, t: "Quraşdırma", d: "Peşəkar ustalar tərəfindən" },
        ].map((c) => (
          <div key={c.t} className="rounded-2xl border border-border bg-card p-6">
            <c.icon className="h-8 w-8 text-[var(--brand)]" />
            <h3 className="mt-3 font-bold">{c.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
          </div>
        ))}
      </div>
    </PageShell>
  ),
});
