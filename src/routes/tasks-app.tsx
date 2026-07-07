import { createFileRoute } from "@tanstack/react-router";
import {
  AtSign,
  Check,
  CheckCircle2,
  Home,
  Loader2,
  LockKeyhole,
  LockKeyholeIcon,
  ReceiptText,
  Star,
  UserRound,
  Wallet,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/tasks-app")({
  head: () => ({
    meta: [
      { title: "Task Partners" },
      { name: "description", content: "Premium mobile task auditing app." },
    ],
  }),
  component: TaskPartnersApp,
});

type Screen = "tasks" | "wallet" | "refund" | "profile";
type Review = { date: string; title: string; reward: number; status: string };
type User = { name: string; email: string };
type VideoTask = {
  id: string;
  creator: string;
  title: string;
  videoUrl: string;
};

const INITIAL_BALANCE = 2800;
const MIN_WITHDRAWAL = 4000;
const DAYS_TO_GOAL = 7;
const DAILY_LIMIT = 6;
const TOTAL_TASKS_TO_GOAL = DAYS_TO_GOAL * DAILY_LIMIT;
const REWARD_PER_VIDEO = (MIN_WITHDRAWAL - INITIAL_BALANCE) / TOTAL_TASKS_TO_GOAL;

const tasks: VideoTask[] = [
  {
    id: "mrbeast-box",
    creator: "MrBeast",
    title: "Creator Task Partner",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  },
  {
    id: "zach-king-magic",
    creator: "Zach King",
    title: "Creator Task",
    videoUrl: "https://media.w3.org/2010/05/sintel/trailer.mp4",
  },
  {
    id: "dude-perfect-trickshots",
    creator: "Dude Perfect",
    title: "Creator Task Partner",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
  },
  {
    id: "mkbhd-smartphone",
    creator: "MKBHD",
    title: "Creator Task",
    videoUrl: "https://media.w3.org/2010/05/sintel/trailer.mp4",
  },
];

const processingSteps = ["Analyzing consistency...", "Validating retention...", "Checking review quality...", "Adding reward..."];
const paymentOptions = ["Cash App", "PayPal", "Venmo", "Zelle", "Bank Transfer"];

