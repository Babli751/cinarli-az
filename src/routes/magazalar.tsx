import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/SiteLayout";
import { MapPin, Phone, Clock } from "lucide-react";
import { api, type Store } from "@/lib/api";

export const Route = createFileRoute("/magazalar")({
  head: () => ({ meta: [{ title: "Mağazalar — Manqo" }, { name: "description", content: "Manqo mağaza şəbəkəsi və ünvanları." }] }),
  component: Magazalar,
});

function Magazalar() {
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => { api.getStores().then(setStores).catch(() => {}); }, []);

  return (
    <PageShell title="Mağazalar" subtitle="Yaxınlıqdakı mağazanı seçin.">
      {stores.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">Hələ mağaza əlavə edilməyib</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((s) => (
            <div key={s.id} className="rounded-2xl border border-border bg-card p-5">
              {s.city && <div className="text-xs font-semibold uppercase tracking-wider text-[var(--brand)]">{s.city}</div>}
              <h3 className="mt-1 text-lg font-bold">{s.name}</h3>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                {s.address && <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {s.address}</div>}
                {s.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {s.phone}</div>}
                {s.hours && <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {s.hours}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
