import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

const CHECKOUT_URL = "https://checkout.vendepay.com/12ae4dae-df3d-4db0-b597-a00a77c1b6b8";

const problems = [
  "You struggle to make it to the end of the month financially",
  "You want to start something on your own but do not know where to begin",
  "You feel like you could earn more but have no clear path forward",
  "You see opportunity in tech but think it is too complicated",
  "You have tried other side hustles that just did not work out",
];

const benefits = [
  {
    icon: "01",
    title: "The Most Profitable Services",
    text: "OS reinstalls, physical cleaning, SSD upgrades, virus removal and more - learn what is in highest demand and how to do it.",
  },
  {
    icon: "02",
    title: "How to Price Your Work",
    text: "Real market pricing tables and simple ways to present your value confidently without undercharging.",
  },
  {
    icon: "03",
    title: "Landing Your First Clients",
    text: "Strategies to find clients on Facebook Marketplace, Craigslist, Nextdoor and local groups - for free.",
  },
  {
    icon: "04",
    title: "Building Trust Fast",
    text: "How to present yourself professionally, give quotes, and close jobs even as a beginner.",
  },
  {
    icon: "05",
    title: "On-Site House Calls",
    text: "Learn to service clients at their homes and charge a visit fee, boosting income without leaving your neighborhood.",
  },
  {
    icon: "06",
    title: "Scaling Your Income",
    text: "Strategies to retain clients, generate referrals, and turn this into a full-time income if you want.",
  },
];

const fitItems = [
  "You want extra income without a big upfront investment",
  "You have some interest or curiosity about technology",
  "You want to work for yourself on your own schedule",
  "You are tired of depending on a single paycheck",
  "You want to start fast and land your first client this week",
];