function TaskPartnersApp() {
  const [allowed, setAllowed] = useState(false);
  const [checkedGate, setCheckedGate] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState<Screen>("tasks");
  const [taskIndex, setTaskIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [rating, setRating] = useState(0);
  const [useful, setUseful] = useState("");
  const [recommend, setRecommend] = useState("");
  const [comment, setComment] = useState("");
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [pendingBalance] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [successReward, setSuccessReward] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState(paymentOptions[0]);
  const [paymentData, setPaymentData] = useState("");
  const [refundMethod, setRefundMethod] = useState(paymentOptions[0]);
  const [refundData, setRefundData] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundApproved, setRefundApproved] = useState(false);

  const task = tasks[taskIndex % tasks.length];
  const taskReviewKey = `${task.id}-${taskIndex}`;
  const completedToday = (reviews.length % DAILY_LIMIT) + 1;
  const reviewUnlocked = progress >= 100 && !reviewedIds.includes(taskReviewKey);
  const canSubmit = reviewUnlocked && rating > 0 && Boolean(useful) && Boolean(recommend) && comment.trim().length >= 15;
  const balanceText = useMemo(() => brl(balance), [balance]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isAllowed = params.get("utm_source") === "tiktok";
    setAllowed(isAllowed);
    setCheckedGate(true);
    if (!isAllowed) {
      Array.from(document.body.children).forEach((child) => {
        if (child.id !== "root") child.remove();
      });
    }
  }, []);

  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth > 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    setProgress(0);
  }, [taskIndex]);

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    window.setTimeout(() => {
      const nextUser = { name: signupName.trim(), email: signupEmail.trim() };
      setUser(nextUser);
      setLoading(false);
      if (remember) window.localStorage.setItem("ttp_session", JSON.stringify(nextUser));
    }, 700);
  }

  function submitReview() {
    if (!canSubmit) return;
    const completedTask = task;
    const completedKey = taskReviewKey;
    const reward = REWARD_PER_VIDEO;

    setSuccessReward(null);
    setReviewedIds((value) => [...value, completedKey]);
    setReviews((value) => [
      { date: new Date().toLocaleDateString("en-US"), title: completedTask.title, reward, status: "Approved" },
      ...value,
    ]);
    setBalance((value) => Number((value + reward).toFixed(2)));
    setRating(0);
    setUseful("");
    setRecommend("");
    setComment("");
    setProgress(0);
    setTaskIndex((value) => value + 1);

    setProcessing(true);
    setProcessingStep(0);
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      setProcessingStep(Math.min(step, processingSteps.length - 1));
      if (step >= processingSteps.length) {
        window.clearInterval(timer);
        setProcessing(false);
        setSuccessReward(reward);
        window.setTimeout(() => setSuccessReward(null), 2600);
      }
    }, 1250);
  }

  function requestRefund(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRefundLoading(true);
    window.setTimeout(() => {
      setRefundLoading(false);
      setRefundApproved(true);
    }, 1600);
  }

  if (!checkedGate) return null;
  if (!allowed) return <Server404 />;
  if (isDesktop) return <UnsupportedDevice />;

  if (!user) {
    return (
      <main className="min-h-dvh bg-[#F8FAFC] text-[#0F172A]">
        <section className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 py-5">
          <div className="flex items-center justify-center">
            <Brand />
          </div>
          <div className="flex flex-1 flex-col justify-center">
            <div className="mx-auto mb-8 grid h-24 w-24 place-items-center rounded-[28px] bg-white text-[#0F172A] shadow-[0_20px_45px_rgba(15,23,42,.12)]">
              <CheckCircle2 className="text-[#FE2C55]" size={42} />
            </div>
            <h1 className="text-center text-[30px] font-black leading-tight">Task Partners v2.4 - App Updated!</h1>
            <p className="mx-auto mt-3 max-w-[330px] text-center text-sm leading-6 text-[#475569]">
              Sign in or create your reviewer account to unlock premium video audit tasks.
            </p>
            <form onSubmit={login} className="mt-8 space-y-3">
              <AuthInput icon={<UserRound size={18} />} onChange={setSignupName} placeholder="Full name" type="text" value={signupName} />
              <AuthInput icon={<AtSign size={18} />} onChange={setSignupEmail} placeholder="Email address" type="email" value={signupEmail} />
              <AuthInput icon={<LockKeyhole size={18} />} onChange={setSignupPassword} placeholder="Password" type="password" value={signupPassword} />
              <label className="flex items-center justify-between rounded-[8px] border border-slate-200 bg-white px-4 py-3 text-sm font-bold shadow-sm">
                Keep me signed in
                <input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" className="h-5 w-5 accent-[#FE2C55]" />
              </label>
              <button className="flex h-13 w-full items-center justify-center gap-2 rounded-[8px] bg-[#FE2C55] font-black text-white shadow-lg shadow-rose-200 transition active:scale-[0.98]" type="submit">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                Login / Create Account
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="h-dvh overflow-hidden bg-[#F8FAFC] text-[#0F172A]">
      <section className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-[#F8FAFC]">
        <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#475569]">Balance</p>
              <p className="flex items-center gap-1 truncate text-[17px] font-black text-[#0F172A]"><Wallet size={18} className="text-[#2563EB]" />{balanceText}</p>
            </div>
            <div className="shrink-0 rounded-[8px] bg-[#F1F5F9] px-3 py-2 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#475569]">Daily Tasks</p>
              <p className="text-lg font-black text-[#FE2C55]">{Math.min(completedToday, DAILY_LIMIT)}/{DAILY_LIMIT}</p>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-28 pt-4">
          {screen === "tasks" && (
            <TasksScreen
              canSubmit={canSubmit}
              comment={comment}
              progress={progress}
              rating={rating}
              recommend={recommend}
              reviewUnlocked={reviewUnlocked}
              setComment={setComment}
              setProgress={setProgress}
              setRating={setRating}
              setRecommend={setRecommend}
              setUseful={setUseful}
              submitReview={submitReview}
              task={task}
              taskIndex={taskIndex}
              useful={useful}
            />
          )}
          {screen === "wallet" && (
            <WalletScreen
              balance={balance}
              pendingBalance={pendingBalance}
              paymentData={paymentData}
              paymentMethod={paymentMethod}
              setPaymentData={setPaymentData}
              setPaymentMethod={setPaymentMethod}
            />
          )}
          {screen === "refund" && (
            <RefundScreen
              approved={refundApproved}
              data={refundData}
              loading={refundLoading}
              method={refundMethod}
              onSubmit={requestRefund}
              setData={setRefundData}
              setMethod={setRefundMethod}
            />
          )}
          {screen === "profile" && <ProfileScreen reviews={reviews} user={user} balance={balance} />}
        </div>

        <BottomNav screen={screen} setScreen={setScreen} />
      </section>

      {processing && <ProcessingOverlay step={processingStep} />}
      {successReward !== null && (
        <div className="fixed left-1/2 top-[max(16px,env(safe-area-inset-top))] z-[60] w-[calc(100vw-32px)] max-w-[398px] -translate-x-1/2 rounded-[8px] bg-emerald-500 px-4 py-3 text-center text-sm font-black text-white shadow-2xl">
          +{brl(successReward)} Added to your balance!
        </div>
      )}
    </main>
  );
}

function TasksScreen(props: {
  canSubmit: boolean;
  comment: string;
  progress: number;
  rating: number;
  recommend: string;
  reviewUnlocked: boolean;
  setComment: (value: string) => void;
  setProgress: (value: number) => void;
  setRating: (value: number) => void;
  setRecommend: (value: string) => void;
  setUseful: (value: string) => void;
  submitReview: () => void;
  task: VideoTask;
  taskIndex: number;
  useful: string;
}) {
  const lockedTasks = Array.from({ length: Math.max(0, DAILY_LIMIT - 1) }, (_, index) => tasks[(props.taskIndex + index + 1) % tasks.length]);

  return (
    <div className="space-y-4">
      <section className="rounded-[8px] border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black text-[#FE2C55]">{props.task.creator}</p>
            <h1 className="text-xl font-black leading-tight text-[#0F172A]">{props.task.title}</h1>
            <p className="mt-1 text-xs font-semibold text-[#475569]">Reward: {brl(REWARD_PER_VIDEO)} per approved video</p>
          </div>
        </div>
        <div className="aspect-video w-full overflow-hidden rounded-[8px] bg-slate-950">
          <video
            key={props.task.id}
            className="h-full w-full object-cover"
            controls
            muted
            onEnded={() => props.setProgress(100)}
            onTimeUpdate={(event) => {
              const video = event.currentTarget;
              if (!Number.isFinite(video.duration) || video.duration <= 0) return;
              props.setProgress(Math.min(100, (video.currentTime / video.duration) * 100));
            }}
            playsInline
            preload="metadata"
            src={props.task.videoUrl}
          />
        </div>
      </section>

      <section className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-xs font-black text-[#475569]">
          <span>⚠️ Finish watching the video to unlock the review. ({Math.round(props.progress)}%)</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-[#FE2C55] transition-all duration-500" style={{ width: `${props.progress}%` }} />
        </div>
      </section>

      <section className="rounded-[8px] border border-slate-200 bg-[#F1F5F9] p-4 shadow-sm transition-all">
        {!props.reviewUnlocked ? (
          <div className="flex min-h-[210px] flex-col items-center justify-center text-center">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-white text-[#FE2C55] shadow-sm">
              <LockKeyholeIcon size={30} />
            </div>
            <h2 className="text-xl font-black text-[#0F172A]">Review Locked</h2>
            <p className="mt-2 max-w-[280px] text-sm leading-6 text-[#475569]">Complete task requirements above to unlock questions.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-black text-[#0F172A]">1. Rate the video quality</p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} className={`grid h-11 w-11 place-items-center rounded-full transition ${props.rating >= star ? "bg-[#FE2C55] text-white" : "bg-white text-slate-400"}`} onClick={() => props.setRating(star)} onMouseDown={(event) => event.preventDefault()} type="button">
                    <Star size={18} fill={props.rating >= star ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>
            <ChoiceRow label="2. Was the content useful?" value={props.useful} onChange={props.setUseful} />
            <ChoiceRow label="3. Would you recommend it?" value={props.recommend} onChange={props.setRecommend} />
            <label className="block">
              <span className="mb-2 block text-sm font-black text-[#0F172A]">4. Additional comments for the algorithm</span>
              <textarea
                className="min-h-28 w-full resize-none rounded-[8px] border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-[#0F172A] outline-none placeholder:text-slate-400 focus:border-[#2563EB]"
                onChange={(event) => props.setComment(event.target.value)}
                placeholder="Write at least 15 characters..."
                value={props.comment}
              />
            </label>
            <button className="min-h-13 w-full rounded-[8px] bg-[#FE2C55] px-4 py-3 text-sm font-black text-white shadow-lg shadow-rose-200 transition active:scale-[0.98] disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none" disabled={!props.canSubmit} onClick={props.submitReview} type="button">
              Submit Review & Claim Reward
            </button>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-black text-[#0F172A]">Pending Reviews</h2>
          <p className="text-xs font-semibold text-[#475569]">Complete the current review to unlock the next task in your daily queue.</p>
        </div>
        {lockedTasks.map((lockedTask, index) => (
          <div className="relative overflow-hidden rounded-[8px] border border-slate-200 bg-white p-3 shadow-sm" key={`${lockedTask.id}-${index}`}>
            <div className="flex items-center gap-3 blur-[3px]">
              <div className="h-16 w-24 shrink-0 rounded-[8px] bg-gradient-to-br from-slate-200 via-slate-300 to-slate-100" />
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-[#FE2C55]">{lockedTask.creator}</p>
                <p className="truncate text-sm font-black text-[#0F172A]">{lockedTask.title}</p>
                <p className="text-xs font-semibold text-[#475569]">{brl(REWARD_PER_VIDEO)} reward</p>
              </div>
            </div>
            <div className="absolute inset-0 grid place-items-center bg-white/45 backdrop-blur-sm">
              <div className="flex flex-col items-center text-center">
                <div className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-[#0F172A] text-white">
                  <LockKeyholeIcon size={19} />
                </div>
                <p className="max-w-[230px] text-xs font-black text-[#0F172A]">Complete the previous review to unlock this task.</p>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function WalletScreen(props: {
  balance: number;
  pendingBalance: number;
  paymentData: string;
  paymentMethod: string;
  setPaymentData: (value: string) => void;
  setPaymentMethod: (value: string) => void;
}) {
  const canWithdraw = props.balance >= MIN_WITHDRAWAL;
  return (
    <div>
      <h1 className="mb-4 text-2xl font-black text-[#0F172A]">Wallet</h1>
      <div className="grid gap-3">
        <MetricCard label="Current Balance" value={brl(props.balance)} tone="bg-white" />
        <MetricCard label="Pending Balance" value={brl(props.pendingBalance)} tone="bg-white" />
        <MetricCard label="Minimum Withdrawal" value={brl(MIN_WITHDRAWAL)} tone="bg-white" />
      </div>
      <div className="mt-5 rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-black text-[#0F172A]">Withdrawal method</p>
        <select className="mb-3 h-12 w-full rounded-[8px] border border-slate-200 bg-[#F8FAFC] px-4 text-sm font-bold text-[#0F172A]" value={props.paymentMethod} onChange={(event) => props.setPaymentMethod(event.target.value)}>
          {paymentOptions.map((method) => <option key={method}>{method}</option>)}
        </select>
        <input className="h-12 w-full rounded-[8px] border border-slate-200 bg-[#F8FAFC] px-4 text-sm font-bold text-[#0F172A] outline-none" value={props.paymentData} onChange={(event) => props.setPaymentData(event.target.value)} placeholder="Enter payment details" />
        <button className="mt-3 min-h-12 w-full rounded-[8px] bg-[#FE2C55] px-4 py-3 text-sm font-black text-white disabled:bg-slate-300 disabled:text-slate-500" disabled={!canWithdraw} type="button">
          {canWithdraw ? "Request Withdrawal" : "You need at least R$ 4.000,00 available before requesting a withdrawal"}
        </button>
      </div>
    </div>
  );
}

function RefundScreen(props: {
  approved: boolean;
  data: string;
  loading: boolean;
  method: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setData: (value: string) => void;
  setMethod: (value: string) => void;
}) {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-black text-[#0F172A]">Tax Refund Portal</h1>
      <section className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm leading-6 text-[#475569]">
          ✅ Tax Refund Pending: A fee of R$ 37.12 linked to your ID is eligible for instant refund. This will be deposited into your account in less than 24 hours. Enter your payout details below.
        </p>
        {props.approved ? (
          <div className="mt-5 rounded-[8px] border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-black text-emerald-700">
              Status: Processing... Your refund of R$ 37,12 has been approved and will be credited to your account in less than 24 hours.
            </p>
          </div>
        ) : (
          <form className="mt-5 space-y-3" onSubmit={props.onSubmit}>
            <select className="h-12 w-full rounded-[8px] border border-slate-200 bg-[#F8FAFC] px-4 text-sm font-bold text-[#0F172A]" value={props.method} onChange={(event) => props.setMethod(event.target.value)}>
              {paymentOptions.map((method) => <option key={method}>{method}</option>)}
            </select>
            <input className="h-12 w-full rounded-[8px] border border-slate-200 bg-[#F8FAFC] px-4 text-sm font-bold text-[#0F172A] outline-none" value={props.data} onChange={(event) => props.setData(event.target.value)} placeholder="Enter refund receiving details" required />
            <button className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-[#2563EB] px-4 py-3 text-sm font-black text-white disabled:bg-slate-300" disabled={props.loading} type="submit">
              {props.loading && <Loader2 className="animate-spin" size={18} />}
              Request Instant Refund
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

function ProfileScreen({ user, reviews, balance }: { user: User; reviews: Review[]; balance: number }) {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-black text-[#0F172A]">Profile</h1>
      <div className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-[#F1F5F9] text-[#0F172A]"><UserRound size={31} /></div>
          <div className="min-w-0">
            <p className="text-lg font-black">{user.name}</p>
            <p className="truncate text-sm font-bold text-[#475569]">{user.email}</p>
            <p className="mt-1 text-xs font-black text-[#2563EB]">Total balance: {brl(balance)}</p>
          </div>
        </div>
      </div>
      <h2 className="mb-3 mt-5 text-lg font-black text-[#0F172A]">Review History</h2>
      <div className="space-y-2">
        {(reviews.length ? reviews : [{ date: "Today", title: "No reviews yet", reward: 0, status: "Waiting" }]).map((review, index) => (
          <div key={`${review.title}-${index}`} className="rounded-[8px] border border-slate-200 bg-white p-3 text-sm shadow-sm">
            <div className="flex items-center justify-between gap-3 font-black"><span>{review.title}</span><span>{brl(review.reward)}</span></div>
            <div className="mt-1 flex items-center justify-between text-xs font-bold text-[#475569]"><span>{review.date}</span><span>{review.status}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BottomNav({ screen, setScreen }: { screen: Screen; setScreen: (screen: Screen) => void }) {
  return (
    <nav className="shrink-0 border-t border-slate-200 bg-white px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 text-[11px] font-black shadow-[0_-8px_24px_rgba(15,23,42,.08)]">
      <div className="grid grid-cols-4">
        <NavButton active={screen === "tasks"} icon={<Home size={21} />} label="Tasks" onClick={() => setScreen("tasks")} />
        <NavButton active={screen === "wallet"} icon={<Wallet size={21} />} label="Wallet" onClick={() => setScreen("wallet")} />
        <NavButton active={screen === "refund"} icon={<ReceiptText size={21} />} label="Refund" onClick={() => setScreen("refund")} />
        <NavButton active={screen === "profile"} icon={<UserRound size={21} />} label="Profile" onClick={() => setScreen("profile")} />
      </div>
    </nav>
  );
}

function ProcessingOverlay({ step }: { step: number }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-white/96 px-7 text-center text-[#0F172A]">
      <div className="w-full max-w-[340px]">
        <div className="mx-auto mb-7 grid h-20 w-20 place-items-center rounded-full bg-[#FE2C55] text-white shadow-xl shadow-rose-200">
          <Loader2 className="animate-spin" size={36} />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2563EB]">Processing review</p>
        <h2 className="mt-3 text-2xl font-black">{processingSteps[step]}</h2>
      </div>
    </div>
  );
}

function ChoiceRow({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <p className="mb-2 text-sm font-black text-[#0F172A]">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {["Yes", "No"].map((option) => (
          <button key={option} className={`h-11 rounded-[8px] text-sm font-black transition ${value === option ? "bg-[#FE2C55] text-white shadow-lg shadow-rose-100" : "bg-white text-[#475569]"}`} onClick={() => onChange(option)} onMouseDown={(event) => event.preventDefault()} type="button">
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return <button className={`flex h-14 flex-col items-center justify-center gap-1 rounded-[8px] ${active ? "bg-[#F1F5F9] text-[#FE2C55]" : "text-[#475569]"}`} onClick={onClick} type="button">{icon}<span>{label}</span></button>;
}

function AuthInput({
  icon,
  onChange,
  placeholder,
  type,
  value,
}: {
  icon: ReactNode;
  onChange: (value: string) => void;
  placeholder: string;
  type: string;
  value: string;
}) {
  return (
    <label className="flex h-13 items-center gap-3 rounded-[8px] border border-slate-200 bg-white px-4 text-[#0F172A] shadow-sm">
      {icon}
      <input
        required
        className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-slate-400"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <div className={`rounded-[8px] border border-slate-200 ${tone} p-4 shadow-sm`}><p className="text-xs font-black uppercase tracking-[0.16em] text-[#475569]">{label}</p><p className="mt-2 text-3xl font-black text-[#0F172A]">{value}</p></div>;
}

function Brand() {
  return <div className="flex items-center gap-2 text-lg font-black text-[#0F172A]"><span className="h-5 w-5 rounded-[6px] bg-[#25F4EE] shadow-[7px_0_0_#FE2C55]" /> Task Partners</div>;
}

function UnsupportedDevice() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#F8FAFC] px-6 text-center text-[#0F172A]">
      <div className="max-w-[420px] rounded-[8px] border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#FE2C55] text-white">
          <LockKeyholeIcon size={26} />
        </div>
        <h1 className="text-2xl font-black">Unsupported Device</h1>
        <p className="mt-3 text-sm leading-6 text-[#475569]">
          This application is available only on mobile devices (iOS/Android). Please open it from your smartphone.
        </p>
      </div>
    </main>
  );
}

function Server404() {
  return <main className="grid min-h-dvh place-items-center bg-white text-center text-black"><div><h1 className="text-5xl font-black">404</h1><p className="mt-3 text-lg text-zinc-600">Not Found</p></div></main>;
}

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
