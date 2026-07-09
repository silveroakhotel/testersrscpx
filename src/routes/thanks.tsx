import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/thanks")({
  head: () => ({
    meta: [
      { title: "Account Ready | Task Partners" },
      {
        name: "description",
        content: "Your Task Partners account is ready. Access your workspace and included resources.",
      },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: ThanksPage,
});

function ThanksPage() {
  return (
    <main className="min-h-dvh bg-[#F8FAFC] px-5 py-8 text-[#0F172A]">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:p-12">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563EB] text-white">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[#10B981]">Workspace Ready</p>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Your Task Partners account is ready</h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600">
            Thank you for your purchase. You can now access your Task Partners workspace and download your included resources.
          </p>
          <a
            href="/tasks-app"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-[#2563EB] px-7 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-[#1D4ED8]"
          >
            Open Workspace
          </a>
          <p className="mt-6 text-sm font-medium text-slate-500">The charge will be processed by Digistore24.com.</p>
        </div>
      </section>
    </main>
  );
}
