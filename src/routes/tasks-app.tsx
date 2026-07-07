import { createFileRoute } from "@tanstack/react-router";
import {
  AtSign,
  Check,
  CheckCircle2,
  Home,
  Loader2,
  LockKeyhole,
  LockKeyholeIcon,
  Star,
  UserRound,
  Wallet,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/tasks-app")({
  head: () => ({
    meta: [
      { title: "TikTok Task Partners" },
      { name: "description", content: "Premium mobile task auditing app." },
    ],
  }),
  component: TaskPartnersApp,
});

type Screen = "tasks" | "wallet" | "profile";
type Review = { date: string; title: string; reward: number; status: string };
type User = { name: string; email: string };
type VideoTask = {
  id: string;
  creator: string;
  title: string;
  reward: number;
  videoUrl: string;
};

const tasks: VideoTask[] = [
  {
    id: "video-1",
    creator: "@audit_partner",
    title: "Creator Product Review",
    reward: 15,
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  },
  {
    id: "video-2",
    creator: "@brand_quality",
    title: "Campaign Retention Audit",
    reward: 18,
    videoUrl: "https://media.w3.org/2010/05/sintel/trailer.mp4",
  },
  {
    id: "video-3",
    creator: "@content_lab",
    title: "Engagement Signal Review",
    reward: 12,
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
  },
];

const processingSteps = ["Analyzing consistency...", "Validating retention...", "Checking review quality...", "Adding reward..."];

