import { Check, FileCheck2, Landmark, MapPin, ReceiptText, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export type PipelineUser = { name: string; email: string };

export type WithdrawalState = {
  amount: number;
  emailsSent: string[];
  method: string;
  micro1: string;
  micro2: string;
  reference: string;
  requestedAt: string;
  stage: number;
  stageStartedAt: string;
  stageActivated?: boolean;
  tasks: Record<string, boolean>;
};

type WithdrawalStage = {
  id: "verification" | "compliance" | "batch" | "released";
  days: number;
  email: "withdrawal_verification" | "withdrawal_compliance" | "withdrawal_batch" | "withdrawal_scheduled";
  label: string;
  badge: string;
  headline: string;
  text: string;
  processing: string;
  pending: string;
};

export const WITHDRAWAL_STAGES: WithdrawalStage[] = [
  {
    id: "verification",
    days: 5,
    email: "withdrawal_verification",
    label: "Additional Verification",
    badge: "Action required",
    headline: "Additional verification in progress",
    text: "Your payout requires additional account verification. Complete the pending items below so our review team can validate your account. Verification is completed within 5 business days of the request.",
    processing:
      "Your withdrawal is being processed. Our verification team is validating the account and ownership details linked to this payout, and we allow up to 5 business days to complete this stage. You do not need to submit the request again.",
    pending:
      "Additional verification has not started yet. Once you open this stage, our team is notified and we allow up to 5 business days to validate your account details.",
  },
  {
    id: "compliance",
    days: 7,
    email: "withdrawal_compliance",
    label: "Compliance Review",
    badge: "Enhanced review",
    headline: "Your account is under enhanced review due to the withdrawal amount",
    text: "High-value creator payouts go through Enhanced Due Diligence before approval. Confirm the source of your funds below. Enhanced review is completed within 7 business days.",
    processing:
      "Your withdrawal is under compliance review. Because of the payout amount, an analyst is completing an Enhanced Due Diligence check on this account, and we allow up to 7 business days for this review. Your balance stays reserved for this payout during the review.",
    pending:
      "Compliance review has not started yet. When you open this stage, your case enters the analyst queue and we allow up to 7 business days to close the review.",
  },
  {
    id: "batch",
    days: 7,
    email: "withdrawal_batch",
    label: "Payout Batch",
    badge: "Approved",
    headline: "Your withdrawal has been approved and is now in the next payout batch",
    text: "Payouts are transmitted in scheduled batches. Your funds are locked in for the next batch window, transmitted within 7 business days. No further action is required from you.",
    processing:
      "Your withdrawal has been approved and is queued in the next payout batch. Payouts are transmitted in scheduled batch windows, and we allow up to 7 business days for your batch to be sent to your provider. No further action is required from you.",
    pending:
      "Your payout batch has not been scheduled yet. When you open this stage, your withdrawal is placed in the next batch window, and we allow up to 7 business days for transmission.",
  },
  {
    id: "released",
    days: 0,
    email: "withdrawal_scheduled",
    label: "Released",
    badge: "Released",
    headline: "Payout released to your account",
    text: "Your payout batch has been transmitted. Depending on your provider, the credit posts within 1-3 business days.",
    processing:
      "Your payout has been released. The batch containing this withdrawal was transmitted to your provider and, depending on your bank or wallet, the credit posts within 1-3 business days.",
    pending: "",
  },
];


const WITHDRAWAL_STATE_PREFIX = "ttp_withdrawal_state:";

export function withdrawalStateKey(email: string) {
  return `${WITHDRAWAL_STATE_PREFIX}${email.toLowerCase()}`;
}

export function readWithdrawalState(email: string): WithdrawalState | null {
  try {
    const raw = window.localStorage.getItem(withdrawalStateKey(email));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WithdrawalState;
    if (typeof parsed?.stage !== "number") return null;
    return { ...parsed, emailsSent: parsed.emailsSent ?? [], tasks: parsed.tasks ?? {} };
  } catch {
    return null;
  }
}

export function writeWithdrawalState(email: string, state: WithdrawalState) {
  try {
    window.localStorage.setItem(withdrawalStateKey(email), JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}

export function buildWithdrawalReference(email: string) {
  const seed = Math.abs(Array.from(email).reduce((total, char) => (total * 31 + char.charCodeAt(0)) % 999983, 7)) % 100000;
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  return `TP-${String(seed).padStart(5, "0")}-${stamp}`;
}

function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function addBusinessDays(from: Date, businessDays: number) {
  const cursor = new Date(from.getTime());
  let left = businessDays;
  while (left > 0) {
    cursor.setDate(cursor.getDate() + 1);
    if (!isWeekend(cursor)) left -= 1;
  }
  return cursor;
}

export function businessDaysBetween(from: number, to: number) {
  if (to <= from) return 0;
  const cursor = new Date(from);
  let count = 0;
  while (cursor.getTime() < to) {
    cursor.setDate(cursor.getDate() + 1);
    if (!isWeekend(cursor) && cursor.getTime() <= to) count += 1;
  }
  return count;
}

export function stageEndsAt(state: WithdrawalState) {
  const stage = WITHDRAWAL_STAGES[Math.min(state.stage, WITHDRAWAL_STAGES.length - 1)];
  const start = new Date(state.stageStartedAt);
  if (stage.days <= 0) return start.getTime();
  return addBusinessDays(start, stage.days).getTime();
}


export function sendWithdrawalEmail(user: PipelineUser, template: string, state: WithdrawalState) {
  void fetch("/api/public/send-access-email", {
    body: JSON.stringify({
      amount: state.amount,
      balance: state.amount,
      email: user.email,
      name: user.name,
      reference: state.reference,
      template,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  }).catch((error) => {
    console.warn("[Task Partners] withdrawal email failed", error);
  });
}

function money(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function longDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function WithdrawalTracker(props: {
  state: WithdrawalState;
  user: PipelineUser;
  onChange: (next: WithdrawalState) => void;
}) {
  const { state, user, onChange } = props;
  const [now, setNow] = useState(() => Date.now());
  const stageIndex = Math.min(state.stage, WITHDRAWAL_STAGES.length - 1);
  const stage = WITHDRAWAL_STAGES[stageIndex];
  const isFinal = stage.id === "released";
  const activated = state.stageActivated !== false;
  const endsAt = stageEndsAt(state);
  const remaining = Math.max(0, endsAt - now);
  
  const startedAt = new Date(state.stageStartedAt).getTime();
  const progressPct = isFinal ? 100 : !activated ? 0 : Math.min(100, Math.max(4, ((now - startedAt) / Math.max(1, endsAt - startedAt)) * 100));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);


  useEffect(() => {
    if (!activated) return;
    const key = `stage_${stage.id}`;
    if (state.emailsSent.includes(key)) return;
    sendWithdrawalEmail(user, stage.email, state);
    onChange({ ...state, emailsSent: [...state.emailsSent, key] });
  }, [activated, onChange, stage.email, stage.id, state, user]);

  useEffect(() => {
    if (isFinal || !activated || remaining > 0) return;
    onChange({
      ...state,
      stage: stageIndex + 1,
      stageActivated: false,
      stageStartedAt: new Date().toISOString(),
    });
  }, [activated, isFinal, onChange, remaining, stageIndex, state]);

  function startStage() {
    onChange({ ...state, stageActivated: true, stageStartedAt: new Date().toISOString() });
  }

  function toggleTask(key: string) {
    onChange({ ...state, tasks: { ...state.tasks, [key]: !state.tasks[key] } });
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-black text-[#0F172A]">Withdrawal Status</h1>

      <section className="overflow-hidden rounded-[14px] bg-[#010101] p-5 text-white shadow-[0_18px_40px_rgba(1,1,1,.25)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#25F4EE]">Creator Payouts</p>
            <p className="mt-1 text-[32px] font-black leading-none">{money(state.amount)}</p>
            <p className="mt-2 truncate text-[11px] font-bold text-white/60">Ref {state.reference} · {state.method}</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#FE2C55] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]">{stage.badge}</span>
        </div>

        <div className="mt-5 rounded-[10px] border border-white/10 bg-white/[0.06] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/50">Current stage</p>
          <p className="mt-1 text-lg font-black">{stage.label}</p>
          {isFinal ? (
            <p className="mt-2 text-sm font-bold leading-6 text-white/70">{stage.processing}</p>
          ) : !activated ? (
            <>
              <p className="mt-2 text-sm font-bold leading-6 text-white/75">{stage.pending}</p>
              <button
                type="button"
                onClick={startStage}
                className="mt-3 h-11 w-full rounded-[8px] bg-[#25F4EE] text-sm font-black text-black"
              >
                Begin review
              </button>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm font-bold leading-6 text-white/75">{stage.processing}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-[#25F4EE] to-[#FE2C55]" style={{ width: `${progressPct}%` }} />
              </div>
            </>
          )}
        </div>

      </section>

      <section className="mt-4 rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black leading-6 text-[#0F172A]">{stage.headline}</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#475569]">{stage.text}</p>




        {stage.id === "released" && (
          <div className="mt-4 space-y-3 rounded-[8px] bg-[#F8FAFC] p-4 text-sm">
            <TrackerLine label="Amount released" value={money(state.amount)} />
            <TrackerLine label="Destination" value={state.method} />
            <TrackerLine label="Released on" value={longDate(new Date(state.stageStartedAt))} />
          </div>
        )}

        <p className="mt-5 text-[11px] font-bold leading-5 text-[#94A3B8]">
          Requested on {longDate(new Date(state.requestedAt))} · Reference {state.reference}. Status updates are also sent to your email at every stage.
        </p>
      </section>
    </div>
  );
}

function TrackerTask(props: {
  actionLabel: string;
  done: boolean;
  icon: ReactNode;
  onAction: () => void;
  text: string;
  title: string;
}) {
  return (
    <div className={`rounded-[8px] border p-4 ${props.done ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-[#F8FAFC]"}`}>
      <div className="flex items-center gap-2 text-[#0F172A]">
        <span className={props.done ? "text-emerald-600" : "text-[#FE2C55]"}>{props.icon}</span>
        <p className="text-sm font-black">{props.title}</p>
        {props.done && <Check className="ml-auto text-emerald-600" size={16} />}
      </div>
      <p className="mt-1 text-xs font-semibold leading-5 text-[#475569]">{props.text}</p>
      <button
        className={`mt-3 h-11 w-full rounded-[8px] text-sm font-black ${props.done ? "bg-emerald-600 text-white" : "bg-[#010101] text-white"}`}
        disabled={props.done}
        onClick={props.onAction}
        type="button"
      >
        {props.actionLabel}
      </button>
    </div>
  );
}

function TrackerLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-bold text-[#64748B]">{label}</span>
      <span className="text-sm font-black text-[#0F172A]">{value}</span>
    </div>
  );
}
