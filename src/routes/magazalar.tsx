import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteLayout";
import { MapPin, Phone, Clock } from "lucide-react";

const stores = [
  { city: "Bakı", name: "MebelMart 28 May", addr: "28 May küç. 12", phone: "*0171", hours: "10:00 — 22:00" },
  { city: "Bakı", name: "MebelMart Ganjlik Mall", addr: "Fətəli Xan Xoyski 16", phone: "*0171", hours: "10:00 — 22:00" },
  { city: "Bakı", name: "MebelMart Yasamal", addr: "Şərifzadə 45", phone: "*0171", hours: "10:00 — 21:00" },
  { city: "Sumqayıt", name: "MebelMart Sumqayıt", addr: "S.Vurğun 8", phone: "*0171", hours: "10:00 — 21:00" },
  { city: "Gəncə", name: "MebelMart Gəncə", addr: "H.Əliyev pr. 21", phone: "*0171", hours: "10:00 — 21:00" },
  { city: "Lənkəran", name: "MebelMart Lənkəran", addr: "Mərkəz", phone: "*0171", hours: "10:00 — 20:00" },
];

export const Route = createFileRoute("/magazalar")({
  head: () => ({ meta: [{ title: "Mağazalar — MebelMart" }, { name: "description", content: "MebelMart mağaza şəbəkəsi və ünvanları." }] }),
  component: () => (
    <PageShell title="Mağazalar" subtitle="56 mağazadan ibarət şəbəkə. Yaxınlıqdakı mağazanı seçin.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stores.map((s) => (
          <div key={s.name} className="rounded-2xl border border-border bg-card p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--brand)]">{s.city}</div>
            <h3 className="mt-1 text-lg font-bold">{s.name}</h3>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {s.addr}</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {s.phone}</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {s.hours}</div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  ),
});
