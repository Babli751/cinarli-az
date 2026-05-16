import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/SiteLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Məxfilik siyasəti — Çınarlı" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PageShell title="Məxfilik siyasəti" subtitle="Son yenilənmə: May 2026">
      <div className="max-w-3xl mx-auto space-y-6 text-sm leading-relaxed">
        <Section title="1. Ümumi məlumat">
          Çınarlı Mebel ("biz", "şirkət") olaraq müştərilərimizin şəxsi məlumatlarının
          qorunmasına ciddi yanaşırıq. Bu məxfilik siyasəti saytımızdan istifadə zamanı
          toplanan məlumatların necə işlənildiyini izah edir.
        </Section>

        <Section title="2. Toplanan məlumatlar">
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Ad, soyad, email ünvanı (qeydiyyat zamanı)</li>
            <li>Telefon nömrəsi, çatdırılma ünvanı (sifariş zamanı)</li>
            <li>Brauzer növü, IP ünvanı, səhifə baxış məlumatları (avtomatik)</li>
          </ul>
        </Section>

        <Section title="3. Məlumatların istifadəsi">
          Toplanan məlumatlar aşağıdakı məqsədlər üçün istifadə edilir:
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Sifarişin işlənməsi və çatdırılması</li>
            <li>Müştəri xidməti təminatı</li>
            <li>Kampaniya və endirim bildirişləri (razılıq olduqda)</li>
            <li>Saytın texniki işinin təmin edilməsi</li>
          </ul>
        </Section>

        <Section title="4. Məlumatların paylaşılması">
          Şəxsi məlumatlarınız üçüncü tərəflərlə satılmır, icarəyə verilmir və ya
          ticarət məqsədilə paylaşılmır. Yalnız çatdırılma tərəfdaşlarımızla
          (sifariş məlumatları həcmində) paylaşıla bilər.
        </Section>

        <Section title="5. Çərəzlər (Cookies)">
          Saytımız sessiya idarəetməsi və funksionallıq üçün minimal çərəzlərdən
          istifadə edir. Brauzerin parametrlərindən çərəzləri söndürə bilərsiniz,
          lakin bu bəzi funksiyaları məhdudlaşdıra bilər.
        </Section>

        <Section title="6. Məlumatların saxlanması">
          Şəxsi məlumatlarınız hesabınız aktiv olduğu müddət ərzində saxlanılır.
          Hesabınızı silmək istəyirsinizsə, bizimlə əlaqə saxlayın.
        </Section>

        <Section title="7. Əlaqə">
          <div className="space-y-1 mt-1">
            <div>Məxfilik siyasəti ilə bağlı suallarınız üçün:</div>
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
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}
