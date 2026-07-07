import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/white")({
  head: () => ({
    meta: [
      { title: "White Page" },
      { name: "description", content: "Route reserved for the public-facing white page." },
    ],
  }),
  component: WhitePage,
});

function WhitePage() {
  return (
    <main className="min-h-dvh bg-white text-slate-950">
      <section className="mx-auto flex min-h-dvh w-full max-w-5xl items-center justify-center px-6 py-16 text-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">White Page</p>
          <h1 className="mt-3 text-4xl font-black tracking-normal">Coming Soon</h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-600">
            This route is ready for the public-facing page content.
          </p>
        </div>
      </section>
    </main>
  );
}
