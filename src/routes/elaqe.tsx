import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteLayout";
import { Phone, Mail, MapPin } from "lucide-react";

export const Route = createFileRoute("/elaqe")({
  head: () => ({ meta: [{ title: "Əlaqə — MebelMart" }] }),
  component: () => (
    <PageShell title="Əlaqə" subtitle="Bizimlə əlaqə saxlayın — 24/7 dəstək komandamız hazırdır.">
      <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5"><Phone className="h-6 w-6 text-[var(--brand)]" /><div><div className="text-xs text-muted-foreground">Çağrı mərkəzi</div><div className="font-bold">*0171</div></div></div>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5"><Mail className="h-6 w-6 text-[var(--brand)]" /><div><div className="text-xs text-muted-foreground">Email</div><div className="font-bold">info@mebelmart.az</div></div></div>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5"><MapPin className="h-6 w-6 text-[var(--brand)]" /><div><div className="text-xs text-muted-foreground">Mərkəzi ofis</div><div className="font-bold">Bakı, 28 May küç. 12</div></div></div>
        </div>
        <form className="grid gap-3 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-bold">Mesaj göndər</h2>
          <input className="rounded-lg border border-border bg-secondary/40 px-3 py-2" placeholder="Ad, soyad" />
          <input className="rounded-lg border border-border bg-secondary/40 px-3 py-2" placeholder="Telefon" />
          <textarea rows={5} className="rounded-lg border border-border bg-secondary/40 px-3 py-2" placeholder="Mesajınız" />
          <button className="rounded-lg bg-[var(--brand)] py-3 font-semibold text-[var(--brand-foreground)]">Göndər</button>
        </form>
      </div>
    </PageShell>
  ),
});
