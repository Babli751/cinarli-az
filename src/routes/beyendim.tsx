import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteLayout";

export const Route = createFileRoute("/beyendim")({
  head: () => ({ meta: [{ title: "Bəyəndiklərim — MebelMart" }] }),
  component: () => (
    <PageShell title="Bəyəndiklərim">
      <div className="rounded-2xl border border-dashed border-border p-16 text-center">
        <div className="text-6xl">❤️</div>
        <p className="mt-4 text-muted-foreground">Hələ bəyəndiyiniz məhsul yoxdur.</p>
        <Link to="/" className="mt-6 inline-block rounded-lg bg-[var(--brand)] px-6 py-3 font-semibold text-[var(--brand-foreground)]">Məhsullara bax</Link>
      </div>
    </PageShell>
  ),
});