function TaskPartnersApp() {
  const [allowed, setAllowed] = useState(false);
  const [checkedGate, setCheckedGate] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState<Screen>("tasks");
  const [taskIndex, setTaskIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [rating, setRating] = useState(0);
  const [useful, setUseful] = useState("");
  const [recommend, setRecommend] = useState("");
  const [comment, setComment] = useState("");
  const [balance, setBalance] = useState(147.2);
  const [pendingBalance] = useState(52.8);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [successReward, setSuccessReward] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("PayPal Email");
  const [paymentData, setPaymentData] = useState("");

  const task = tasks[taskIndex % tasks.length];
  const dailyLimit = 5;
  const completedToday = reviews.length + 1;
  const reviewUnlocked = progress >= 100 && !reviewedIds.includes(task.id);
  const canSubmit = reviewUnlocked && rating > 0 && Boolean(useful) && Boolean(recommend) && comment.trim().length >= 15;
  const balanceText = useMemo(() => money(balance), [balance]);

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
    if (!allowed || !user || screen !== "tasks" || processing) return;
    setProgress(0);
    const timer = window.setInterval(() => {
      setProgress((value) => Math.min(100, value + 2.25));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [allowed, user, screen, taskIndex, processing]);

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    window.setTimeout(() => {
      setUser({ name: "Mia Carter", email: "reviewer@taskpartners.app" });
      setLoading(false);
      if (remember) window.localStorage.setItem("ttp_session", "reviewer@taskpartners.app");
    }, 700);
  }

  function submitReview() {
    if (!canSubmit) return;
    setProcessing(true);
    setProcessingStep(0);
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      setProcessingStep(Math.min(step, processingSteps.length - 1));
      if (step >= processingSteps.length) {
        window.clearInterval(timer);
        setReviewedIds((value) => [...value, task.id]);
        setReviews((value) => [
          { date: new Date().toLocaleDateString("en-US"), title: task.title, reward: task.reward, status: "Approved" },
          ...value,
        ]);
        setBalance((value) => Number((value + task.reward).toFixed(2)));
        setSuccessReward(task.reward);
        setRating(0);
        setUseful("");
        setRecommend("");
        setComment("");
        setTaskIndex((value) => value + 1);
        setProcessing(false);
        window.setTimeout(() => setSuccessReward(null), 2600);
      }
    }, 1250);
  }

  if (!checkedGate) return null;
  if (!allowed) return <Server404 />;
  if (isDesktop) return <UnsupportedDevice />;

  if (!user) {
    return (
      <main className="min-h-dvh bg-black text-white">
        <section className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 py-5">
          <div className="flex items-center justify-center">
            <Brand />
          </div>
          <div className="flex flex-1 flex-col justify-center">
            <div className="mx-auto mb-8 grid h-24 w-24 place-items-center rounded-[28px] bg-white text-black shadow-[8px_0_0_#25F4EE,-8px_0_0_#FE2C55]">
              <CheckCircle2 size={40} />
            </div>
            <h1 className="text-center text-[30px] font-black leading-tight">TikTok Task Partners v2.4 - App Updated!</h1>
            <p className="mx-auto mt-3 max-w-[330px] text-center text-sm leading-6 text-white/62">
              Sign in or create your reviewer account to unlock premium video audit tasks.
            </p>
            <form onSubmit={login} className="mt-8 space-y-3">
              <AuthInput icon={<AtSign size={18} />} placeholder="Email address" type="email" />
              <AuthInput icon={<LockKeyhole size={18} />} placeholder="Password" type="password" />
              <label className="flex items-center justify-between rounded-full bg-white/8 px-4 py-3 text-sm font-bold">
                Keep me signed in
                <input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" className="h-5 w-5 accent-[#FE2C55]" />
              </label>
              <button className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#FE2C55] font-black text-white transition active:scale-[0.98]" type="submit">
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
    <main className="min-h-dvh bg-black text-white">
      <section className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-black">
        <header className="fixed left-1/2 top-0 z-30 flex h-[72px] w-full max-w-[430px] -translate-x-1/2 items-center justify-between border-b border-white/10 bg-black/96 px-4 backdrop-blur">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-white/48">Available Balance</p>
            <p className="text-xl font-black text-[#25F4EE]">{balanceText}</p>
          </div>
          <div className="rounded-[12px] border border-white/10 bg-white/8 px-3 py-2 text-right">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-white/48">Daily Tasks</p>
            <p className="text-lg font-black">{Math.min(completedToday, dailyLimit)}/{dailyLimit}</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 pb-[88px] pt-[88px]">
          {screen === "tasks" && (
            <TasksScreen
              canSubmit={canSubmit}
              comment={comment}
              progress={progress}
              rating={rating}
              recommend={recommend}
              reviewUnlocked={reviewUnlocked}
              setComment={setComment}
              setRating={setRating}
              setRecommend={setRecommend}
              setUseful={setUseful}
              submitReview={submitReview}
              task={task}
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
          {screen === "profile" && <ProfileScreen reviews={reviews} user={user} balance={balance} />}
        </div>

        <BottomNav screen={screen} setScreen={setScreen} />
      </section>

      {processing && <ProcessingOverlay step={processingStep} />}
      {successReward !== null && (
        <div className="fixed left-1/2 top-5 z-50 w-[min(390px,calc(100vw-28px))] -translate-x-1/2 rounded-[18px] bg-emerald-400 px-4 py-3 text-center text-sm font-black text-black shadow-2xl">
          +{money(successReward)} Added to your balance!
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
  setRating: (value: number) => void;
  setRecommend: (value: string) => void;
  setUseful: (value: string) => void;
  submitReview: () => void;
  task: VideoTask;
  useful: string;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-[8px] border border-white/10 bg-[#0B0B0F] p-3 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black text-[#FE2C55]">{props.task.creator}</p>
            <h1 className="text-xl font-black leading-tight">{props.task.title}</h1>
          </div>
          <div className="rounded-full bg-[#25F4EE] px-3 py-1 text-xs font-black text-black">{money(props.task.reward)}</div>
        </div>
        <video
          key={props.task.id}
          autoPlay
          className="h-[36dvh] min-h-[245px] max-h-[330px] w-full rounded-[8px] bg-black object-cover"
          controls
          loop
          muted
          playsInline
          src={props.task.videoUrl}
        />
      </section>

      <section className="rounded-[8px] border border-white/10 bg-[#101014] p-4">
        <div className="mb-2 flex items-center justify-between text-xs font-black text-white/72">
          <span>Finish watching the video to unlock the review ({Math.round(props.progress)}%)</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[#FE2C55] transition-all duration-500" style={{ width: `${props.progress}%` }} />
        </div>
      </section>

      <section className="rounded-[8px] border border-white/10 bg-[#0F1117] p-4 shadow-2xl transition-all">
        {!props.reviewUnlocked ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-white/8 text-[#25F4EE]">
              <LockKeyholeIcon size={30} />
            </div>
            <h2 className="text-xl font-black">Review Locked</h2>
            <p className="mt-2 max-w-[280px] text-sm leading-6 text-white/55">Complete task requirements above to unlock questions.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-black">1. Rate the video quality</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} className={`grid h-11 w-11 place-items-center rounded-full transition ${props.rating >= star ? "bg-[#FE2C55] text-white" : "bg-white/10 text-white/42"}`} onClick={() => props.setRating(star)} type="button">
                    <Star size={18} fill={props.rating >= star ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>
            <ChoiceRow label="2. Was the content useful?" value={props.useful} onChange={props.setUseful} />
            <ChoiceRow label="3. Would you recommend it?" value={props.recommend} onChange={props.setRecommend} />
            <label className="block">
              <span className="mb-2 block text-sm font-black">4. Additional comments for the algorithm</span>
              <textarea
                className="min-h-24 w-full resize-none rounded-[8px] border border-white/10 bg-black px-3 py-3 text-sm font-semibold outline-none placeholder:text-white/30 focus:border-[#25F4EE]"
                onChange={(event) => props.setComment(event.target.value)}
                placeholder="Write at least 15 characters..."
                value={props.comment}
              />
            </label>
            <button className="h-13 w-full rounded-full bg-[#FE2C55] text-sm font-black text-white transition active:scale-[0.98] disabled:bg-white/12 disabled:text-white/38" disabled={!props.canSubmit} onClick={props.submitReview} type="button">
              Submit Review & Claim Reward
            </button>
          </div>
        )}
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
  const canWithdraw = props.balance >= 1000;
  return (
    <div>
      <h1 className="mb-4 text-2xl font-black">Wallet</h1>
      <div className="grid gap-3">
        <MetricCard label="Current Balance" value={money(props.balance)} tone="from-[#FE2C55] to-[#25F4EE]" />
        <MetricCard label="Pending Balance" value={money(props.pendingBalance)} tone="from-zinc-800 to-zinc-950" />
        <MetricCard label="Minimum Withdrawal" value="$1,000.00" tone="from-[#25F4EE] to-zinc-950" />
      </div>
      <div className="mt-5 rounded-[8px] border border-white/10 bg-[#0F1117] p-4">
        <p className="mb-3 text-sm font-black">Withdrawal method</p>
        <select className="mb-3 h-12 w-full rounded-[8px] bg-white px-4 text-sm font-bold text-black" value={props.paymentMethod} onChange={(event) => props.setPaymentMethod(event.target.value)}>
          {["PayPal Email", "Venmo", "Cash App", "Zelle", "Bank Account"].map((method) => <option key={method}>{method}</option>)}
        </select>
        <input className="h-12 w-full rounded-[8px] bg-white px-4 text-sm font-bold text-black outline-none" value={props.paymentData} onChange={(event) => props.setPaymentData(event.target.value)} placeholder="Enter payment details" />
        <button className="mt-3 min-h-12 w-full rounded-full bg-[#FE2C55] px-4 py-3 text-sm font-black disabled:bg-white/12 disabled:text-white/42" disabled={!canWithdraw} type="button">
          {canWithdraw ? "Request Withdrawal" : "You need at least $1,000 available before requesting a withdrawal"}
        </button>
      </div>
    </div>
  );
}

function ProfileScreen({ user, reviews, balance }: { user: User; reviews: Review[]; balance: number }) {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-black">Profile</h1>
      <div className="rounded-[8px] border border-white/10 bg-[#0F1117] p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-black"><UserRound size={31} /></div>
          <div>
            <p className="text-lg font-black">{user.name}</p>
            <p className="text-sm font-bold text-white/52">{user.email}</p>
            <p className="mt-1 text-xs font-black text-[#25F4EE]">Total balance: {money(balance)}</p>
          </div>
        </div>
      </div>
      <h2 className="mb-3 mt-5 text-lg font-black">Review History</h2>
      <div className="space-y-2">
        {(reviews.length ? reviews : [{ date: "Today", title: "No reviews yet", reward: 0, status: "Waiting" }]).map((review, index) => (
          <div key={`${review.title}-${index}`} className="rounded-[8px] border border-white/10 bg-white/5 p-3 text-sm">
            <div className="flex items-center justify-between gap-3 font-black"><span>{review.title}</span><span>{money(review.reward)}</span></div>
            <div className="mt-1 flex items-center justify-between text-xs font-bold text-white/52"><span>{review.date}</span><span>{review.status}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BottomNav({ screen, setScreen }: { screen: Screen; setScreen: (screen: Screen) => void }) {
  return (
    <nav className="fixed bottom-0 left-1/2 z-30 grid h-[74px] w-full max-w-[430px] -translate-x-1/2 grid-cols-3 border-t border-white/10 bg-black px-3 pb-2 pt-2 text-[11px] font-black">
      <NavButton active={screen === "tasks"} icon={<Home size={22} />} label="Tasks" onClick={() => setScreen("tasks")} />
      <NavButton active={screen === "wallet"} icon={<Wallet size={22} />} label="Wallet" onClick={() => setScreen("wallet")} />
      <NavButton active={screen === "profile"} icon={<UserRound size={22} />} label="Profile" onClick={() => setScreen("profile")} />
    </nav>
  );
}

function ProcessingOverlay({ step }: { step: number }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/96 px-7 text-center">
      <div className="w-full max-w-[340px]">
        <div className="mx-auto mb-7 grid h-20 w-20 place-items-center rounded-full bg-white text-black shadow-[8px_0_0_#25F4EE,-8px_0_0_#FE2C55]">
          <Loader2 className="animate-spin" size={36} />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#25F4EE]">Processing review</p>
        <h2 className="mt-3 text-2xl font-black">{processingSteps[step]}</h2>
      </div>
    </div>
  );
}

function ChoiceRow({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <p className="mb-2 text-sm font-black">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {["Yes", "No"].map((option) => (
          <button key={option} className={`h-11 rounded-full text-sm font-black transition ${value === option ? "bg-[#25F4EE] text-black" : "bg-white/10 text-white"}`} onClick={() => onChange(option)} type="button">
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return <button className={`flex flex-col items-center justify-center gap-1 ${active ? "text-white" : "text-white/45"}`} onClick={onClick} type="button">{icon}<span>{label}</span></button>;
}

function AuthInput({ icon, placeholder, type }: { icon: ReactNode; placeholder: string; type: string }) {
  return <label className="flex h-13 items-center gap-3 rounded-full bg-white px-4 text-black">{icon}<input required className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-zinc-400" placeholder={placeholder} type={type} /></label>;
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <div className={`rounded-[8px] bg-gradient-to-br ${tone} p-4`}><p className="text-xs font-black uppercase tracking-[0.16em] text-white/70">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>;
}

function Brand() {
  return <div className="flex items-center gap-2 text-lg font-black"><span className="h-5 w-5 rounded-[6px] bg-[#25F4EE] shadow-[7px_0_0_#FE2C55]" /> Task Partners</div>;
}

function UnsupportedDevice() {
  return (
    <main className="grid min-h-dvh place-items-center bg-black px-6 text-center text-white">
      <div className="max-w-[420px] rounded-[8px] border border-white/10 bg-[#0F1117] p-6 shadow-2xl">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#FE2C55]">
          <LockKeyholeIcon size={26} />
        </div>
        <h1 className="text-2xl font-black">Mobile Only</h1>
        <p className="mt-3 text-sm leading-6 text-white/62">
          Dispositivo não suportado. Este aplicativo é exclusivo para dispositivos móveis (iOS/Android). Por favor, acesse pelo seu smartphone.
        </p>
      </div>
    </main>
  );
}

function Server404() {
  return <main className="grid min-h-dvh place-items-center bg-white text-center text-black"><div><h1 className="text-5xl font-black">404</h1><p className="mt-3 text-lg text-zinc-600">Not Found</p></div></main>;
}

function money(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
