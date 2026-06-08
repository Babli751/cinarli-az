import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteLayout";
import { Building2, Briefcase, Users, FileText } from "lucide-react";

export const Route = createFileRoute("/korporativ")({
  head: () => ({ meta: [{ title: "Korporativ satışlar — Manqo — Onlayn Ticarət Mərkəzi" }, { name: "description", content: "Şirkətlər, otellər və ofislər üçün xüsusi şərtlər." }] }),
  component: () => (
    <PageShell title="Korporativ satışlar" subtitle="Şirkətlər, otellər, restoran və ofislər üçün xüsusi qiymət və şərtlər.">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { icon: Building2, t: "Otellər" }, { icon: Briefcase, t: "Ofislər" },
          { icon: Users, t: "Restoranlar" }, { icon: FileText, t: "Layihə dizayn" },
        ].map((b) => (
          <div key={b.t} className="rounded-2xl border border-border bg-card p-6 text-center">
            <b.icon className="mx-auto h-10 w-10 text-[var(--brand)]" />
            <div className="mt-3 font-semibold">{b.t}</div>
          </div>
        ))}
      </div>

      <form className="mt-10 grid gap-4 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
        <h2 className="md:col-span-2 text-xl font-bold">Müraciət forması</h2>
        <input className="rounded-lg border border-border bg-secondary/40 px-3 py-2" placeholder="Şirkət adı" />
        <input className="rounded-lg border border-border bg-secondary/40 px-3 py-2" placeholder="Əlaqə şəxsi" />
        <input className="rounded-lg border border-border bg-secondary/40 px-3 py-2" placeholder="Telefon" />
        <input className="rounded-lg border border-border bg-secondary/40 px-3 py-2" placeholder="Email" />
        <textarea className="md:col-span-2 rounded-lg border border-border bg-secondary/40 px-3 py-2" rows={4} placeholder="Tələb haqqında qısa məlumat" />
        <button className="md:col-span-2 rounded-lg bg-[var(--brand)] py-3 font-semibold text-[var(--brand-foreground)]">Müraciət göndər</button>
      </form>
    </PageShell>
  ),
});
