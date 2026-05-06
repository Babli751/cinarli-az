import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteLayout";

export const Route = createFileRoute("/muqayise")({
  head: () => ({ meta: [{ title: "Müqayisə — MebelMart" }] }),
  component: () => (
    <PageShell title="Müqayisə">
      <div className="rounded-2xl border border-dashed border-border p-16 text-center">
        <div className="text-6xl">⚖️</div>
        <p className="mt-4 text-muted-foreground">Müqayisə siyahısı boşdur.</p>
        <Link to="/" className="mt-6 inline-block rounded-lg bg-[var(--brand)] px-6 py-3 font-semibold text-[var(--brand-foreground)]">Məhsul seç</Link>
      </div>
    </PageShell>
  ),
});
