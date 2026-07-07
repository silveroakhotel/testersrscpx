import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  History,
  Loader2,
  LockKeyhole,
  MessageCircle,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/tasks-app")({
  head: () => ({
    meta: [
      { title: "Premium Task Hub" },
      {
        name: "description",
        content:
          "A premium mobile-first task dashboard for long-form video reviews, retention scoring, and reward simulation.",
      },
    ],
  }),
  component: TasksApp,
});

type Task = {
  title: string;
  creator: string;
  length: string;
  reward: number;
  gradient: string;
};

const tasks: Task[] = [
  {
    title: "Brand Lift Study",
    creator: "Creator Analytics",
    length: "02:48",
    reward: 18.75,
    gradient: "from-cyan-400 via-blue-500 to-emerald-400",
  },
  {
    title: "Product Demo Review",
    creator: "Commerce Lab",
    length: "03:12",
    reward: 21.4,
    gradient: "from-emerald-300 via-teal-500 to-cyan-500",
  },
  {
    title: "Retention Quality Audit",
    creator: "Insights Studio",
    length: "04:05",
    reward: 24.9,
    gradient: "from-blue-400 via-indigo-500 to-emerald-300",
  },
];

const processingSteps = [
  "Analyzing comment consistency...",
  "Validating video retention...",
  "Checking engagement quality...",
  "Processing reward...",
];

const fakeWithdrawals = ["Madison just withdrew $150.00", "Ethan completed a $92.40 task", "Sophia unlocked Premium rewards"];

const dashboardTabs: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: "high", label: "High Reward Videos", icon: Play },
  { id: "daily", label: "Daily Tasks", icon: CheckCircle2 },
  { id: "history", label: "Withdrawal History", icon: History },
  { id: "support", label: "VIP Support", icon: MessageCircle },
];

