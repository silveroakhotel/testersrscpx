import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, DollarSign, Home, ShieldCheck, TrendingUp, Users, Wrench } from "lucide-react";
import type { ReactNode } from "react";

const CHECKOUT_URL = "https://www.checkout-ds24.com/product/716458?aff=hutlike26804&cam=CAMPAIGNKEY";

const problems = [
  "Você quer uma renda extra, mas ainda não sabe por qual habilidade começar",
  "Você cansou de bicos que exigem anúncios, estoque ou ferramentas complicadas",
  "Você vê problemas simples de tecnologia no dia a dia, mas não sabe como transformar isso em serviço pago",
  "Você quer algo prático que possa começar ainda esta semana",
];

const benefits = [
  {
    icon: <Wrench size={24} />,
    title: "Serviços com alta demanda",
    text: "Aprenda serviços simples de computador que as pessoas já pagam: limpeza, melhoria de velocidade, troca para SSD, configuração inicial e suporte básico.",
  },
  {
    icon: <DollarSign size={24} />,
    title: "Guia simples de preços",
    text: "Use faixas de preço práticas para passar orçamento com confiança, evitar cobrar barato demais e saber o que oferecer primeiro.",
  },
  {
    icon: <Users size={24} />,
    title: "Plano para o primeiro cliente",
    text: "Encontre compradores locais por canais simples da sua região, sem precisar criar uma marca complicada antes.",
  },
  {
    icon: <Home size={24} />,
    title: "Atendimento presencial",
    text: "Entenda como lidar com visitas locais, etapas básicas do serviço e acompanhamento para deixar o cliente seguro.",
  },
  {
    icon: <TrendingUp size={24} />,
    title: "Sistema de recorrência",
    text: "Transforme consertos pontuais em indicações, novos atendimentos e uma renda mensal mais previsível.",
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Confiança para iniciantes",
    text: "Use scripts, checklists e próximos passos claros para começar mesmo sem ser um técnico certificado.",
  },
];

const fitItems = [
  "Você quer renda extra sem um investimento inicial alto",
  "Você topa aprender uma habilidade prática de tecnologia",
  "Você quer um caminho simples até o primeiro cliente pagante",
  "Você prefere prestar serviços locais em vez de depender de promessas online",
  "Você quer passos claros, scripts e orientação de preços",
];

