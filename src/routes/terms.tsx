import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Termos de Serviço | Task Partners" },
      { name: "description", content: "Termos de Serviço da Task Partners." },
    ],
  }),
  component: TermsPage,
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

function TermsPage() {
  return (
    <LegalLayout label="Legal" title="Termos de Serviço">
      <p>Ao usar a Task Partners, você concorda com estes termos. A Task Partners fornece um ambiente digital de produtividade, modelos, recursos e ferramentas de organização para fluxos de trabalho pessoais ou profissionais.</p>
      <Section title="Acesso ao produto">
        <p>O acesso é fornecido digitalmente após a compra. Você é responsável por manter seus dados de login seguros e usar o produto de forma legal e respeitosa.</p>
      </Section>
      <Section title="Uso permitido">
        <p>Você não pode copiar, revender, redistribuir ou usar indevidamente os recursos da Task Partners sem permissão. O ambiente é destinado à organização, produtividade e acesso aos materiais digitais incluídos.</p>
      </Section>
      <Section title="Alterações no serviço">
        <p>Podemos atualizar conteúdos, funcionalidades e recursos para melhorar o produto. Nosso objetivo é manter o ambiente estável, útil e acessível.</p>
      </Section>
      <Section title="Suporte">
        <p>Para dúvidas sobre o serviço, entre em contato pelo e-mail <a className="font-bold text-[#2563EB]" href="mailto:support@taskpartners.live">support@taskpartners.live</a>.</p>
      </Section>
    </LegalLayout>
  );
}
