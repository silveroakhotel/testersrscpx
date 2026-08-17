import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade | Task Partners" },
      { name: "description", content: "Política de Privacidade da Task Partners." },
    ],
  }),
  component: PrivacyPage,
});

function LegalLayout({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-[#F8FAFC] px-5 py-8 text-[#0F172A]">
      <article className="mx-auto max-w-3xl rounded-[24px] border border-slate-200 bg-white p-7 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-10">
        <a href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-black text-[#0F172A]">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0F172A] text-white">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Task Partners
        </a>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2563EB]">{label}</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
        <div className="mt-7 space-y-6 text-base leading-8 text-slate-600">{children}</div>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-xl font-black tracking-tight text-[#0F172A]">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function PrivacyPage() {
  return (
    <LegalLayout label="Legal" title="Política de Privacidade">
      <p>A Task Partners respeita sua privacidade e se compromete a proteger as informações que você compartilha conosco. Esta política explica como coletamos, usamos e protegemos dados básicos de conta e suporte.</p>
      <Section title="Informações que coletamos">
        <p>Podemos coletar seu nome, endereço de e-mail, detalhes da compra, mensagens de suporte e informações técnicas necessárias para fornecer acesso ao painel e aos recursos relacionados.</p>
      </Section>
      <Section title="Como usamos as informações">
        <p>Usamos as informações para gerenciar o acesso à conta, entregar recursos digitais, responder solicitações de suporte, melhorar o produto e comunicar atualizações importantes do serviço.</p>
      </Section>
      <Section title="Proteção de dados">
        <p>Usamos medidas administrativas e técnicas razoáveis para proteger suas informações. Nenhum serviço online pode garantir segurança absoluta, mas trabalhamos para tratar seus dados com responsabilidade.</p>
      </Section>
      <Section title="Contato">
        <p>Para dúvidas sobre privacidade, entre em contato pelo e-mail <a className="font-bold text-[#2563EB]" href="mailto:support@taskpartners.live">support@taskpartners.live</a>.</p>
      </Section>
    </LegalLayout>
  );
}
