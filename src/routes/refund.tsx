import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Política de Reembolso | Task Partners" },
      { name: "description", content: "Política de Reembolso da Task Partners." },
    ],
  }),
  component: RefundPage,
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

function RefundPage() {
  return (
    <LegalLayout label="Política" title="Política de Reembolso">
      <p>A Task Partners oferece garantia de reembolso de 14 dias. Se o produto não for adequado para você, entre em contato com nossa equipe de suporte dentro de 14 dias após a compra e auxiliaremos sua solicitação conforme esta política.</p>
      <Section title="Elegibilidade">
        <p>Solicitações de reembolso devem incluir o e-mail usado na compra e os detalhes relevantes do pedido. Solicitações enviadas após o período de 14 dias podem não ser elegíveis.</p>
      </Section>
      <Section title="Processamento">
        <p>Reembolsos aprovados são processados pelo mesmo processador de pagamento usado na compra. O prazo pode variar conforme o método de pagamento e a instituição financeira.</p>
      </Section>
      <Section title="Como solicitar reembolso">
        <p>Envie um e-mail para <a className="font-bold text-[#2563EB]" href="mailto:support@taskpartners.live">support@taskpartners.live</a> com o assunto "Solicitação de Reembolso" e inclua o e-mail usado na compra.</p>
      </Section>
    </LegalLayout>
  );
}
