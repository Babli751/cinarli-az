import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "İstifadə qaydaları — Çınarlı" }] }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PageShell title="İstifadə qaydaları" subtitle="Son yenilənmə: May 2026">
      <div className="max-w-3xl mx-auto space-y-4">
        <Section title="1. Ümumi şərtlər">
          chinarli.store saytından istifadə etməklə siz bu istifadə qaydalarını qəbul etmiş
          sayılırsınız. Şərtlərlə razı deyilsinizsə, saytdan istifadəni dayandırın.
        </Section>

        <Section title="2. Sifariş və ödəniş">
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Sifarişlər təsdiqlənənədək dəyişdirilə bilər</li>
            <li>Qiymətlər ƏDV daxil olmaqla göstərilir</li>
            <li>Ödəniş nağd və ya kartla həyata keçirilir</li>
            <li>Sifariş təsdiqi SMS/email ilə göndərilir</li>
          </ul>
        </Section>

        <Section title="3. Çatdırılma">
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Bakı daxili çatdırılma: 1–3 iş günü</li>
            <li>Regionlar: 3–7 iş günü</li>
            <li>Çatdırılma haqqı sifariş məbləğinə görə müəyyən edilir</li>
            <li>Ünvanın dəqiq göstərilməsinə görə müştəri məsuliyyət daşıyır</li>
          </ul>
        </Section>

        <Section title="4. Geri qaytarma">
          Məhsul alındıqdan 14 gün ərzində aşağıdakı şərtlərlə qaytarıla bilər:
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Məhsul istifadə edilməmiş və orijinal qablaşdırmasında olmalıdır</li>
            <li>Sifariş nömrəsi ilə bizimlə əlaqə saxlayın</li>
            <li>Xüsusi sifarişlə hazırlanan məhsullar geri qaytarılmır</li>
          </ul>
        </Section>

        <Section title="5. Zəmanət">
          Bütün məhsullar istehsalçı zəmanəti ilə təchiz olunur. Zəmanət müddəti
          məhsula görə dəyişir (6 ay — 2 il). Zəmanət mexaniki zədələrə şamil edilmir.
        </Section>

        <Section title="6. Məsuliyyətin məhdudlaşdırılması">
          Şirkət saytın müvəqqəti əlçatmazlığı, texniki nasazlıqlar və ya üçüncü tərəf
          xidmətlərindən qaynaqlanan zərərə görə məsuliyyət daşımır.
        </Section>

        <Section title="7. Əlaqə">
          <div className="space-y-1 mt-1">
            <div>Suallarınız üçün:</div>
            <div><strong>Email:</strong> info@chinarli.store</div>
            <div><strong>Telefon:</strong> *0171</div>
          </div>
        </Section>
      </div>
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-2 text-base font-bold">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}
