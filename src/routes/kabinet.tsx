import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteLayout";
import { User, Package, Heart, Scale, MapPin, LogOut } from "lucide-react";

export const Route = createFileRoute("/kabinet")({
  head: () => ({ meta: [{ title: "Şəxsi kabinet — MebelMart" }] }),
  component: () => (
    <PageShell title="Şəxsi kabinet" subtitle="Hesabınıza daxil olun və ya qeydiyyatdan keçin.">
      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-border bg-card p-4">
          {[
            { icon: User, t: "Profil" }, { icon: Package, t: "Sifarişlərim" },
            { icon: Heart, t: "Bəyəndiklərim" }, { icon: Scale, t: "Müqayisə" },
            { icon: MapPin, t: "Ünvanlar" }, { icon: LogOut, t: "Çıxış" },
          ].map((i) => (
            <div key={i.t} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-secondary">
              <i.icon className="h-4 w-4 text-[var(--brand)]" /> {i.t}
            </div>
          ))}
        </aside>
        <form className="grid gap-3 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-bold">Daxil ol</h2>
          <input className="rounded-lg border border-border bg-secondary/40 px-3 py-2" placeholder="Telefon və ya email" />
          <input type="password" className="rounded-lg border border-border bg-secondary/40 px-3 py-2" placeholder="Şifrə" />
          <button className="rounded-lg bg-[var(--brand)] py-3 font-semibold text-[var(--brand-foreground)]">Daxil ol</button>
          <button className="rounded-lg border border-border py-3 font-semibold">Qeydiyyat</button>
        </form>
      </div>
    </PageShell>
  ),
});