function TasksApp() {
  const [registered, setRegistered] = useState(false);
  const [isSubmittingSignup, setIsSubmittingSignup] = useState(false);
  const [activeTab, setActiveTab] = useState("high");
  const [taskIndex, setTaskIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [balance, setBalance] = useState(124.8);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [toastIndex, setToastIndex] = useState(0);
  const [showToast, setShowToast] = useState(true);

  const task = tasks[taskIndex % tasks.length];
  const canSubmit = progress >= 100 && rating > 0 && comment.trim().length >= 12;
  const displayBalance = useMemo(() => balance.toLocaleString("en-US", { style: "currency", currency: "USD" }), [balance]);

  useEffect(() => {
    if (!registered || processing) return;
    setProgress(0);
    const timer = window.setInterval(() => {
      setProgress((value) => Math.min(100, value + 2));
    }, 900);
    return () => window.clearInterval(timer);
  }, [registered, taskIndex, processing]);

  useEffect(() => {
    const cycle = window.setInterval(() => {
      setShowToast(true);
      setToastIndex((value) => (value + 1) % fakeWithdrawals.length);
      window.setTimeout(() => setShowToast(false), 3000);
    }, 7000);
    return () => window.clearInterval(cycle);
  }, []);

  function finishSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmittingSignup(true);
    window.setTimeout(() => {
      setIsSubmittingSignup(false);
      setRegistered(true);
    }, 900);
  }

  function submitTask() {
    if (!canSubmit) return;
    setProcessing(true);
    setProcessingStep(0);
    let step = 0;
    const interval = window.setInterval(() => {
      step += 1;
      setProcessingStep(Math.min(step, processingSteps.length - 1));
      if (step >= processingSteps.length) {
        window.clearInterval(interval);
        setBalance((value) => Number((value + task.reward).toFixed(2)));
        setTaskIndex((value) => value + 1);
        setRating(0);
        setComment("");
        setProcessing(false);
      }
    }, 1500);
  }

  if (!registered) {
    return (
      <main className="min-h-dvh bg-[#0B0F19] px-4 py-5 text-white">
        <section className="mx-auto flex min-h-[calc(100dvh-40px)] w-full max-w-[430px] flex-col">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-[#07111f]">
                <Sparkles size={22} strokeWidth={2.8} />
              </div>
              <div>
                <p className="text-sm font-black tracking-wide">Premium Task Hub</p>
                <p className="text-xs text-slate-400">Lifetime access</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold text-emerald-300">
              <BadgeCheck size={13} /> Verified
            </span>
          </div>

          <div className="mb-6">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">
              <ShieldCheck size={14} /> Premium Account Active
            </p>
            <h1 className="text-[34px] font-black leading-[1.02] tracking-normal">App updated successfully!</h1>
            <p className="mt-4 text-[15px] leading-6 text-slate-300">
              Your account is already qualified. Finish the quick registration below to unlock lifetime access and keep earning with the new tasks.
            </p>
          </div>

          <form onSubmit={finishSignup} className="space-y-3 rounded-[8px] border border-white/10 bg-slate-900/80 p-4 shadow-2xl shadow-cyan-950/30">
            <SignupField label="Full Name" placeholder="Madison Carter" autoComplete="name" />
            <SignupField label="Email" placeholder="you@email.com" type="email" autoComplete="email" />
            <SignupField label="Mobile Phone" placeholder="(555) 012-4488" type="tel" autoComplete="tel" />
            <SignupField label="Password" placeholder="Create a secure password" type="password" autoComplete="new-password" />
            <button
              type="submit"
              className="mt-2 flex h-13 w-full items-center justify-center gap-2 rounded-[8px] bg-cyan-400 text-[15px] font-black text-[#06111f] shadow-lg shadow-cyan-400/20 transition active:scale-[0.98]"
            >
              {isSubmittingSignup ? <Loader2 className="animate-spin" size={18} /> : <LockKeyhole size={18} />}
              Complete Registration & Open Dashboard
            </button>
          </form>

          <div className="mt-auto grid grid-cols-3 gap-2 pt-5 text-center">
            {["Verified Tasks", "Instant Scoring", "VIP Support"].map((label) => (
              <div key={label} className="rounded-[8px] border border-white/10 bg-white/[0.04] p-3 text-[11px] font-bold text-slate-300">
                {label}
              </div>
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#0B0F19] text-white">
      <section className="relative mx-auto min-h-dvh w-full max-w-[430px] px-4 pb-7 pt-4">
        {showToast && (
          <div className="fixed left-1/2 top-3 z-40 flex w-[min(392px,calc(100vw-28px))] -translate-x-1/2 items-center gap-2 rounded-[8px] border border-emerald-400/20 bg-slate-950/95 px-3 py-2 text-xs font-bold text-emerald-200 shadow-xl shadow-black/30">
            <Bell size={14} />
            {fakeWithdrawals[toastIndex]}
          </div>
        )}

        <header className="mb-4 rounded-[8px] border border-white/10 bg-slate-900/90 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Available Balance</p>
              <p className="mt-1 text-[32px] font-black leading-none text-white">{displayBalance}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-gradient-to-br from-cyan-300 to-emerald-300 text-[#06111f]">
              <UserRound size={25} strokeWidth={2.6} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusPill icon={<BadgeCheck size={13} />} label="Verified User" />
            <StatusPill icon={<Trophy size={13} />} label="Premium Active" />
          </div>
        </header>

        <nav className="mb-4 grid grid-cols-2 gap-2">
          {dashboardTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex min-h-12 items-center gap-2 rounded-[8px] border px-3 text-left text-xs font-black transition ${
                activeTab === id ? "border-cyan-300 bg-cyan-300 text-[#07111f]" : "border-white/10 bg-slate-900 text-slate-300"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <section className="rounded-[8px] border border-white/10 bg-slate-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Task #{taskIndex + 1}</p>
              <h2 className="text-xl font-black">{task.title}</h2>
              <p className="text-xs text-slate-400">{task.creator} • {task.length}</p>
            </div>
            <div className="rounded-[8px] bg-emerald-400/10 px-3 py-2 text-right">
              <p className="text-[10px] font-bold uppercase text-emerald-200">Reward</p>
              <p className="text-sm font-black text-emerald-300">${task.reward.toFixed(2)}</p>
            </div>
          </div>

          <div className={`relative flex aspect-[9/14] max-h-[520px] w-full items-center justify-center overflow-hidden rounded-[8px] bg-gradient-to-br ${task.gradient}`}>
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-black/45 backdrop-blur">
              <Play className="ml-1 fill-white text-white" size={34} />
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="rounded-[8px] bg-black/45 p-3 backdrop-blur">
                <p className="text-sm font-black">Long-form video simulation</p>
                <p className="mt-1 text-xs text-slate-200">Watch time and review quality are required.</p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="inline-flex items-center gap-1"><Clock3 size={13} /> Watch for 45 seconds to unlock reward</span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-cyan-300 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">Quality score</p>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`flex h-11 items-center justify-center rounded-[8px] border transition ${
                    rating >= star ? "border-emerald-300 bg-emerald-300 text-[#07111f]" : "border-white/10 bg-slate-950 text-slate-500"
                  }`}
                >
                  <Star size={18} fill={rating >= star ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400">Validation comment</span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="min-h-24 w-full resize-none rounded-[8px] border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300"
              placeholder="Leave a constructive comment about the video for algorithm validation."
            />
          </label>

          <button
            onClick={submitTask}
            disabled={!canSubmit}
            className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-[8px] bg-cyan-300 text-sm font-black text-[#07111f] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            Validate Watch Time & Add Balance
            <ChevronRight size={18} />
          </button>
        </section>
      </section>

      {processing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050814]/95 px-6 text-center text-white">
          <div className="w-full max-w-[360px]">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-300/10">
              <Loader2 className="animate-spin text-cyan-200" size={38} />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Processing Reward</p>
            <h2 className="mt-3 text-2xl font-black">{processingSteps[processingStep]}</h2>
            <div className="mt-6 grid grid-cols-4 gap-2">
              {processingSteps.map((step, index) => (
                <div key={step} className={`h-2 rounded-full ${index <= processingStep ? "bg-cyan-300" : "bg-slate-800"}`} />
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SignupField({
  label,
  placeholder,
  type = "text",
  autoComplete,
}: {
  label: string;
  placeholder: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-300">{label}</span>
      <input
        required
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="h-12 w-full rounded-[8px] border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300"
      />
    </label>
  );
}

function StatusPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-slate-200">
      {icon}
      {label}
    </span>
  );
}
