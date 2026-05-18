import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteLayout";

export const Route = createFileRoute("/haqqimizda")({
  head: () => ({ meta: [{ title: "Haqqımızda — Çınarlı Mebel" }] }),
  component: () => (
    <PageShell title="Haqqımızda" subtitle="2008-ci ildən etibarlı mebel partnyoru.">
      <div className="prose prose-sm max-w-none text-foreground">
        <p>Çınarlı Mebel Azərbaycanda 56 mağazaya, 40 mindən çox məhsul çeşidinə və 2 milyondan çox müştəriyə xidmət edən aparıcı mebel şəbəkəsidir.</p>
        <p>Məqsədimiz hər evə keyfiyyətli, müasir və əlçatan mebel çatdırmaqdır.</p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {[["56","Mağaza"],["40k+","Məhsul"],["2M+","Müştəri"],["18","İl təcrübə"]].map(([n,l]) => (
          <div key={l} className="rounded-2xl border border-border bg-card p-6 text-center">
            <div className="text-3xl font-black text-[var(--brand)]">{n}</div>
            <div className="mt-1 text-sm text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>
    </PageShell>
  ),
});