export const Route = createFileRoute("/landingpage")({
  head: () => ({
    meta: [
      { title: "Renda Extra Consertando Computadores" },
      {
        name: "description",
        content: "Aprenda como transformar serviços simples de manutenção de computadores em renda extra mensal.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#070A08] text-white antialiased">
      <Hero />
      <ProblemSection />
      <BenefitsSection />
      <FitSection />
      <GuaranteeSection />
      <FinalOffer />
      <footer className="border-t border-white/10 bg-[#080808] px-5 py-8 text-center text-xs font-semibold text-[#8D98A7]">
        Copyright 2025. Todos os direitos reservados.
      </footer>
    </main>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-white/10 px-5">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-10%,rgba(0,228,124,0.24),transparent_36%),linear-gradient(180deg,#0B1A12_0%,#070A08_62%,#070A08_100%)]" />
      <div className="mx-auto flex min-h-[92dvh] w-full max-w-5xl flex-col items-center justify-center py-16 text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#00E47C]/35 bg-[#00E47C]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#00E47C]">
          <CheckCircle2 size={15} />
          Método comprovado
        </p>

        <h1 className="mt-8 max-w-5xl text-[clamp(3.2rem,10vw,7.2rem)] font-black uppercase leading-[0.9] text-white">
          Ganhe dinheiro
          <span className="block text-[#00E47C]">Consertando computadores</span>
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-balance text-lg font-medium leading-8 text-[#D7DEE8] sm:text-xl">
          Um guia prático para transformar serviços simples de manutenção de computadores em R$500 a R$1.500 por mês de renda extra, sem cursos caros e sem experiência avançada.
        </p>

        <div className="mt-10 grid w-full max-w-3xl gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="rounded-[8px] border border-white/12 bg-white/[0.07] p-5 text-left shadow-[0_24px_70px_rgba(0,0,0,.32)]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9CA3AF]">Acesso Imediato</p>
            <div className="mt-3 flex items-end gap-3">
              <p className="text-5xl font-black text-[#00E47C]">R$37</p>
              <p className="pb-2 text-sm font-bold text-[#AAB4C3]">pagamento único</p>
            </div>
          </div>
          <CtaButton label="Obter acesso imediato" />
        </div>

        <p className="mt-5 text-sm font-semibold text-[#9CA3AF]">Pagamento seguro | Acesso imediato | Garantia de 7 dias</p>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <SectionShell>
      <div className="mx-auto max-w-4xl">
        <Eyebrow>O problema</Eyebrow>
        <SectionTitle>Isso parece com você?</SectionTitle>
        <p className="mt-6 max-w-3xl text-lg font-medium leading-8 text-[#D7DEE8]">
          A maioria das pessoas complica demais a renda extra. Você não precisa de audiência, estoque ou diploma técnico para começar com serviços básicos de computador.
        </p>
        <div className="mt-9 grid gap-3">
          {problems.map((item) => (
            <div className="flex items-start gap-4 rounded-[8px] border border-white/10 bg-white/[0.055] p-5 text-base font-semibold text-[#EDF2F7]" key={item}>
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#FE2C55]/15 text-sm font-black text-[#FF5C76]">X</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

function BenefitsSection() {
  return (
    <SectionShell tone="muted">
      <div className="mx-auto max-w-6xl">
        <Eyebrow>O que você recebe</Eyebrow>
        <SectionTitle>Tudo que você precisa para começar</SectionTitle>
        <p className="mt-5 max-w-3xl text-lg font-medium leading-8 text-[#D7DEE8]">
          Um roteiro direto e prático para quem quer começar pequeno, aprender rápido e conseguir serviços pagos na própria região.
        </p>
        <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((item) => (
            <article className="rounded-[8px] border border-white/10 bg-[#0B0F0D] p-6 shadow-[0_18px_42px_rgba(0,0,0,.24)]" key={item.title}>
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-[8px] border border-[#00E47C]/25 bg-[#00E47C]/10 text-[#00E47C]">
                {item.icon}
              </div>
              <h3 className="text-lg font-black text-white">{item.title}</h3>
              <p className="mt-3 text-sm font-medium leading-7 text-[#AAB4C3]">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

function FitSection() {
  return (
    <SectionShell>
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <Eyebrow>Para quem é</Eyebrow>
          <SectionTitle>Este guia é para você se...</SectionTitle>
          <div className="mt-8 grid gap-4">
            {fitItems.map((item) => (
              <p className="flex items-start gap-3 text-base font-bold leading-7 text-[#EDF2F7]" key={item}>
                <CheckCircle2 className="mt-0.5 shrink-0 text-[#00E47C]" size={21} />
                {item}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded-[8px] border border-[#00E47C]/30 bg-[#00E47C]/10 p-7 text-center shadow-[0_22px_60px_rgba(0,228,124,.08)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00E47C]">Meta mensal realista</p>
          <p className="mt-5 text-[clamp(3.4rem,11vw,6rem)] font-black uppercase leading-none text-[#00E47C]">R$1.500</p>
          <p className="mx-auto mt-5 max-w-xl text-base font-semibold leading-7 text-[#D7DEE8]">
            Possível com consistência, demanda local e clientes recorrentes na sua região.
          </p>
        </div>
      </div>
    </SectionShell>
  );
}

function GuaranteeSection() {
  return (
    <SectionShell tone="muted">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full border border-[#00E47C]/40 bg-[#00E47C]/10 text-[#00E47C]">
          <ShieldCheck size={40} />
        </div>
        <Eyebrow centered>Garantia</Eyebrow>
        <SectionTitle centered>Garantia de 7 dias</SectionTitle>
        <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-8 text-[#D7DEE8]">
          Se o guia não for útil para você, solicite o reembolso em até 7 dias. Simples, claro e sem processo complicado.
        </p>
      </div>
    </SectionShell>
  );
}

function FinalOffer() {
  return (
    <section className="bg-[#101512] px-5 py-18 text-center sm:py-24">
      <div className="mx-auto max-w-3xl rounded-[8px] border border-white/10 bg-white/[0.055] p-6 shadow-[0_30px_80px_rgba(0,0,0,.26)] sm:p-10">
        <Eyebrow centered>Oferta especial</Eyebrow>
        <SectionTitle centered>Comece hoje</SectionTitle>
        <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-8 text-[#D7DEE8]">
          Tenha acesso imediato ao guia completo e comece hoje a montar sua primeira oferta de serviço local.
        </p>
        <p className="mt-8 text-5xl font-black text-[#00E47C]">
          R$37 <span className="text-base font-semibold text-[#9AA3AF]">pagamento único</span>
        </p>
        <CtaButton className="mx-auto mt-8" label="Garantir meu acesso agora" />
        <p className="mt-5 text-sm font-semibold text-[#9AA3AF]">Pagamento Seguro | Acesso Imediato | Garantia de 7 dias</p>
      </div>
    </section>
  );
}

function CtaButton({ label, className = "" }: { label: string; className?: string }) {
  return (
    <a
      className={`flex min-h-14 w-full items-center justify-center rounded-[8px] bg-[#00E47C] px-6 text-sm font-black uppercase tracking-[0.04em] text-black shadow-[0_18px_55px_rgba(0,228,124,.24)] transition hover:bg-[#28F291] active:scale-[0.99] sm:min-w-[300px] ${className}`}
      href={CHECKOUT_URL}
    >
      {label} -&gt;
    </a>
  );
}

function SectionShell({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "muted" }) {
  return (
    <section className={`border-b border-white/10 px-5 py-16 sm:py-24 ${tone === "muted" ? "bg-[#0D0F0E]" : "bg-[#070A08]"}`}>
      {children}
    </section>
  );
}

function Eyebrow({ children, centered = false }: { children: ReactNode; centered?: boolean }) {
  return <p className={`text-sm font-black uppercase tracking-[0.18em] text-[#00E47C] ${centered ? "text-center" : ""}`}>{children}</p>;
}

function SectionTitle({ children, centered = false }: { children: ReactNode; centered?: boolean }) {
  return (
    <h2 className={`mt-4 text-[clamp(2.25rem,7vw,4.4rem)] font-black uppercase leading-[0.95] text-white ${centered ? "mx-auto text-center" : ""}`}>
      {children}
    </h2>
  );
}
