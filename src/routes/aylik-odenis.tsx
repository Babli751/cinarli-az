import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteLayout";

export const Route = createFileRoute("/aylik-odenis")({
  head: () => ({ meta: [{ title: "Aylıq ödəniş — Çınarlı Mebel" }, { name: "description", content: "Faizsiz 24 aya qədər aylıq ödəniş." }] }),
  component: () => (
    <PageShell title="Aylıq ödəniş" subtitle="Faizsiz 24 aya qədər. Birbankın bütün kartları ilə.">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { t: "0% faiz", d: "24 aya qədər tam faizsiz" },
          { t: "Sürətli təsdiq", d: "5 dəqiqə ərzində online" },
          { t: "Bütün banklar", d: "Kapital, ABB, Birbank, Unibank" },
        ].map((c) => (
          <div key={c.t} className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold">{c.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-bold">Hesablayıcı</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input className="rounded-lg border border-border bg-secondary/40 px-3 py-2" placeholder="Məhsul qiyməti (₼)" />
          <select className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
            <option>3 ay</option><option>6 ay</option><option>12 ay</option><option>24 ay</option>
          </select>
          <button className="rounded-lg bg-[var(--brand)] py-2 font-semibold text-[var(--brand-foreground)]">Hesabla</button>
        </div>
      </div>
    </PageShell>
  ),
});
