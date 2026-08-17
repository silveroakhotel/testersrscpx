import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contato | Task Partners" },
      { name: "description", content: "Entre em contato com o suporte da Task Partners." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <main className="min-h-dvh bg-[#F8FAFC] px-5 py-8 text-[#0F172A]">
      <section className="mx-auto max-w-3xl rounded-[24px] border border-slate-200 bg-white p-7 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-10">
        <a href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-black text-[#0F172A]">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0F172A] text-white">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Task Partners
        </a>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2563EB]">Suporte</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Contato Task Partners</h1>
        <p className="mt-5 text-base leading-8 text-slate-600">
          Nossa equipe de suporte pode ajudar com acesso à conta, recursos do produto, dúvidas de cobrança e solicitações de reembolso.
        </p>
        <div className="mt-7 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5">
          <strong className="block text-sm font-black text-[#0F172A]">E-mail de suporte</strong>
          <a className="mt-2 inline-flex font-black text-[#2563EB]" href="mailto:support@taskpartners.live">support@taskpartners.live</a>
        </div>
        <form className="mt-7 grid gap-4" action="mailto:support@taskpartners.live" method="post" encType="text/plain">
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Nome
            <input className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 text-[#0F172A] outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-600/10" name="name" type="text" autoComplete="name" required />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            E-mail
            <input className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 text-[#0F172A] outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-600/10" name="email" type="email" autoComplete="email" required />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Mensagem
            <textarea className="min-h-32 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[#0F172A] outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-600/10" name="message" rows={5} required />
          </label>
          <button className="min-h-12 rounded-full bg-[#2563EB] px-6 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-[#1D4ED8]" type="submit">
            Enviar mensagem
          </button>
        </form>
      </section>
    </main>
  );
}
