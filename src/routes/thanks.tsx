import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/thanks")({
  head: () => ({
    meta: [
      { title: "Task Partners | Purchase Confirmed" },
      {
        name: "description",
        content: "Your Task Partners purchase has been confirmed. Access your workspace and included resources.",
      },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: ThanksPage,
});

const css = `
.tp-thanks {
  --bg: #f8fafc;
  --ink: #0f172a;
  --muted: #475569;
  --line: #e2e8f0;
  --blue: #2563eb;
  --blue-dark: #1d4ed8;
  --green: #10b981;
  min-height: 100dvh;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--ink);
  background:
    radial-gradient(circle at 50% -10%, rgba(37, 99, 235, 0.10), transparent 34rem),
    linear-gradient(180deg, #ffffff 0%, var(--bg) 42%, #eef4fb 100%);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
}
.tp-thanks * { box-sizing: border-box; }
.tp-thanks a:focus-visible { outline: 3px solid rgba(37, 99, 235, 0.35); outline-offset: 4px; }
.tp-shell { width: 100%; max-width: 880px; }
.tp-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 22px;
  font-weight: 900;
  font-size: 1.08rem;
  letter-spacing: -0.03em;
}
.tp-brand-mark {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: var(--ink);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.14);
}
.tp-progress {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  margin: 0 auto 18px;
  max-width: 540px;
}
.tp-step {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 800;
}
.tp-step::before {
  content: "";
  position: absolute;
  top: 11px;
  left: calc(-50% + 14px);
  width: calc(100% - 28px);
  height: 2px;
  background: var(--line);
}
.tp-step:first-child::before { display: none; }
.tp-step.tp-done::before { background: var(--green); }
.tp-dot {
  position: relative;
  z-index: 1;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--line);
  background: #fff;
  color: var(--muted);
}
.tp-done .tp-dot { border-color: var(--green); background: var(--green); color: #fff; }
.tp-current .tp-dot { border-color: var(--blue); box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.10); }
.tp-card {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 28px 90px rgba(15, 23, 42, 0.10), 0 2px 10px rgba(15, 23, 42, 0.04);
  padding: 28px;
  backdrop-filter: blur(10px);
}
.tp-center { text-align: center; }
.tp-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(16, 185, 129, 0.22);
  color: #047857;
  background: rgba(16, 185, 129, 0.08);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.14em;
}
.tp-check {
  width: 68px;
  height: 68px;
  margin: 22px auto 18px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, var(--green), #059669);
  box-shadow: 0 18px 42px rgba(16, 185, 129, 0.28);
}
.tp-title {
  margin: 0;
  font-size: clamp(2rem, 8vw, 3.6rem);
  line-height: 0.98;
  letter-spacing: -0.06em;
  font-weight: 950;
}
.tp-lead {
  margin: 18px auto 0;
  max-width: 640px;
  color: var(--ink);
  font-size: 1.05rem;
  line-height: 1.65;
  font-weight: 650;
}
.tp-sublead {
  margin: 10px auto 0;
  max-width: 650px;
  color: var(--muted);
  font-size: 0.98rem;
  line-height: 1.7;
}
.tp-button-row { margin-top: 28px; display: flex; justify-content: center; }
.tp-primary {
  min-height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 999px;
  padding: 0 26px;
  background: var(--blue);
  color: #fff;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 900;
  box-shadow: 0 16px 34px rgba(37, 99, 235, 0.22);
  transition: transform 180ms ease, background 180ms ease, box-shadow 180ms ease;
}
.tp-primary:hover { transform: translateY(-2px); background: var(--blue-dark); box-shadow: 0 20px 42px rgba(37, 99, 235, 0.27); }
.tp-grid { margin-top: 30px; display: grid; gap: 18px; text-align: left; }
.tp-box { border: 1px solid var(--line); border-radius: 20px; background: #fbfdff; padding: 20px; }
.tp-box h2 { margin: 0 0 14px; font-size: 1rem; letter-spacing: -0.03em; font-weight: 900; }
.tp-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.tp-list li { display: flex; align-items: center; gap: 10px; color: var(--muted); font-weight: 700; }
.tp-mini {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  color: var(--green);
  background: rgba(16, 185, 129, 0.10);
}
.tp-support { margin: 0; color: var(--muted); line-height: 1.7; font-weight: 600; }
.tp-email { display: inline-flex; margin-top: 12px; color: var(--blue); font-weight: 900; text-decoration: none; }
.tp-email:hover { text-decoration: underline; }
.tp-note {
  margin-top: 18px;
  border-radius: 16px;
  border: 1px solid #dbeafe;
  background: #eff6ff;
  padding: 14px 16px;
  color: #1e3a8a;
  font-size: 0.9rem;
  font-weight: 800;
  text-align: center;
}
.tp-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14px 22px;
  margin-top: 24px;
  color: #64748b;
  font-size: 0.86rem;
  font-weight: 750;
}
.tp-footer a { text-decoration: none; transition: color 160ms ease; }
.tp-footer a:hover { color: var(--blue); }
@media (min-width: 720px) {
  .tp-thanks { padding: 36px 24px; justify-content: center; }
  .tp-brand { justify-content: flex-start; margin-bottom: 28px; }
  .tp-card { padding: 42px; }
  .tp-grid { grid-template-columns: 1fr 1fr; }
}
`;

const CheckIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function ThanksPage() {
  return (
    <>
      <style>{css}</style>
      <main className="tp-thanks">
        <div className="tp-shell">
          <header className="tp-brand" aria-label="Task Partners">
            <span className="tp-brand-mark" aria-hidden="true">
              <CheckIcon size={19} />
            </span>
            <span>Task Partners</span>
          </header>

          <nav className="tp-progress" aria-label="Onboarding progress">
            <div className="tp-step tp-done">
              <span className="tp-dot" aria-hidden="true"><CheckIcon size={13} /></span>
              <span>Purchase</span>
            </div>
            <div className="tp-step tp-done">
              <span className="tp-dot" aria-hidden="true"><CheckIcon size={13} /></span>
              <span>Account</span>
            </div>
            <div className="tp-step tp-current" aria-current="step">
              <span className="tp-dot" aria-hidden="true" />
              <span>Workspace</span>
            </div>
          </nav>

          <section className="tp-card" aria-labelledby="thanks-title">
            <div className="tp-center">
              <span className="tp-badge">PURCHASE CONFIRMED</span>
              <div className="tp-check" aria-hidden="true">
                <CheckIcon size={34} />
              </div>
              <h1 id="thanks-title" className="tp-title">Welcome to Task Partners</h1>
              <p className="tp-lead">Thank you for your purchase. Your Task Partners account has been successfully activated.</p>
              <p className="tp-sublead">
                You can now sign in to your workspace, access your dashboard, manage your account, and explore the available resources.
              </p>
              <div className="tp-button-row">
                <a className="tp-primary" href="https://taskpartners.live/tasks-app" aria-label="Go to Task Partners dashboard">
                  Go to Dashboard
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="tp-grid">
              <section className="tp-box" aria-labelledby="next-title">
                <h2 id="next-title">What's next?</h2>
                <ul className="tp-list">
                  <li><span className="tp-mini" aria-hidden="true"><CheckIcon size={12} /></span>Sign in to your workspace</li>
                  <li><span className="tp-mini" aria-hidden="true"><CheckIcon size={12} /></span>Complete your profile</li>
                  <li><span className="tp-mini" aria-hidden="true"><CheckIcon size={12} /></span>Access your dashboard</li>
                  <li><span className="tp-mini" aria-hidden="true"><CheckIcon size={12} /></span>Contact support if needed</li>
                </ul>
              </section>

              <section className="tp-box" aria-labelledby="support-title">
                <h2 id="support-title">Need help?</h2>
                <p className="tp-support">For access, account, refund, or billing questions, contact our support team.</p>
                <a className="tp-email" href="mailto:support@taskpartners.live">support@taskpartners.live</a>
              </section>
            </div>

            <p className="tp-note">The charge will be processed by Digistore24.com.</p>
          </section>

          <footer className="tp-footer" aria-label="Footer links">
            <a href="https://taskpartners.live/privacy">Privacy Policy</a>
            <a href="https://taskpartners.live/terms">Terms of Service</a>
            <a href="https://taskpartners.live/refund">Refund Policy</a>
            <a href="https://taskpartners.live/contact">Contact</a>
          </footer>
        </div>
      </main>
    </>
  );
}
