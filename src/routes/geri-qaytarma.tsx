import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteLayout";

export const Route = createFileRoute("/geri-qaytarma")({
  head: () => ({ meta: [{ title: "Geri qaytarma — MebelMart" }] }),
  component: () => (
    <PageShell title="Geri qaytarma və zəmanət" subtitle="14 gün ərzində geri qaytarma. 2 il rəsmi zəmanət.">
      <div className="space-y-4">
        {[
          { t: "14 gün geri qaytarma", d: "Məhsulu açılmamış halda 14 gün ərzində qaytara bilərsiniz." },
          { t: "2 il zəmanət", d: "Bütün məhsullara rəsmi istehsalçı zəmanəti." },
          { t: "Servis xidməti", d: "Zəmanət dövründə pulsuz təmir və dəyişdirmə." },
        ].map((c) => (
          <div key={c.t} className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-bold">{c.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
          </div>
        ))}
      </div>
    </PageShell>
  ),
});