export const Route = createFileRoute("/landingpage")({
  head: () => ({
    meta: [
      { title: "Extra Income Fixing Computers" },
      {
        name: "description",
        content: "Learn how to turn a simple computer skill into extra monthly income.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#090909] text-white antialiased">
      <Hero />
      <ProblemSection />
      <BenefitsSection />
      <FitSection />
      <GuaranteeSection />
      <FinalOffer />
      <footer className="border-t border-white/10 bg-[#101010] px-5 py-8 text-center text-xs text-[#858b96]">
        (c) 2025 - All rights reserved
      </footer>
    </main>
  );
}

function Hero() {
  return (
    <section className="relative isolate flex min-h-[92dvh] items-center justify-center overflow-hidden border-b border-white/10 px-5 py-20 text-center">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,136,0.14),transparent_34%),linear-gradient(180deg,#07110c_0%,#090909_56%,#090909_100%)]" />
      <div className="mx-auto w-full max-w-4xl">
        <p className="mx-auto inline-flex rounded-full border border-[#00e47c]/40 bg-[#00e47c]/10 px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#00e47c]">
          Proven Method
        </p>
        <h1 className="mt-9 text-[clamp(3.1rem,11vw,7.4rem)] font-black uppercase leading-[0.88] tracking-normal text-white">
          Make Money
          <span className="mt-2 block text-[#00e47c]">Fixing Computers</span>
        </h1>
        <p className="mx-auto mt-9 max-w-2xl text-lg leading-8 text-[#c9d0d8] sm:text-xl">
          Learn how to turn a simple skill into $500-$1,500/month in extra income - no expensive courses,
          no advanced experience required.
        </p>
        <div className="mx-auto mt-12 max-w-sm rounded-[8px] border border-white/15 bg-white/[0.06] px-8 py-8 shadow-[0_24px_70px_rgba(0,0,0,.45)]">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-[#9ca3af]">Instant Access For Only</p>
          <p className="mt-4 text-6xl font-black text-[#00e47c]">
            <span className="align-top text-2xl">$</span>37
          </p>
        </div>
        <CtaButton className="mx-auto mt-9" label="Get Instant Access" />
        <p className="mt-5 text-sm text-[#9ca3af]">Secure payment | Instant access</p>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section className="border-b border-white/10 bg-[#0b0b0b] px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl">
        <Eyebrow>The Problem</Eyebrow>
        <SectionTitle>Does This Sound Like You?</SectionTitle>
        <p className="mt-7 max-w-3xl text-lg leading-8 text-[#d7dde5]">
          Thousands of people want extra income but feel stuck because they think they need a lot to get started.
          The truth is different.
        </p>
        <div className="mt-10 grid gap-4">
          {problems.map((item) => (
            <div className="rounded-[8px] border border-white/12 bg-white/[0.055] px-5 py-5 text-base text-[#e5e7eb]" key={item}>
              <span className="mr-4 font-black text-[#ff4c4c]">X</span>
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section className="border-b border-white/10 bg-[#101010] px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <Eyebrow>What You Get</Eyebrow>
        <SectionTitle>Everything You Need To Get Started</SectionTitle>
        <p className="mt-5 text-lg text-[#d7dde5]">A complete, straight-to-the-point guide to go from zero to paying clients.</p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((item) => (
            <article className="min-h-56 rounded-[8px] border border-white/12 bg-[#0b0b0b] p-7 shadow-[0_18px_42px_rgba(0,0,0,.25)]" key={item.title}>
              <div className="mb-6 grid h-11 w-11 place-items-center rounded-full border border-[#00e47c]/30 bg-[#00e47c]/10 text-sm font-black text-[#00e47c]">
                {item.icon}
              </div>
              <h3 className="text-lg font-black text-white">{item.title}</h3>
              <p className="mt-4 leading-7 text-[#9aa3af]">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FitSection() {
  return (
    <section className="border-b border-white/10 bg-[#090909] px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <Eyebrow>Who This Is For</Eyebrow>
        <SectionTitle>This Guide Is For You If...</SectionTitle>
        <div className="mt-9 grid gap-5 text-lg text-[#edf2f7]">
          {fitItems.map((item) => (
            <p key={item}>
          <span className="mr-4 font-black text-[#00e47c]">OK</span>
              {item}
            </p>
          ))}
        </div>
        <div className="mt-14 rounded-[8px] border border-[#00e47c]/35 bg-[#00e47c]/10 px-5 py-12 text-center">
          <p className="text-[clamp(4rem,13vw,6.5rem)] font-black uppercase leading-none text-[#00e47c]">$1,500 / mo</p>
          <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-[#d7dde5]">
            is what you can realistically earn serving clients in your area with consistent effort.
          </p>
        </div>
      </div>
    </section>
  );
}

function GuaranteeSection() {
  return (
    <section className="border-b border-white/10 bg-[#090909] px-5 py-20 text-center sm:py-28">
      <div className="mx-auto max-w-4xl">
        <div className="mx-auto mb-7 grid h-24 w-24 place-items-center rounded-full border-2 border-[#00e47c] bg-[#00e47c]/10 text-4xl">
          <span aria-hidden="true">Shield</span>
        </div>
        <Eyebrow>Guarantee</Eyebrow>
        <SectionTitle centered>7-Day Money-Back Guarantee</SectionTitle>
        <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-[#d7dde5]">
          If for any reason you are not satisfied, we will refund 100% of your money within 7 days.
          No hassle, no questions asked.
        </p>
      </div>
    </section>
  );
}

function FinalOffer() {
  return (
    <section className="bg-[#151515] px-5 py-20 text-center sm:py-28">
      <div className="mx-auto max-w-3xl">
        <Eyebrow>Special Offer</Eyebrow>
        <SectionTitle centered>Start Today</SectionTitle>
        <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#d7dde5]">
          Instant access to the full guide. You could have your first client by the end of this week.
        </p>
        <p className="mt-12 text-5xl font-black text-[#00e47c]">
          $37 <span className="text-base font-medium text-[#9aa3af]">one-time</span>
        </p>
        <CtaButton className="mx-auto mt-10" label="Claim My Access Now" />
        <p className="mt-7 text-sm text-[#9aa3af]">Secure Payment | Instant Access | 7-Day Guarantee</p>
      </div>
    </section>
  );
}

function CtaButton({ label, className = "" }: { label: string; className?: string }) {
  return (
    <a
      className={`flex min-h-16 w-full max-w-[360px] items-center justify-center rounded-[8px] bg-[#00e47c] px-6 text-base font-black uppercase tracking-normal text-black shadow-[0_18px_55px_rgba(0,228,124,.25)] transition hover:bg-[#28f291] active:scale-[0.99] ${className}`}
      href={CHECKOUT_URL}
      rel="noreferrer"
      target="_blank"
    >
      {label} -&gt;
    </a>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-sm font-black uppercase tracking-[0.22em] text-[#00e47c]">{children}</p>;
}

function SectionTitle({ children, centered = false }: { children: ReactNode; centered?: boolean }) {
  return (
    <h2 className={`mt-4 text-[clamp(2.4rem,7vw,4.2rem)] font-black uppercase leading-[0.95] tracking-normal text-white ${centered ? "mx-auto" : ""}`}>
      {children}
    </h2>
  );
}
