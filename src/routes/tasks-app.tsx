import { createFileRoute } from "@tanstack/react-router";
import {
  AtSign,
  BadgeCheck,
  Bookmark,
  Check,
  Compass,
  Heart,
  Home,
  Inbox,
  Loader2,
  LockKeyhole,
  MessageCircle,
  Music2,
  Play,
  Plus,
  Search,
  Send,
  Share2,
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
      { name: "description", content: "TikTok-style reviewer task hub." },
    ],
  }),
  component: TikTokReviewerHub,
});

type Screen = "home" | "discover" | "inbox" | "wallet" | "profile";
type Review = { date: string; title: string; reward: number; status: string };
type User = { name: string; email: string; role: "user" | "admin" };
type VideoTask = {
  id: string;
  creator: string;
  title: string;
  caption: string;
  reward: number;
  likes: string;
  comments: string;
  gradient: string;
};

const videos: VideoTask[] = [
  {
    id: "beauty-launch",
    creator: "@mia_reviews",
    title: "Beauty Launch Audit",
    caption: "#fy #audit Watch and rate to compute your balance.",
    reward: 15,
    likes: "82.4K",
    comments: "1,284",
    gradient: "from-[#FE2C55] via-black to-[#25F4EE]",
  },
  {
    id: "creator-tech",
    creator: "@creator_lab",
    title: "Tech Demo Review",
    caption: "#fy #audit Evaluate clarity, usefulness, and retention.",
    reward: 18,
    likes: "118K",
    comments: "2,019",
    gradient: "from-[#25F4EE] via-black to-[#FE2C55]",
  },
  {
    id: "fitness-story",
    creator: "@pulse_media",
    title: "Fitness Story Score",
    caption: "#fy #audit Finish the video before the review unlocks.",
    reward: 12,
    likes: "46.9K",
    comments: "746",
    gradient: "from-zinc-950 via-[#FE2C55] to-black",
  },
];

const processingSteps = ["Analyzing consistency...", "Validating retention...", "Checking duplicate reviews...", "Adding reward..."];

function TikTokReviewerHub() {
  const [allowed, setAllowed] = useState(false);
  const [checkedGate, setCheckedGate] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [videoIndex, setVideoIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [rating, setRating] = useState(0);
  const [useful, setUseful] = useState("");
  const [recommend, setRecommend] = useState("");
  const [comment, setComment] = useState("");
  const [balance, setBalance] = useState(147.2);
  const [pendingBalance] = useState(52.8);
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [successReward, setSuccessReward] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("PayPal Email");
  const [paymentData, setPaymentData] = useState("");

  const video = videos[videoIndex % videos.length];
  const reviewUnlocked = progress >= 100 && !reviewedIds.includes(video.id);
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
    if (!allowed || !user || screen !== "home" || processing) return;
    setProgress(0);
    const timer = window.setInterval(() => setProgress((value) => Math.min(100, value + 2.25)), 1000);
    return () => window.clearInterval(timer);
  }, [allowed, user, screen, videoIndex, processing]);

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    window.setTimeout(() => {
      setUser({ name: "Mia Carter", email: "reviewer@taskpartners.app", role: "user" });
      setLoading(false);
      if (remember) window.localStorage.setItem("ttp_session", "reviewer@taskpartners.app");
    }, 800);
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
        setReviewedIds((value) => [...value, video.id]);
        setReviews((value) => [
          { date: new Date().toLocaleDateString("en-US"), title: video.title, reward: video.reward, status: "Approved" },
          ...value,
        ]);
        setBalance((value) => Number((value + video.reward).toFixed(2)));
        setSuccessReward(video.reward);
        setRating(0);
        setUseful("");
        setRecommend("");
        setComment("");
        setVideoIndex((value) => value + 1);
        setProcessing(false);
        window.setTimeout(() => setSuccessReward(null), 2600);
      }
    }, 1250);
  }

  if (!checkedGate) return null;
  if (!allowed) return <Server404 />;

  if (!user) {
    return (
      <main className="min-h-dvh bg-black text-white">
        <section className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 py-5">
          <div className="flex items-center justify-between">
            <button className="grid h-10 w-10 place-items-center rounded-full bg-white/10" type="button"><Search size={20} /></button>
            <Brand />
            <button className="grid h-10 w-10 place-items-center rounded-full bg-white/10" type="button"><UserRound size={20} /></button>
          </div>
          <div className="flex flex-1 flex-col justify-center">
            <div className="mx-auto mb-8 grid h-24 w-24 place-items-center rounded-[28px] bg-white text-black shadow-[8px_0_0_#25F4EE,-8px_0_0_#FE2C55]">
              <Play className="ml-1 fill-black" size={38} />
            </div>
            <h1 className="text-center text-[30px] font-black leading-tight">TikTok Task Partners v2.4 - App Updated!</h1>
            <p className="mx-auto mt-3 max-w-[330px] text-center text-sm leading-6 text-white/62">
              Sign in or create your reviewer account to unlock video tasks, wallet tracking, and lifetime access.
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
      <section className="relative mx-auto min-h-dvh w-full max-w-[430px] overflow-hidden bg-black">
        {screen === "home" && (
          <HomeFeed
            balanceText={balanceText}
            canSubmit={canSubmit}
            comment={comment}
            processing={processing}
            progress={progress}
            rating={rating}
            recommend={recommend}
            reviewUnlocked={reviewUnlocked}
            setComment={setComment}
            setRating={setRating}
            setRecommend={setRecommend}
            setUseful={setUseful}
            submitReview={submitReview}
            useful={useful}
            video={video}
          />
        )}
        {screen === "discover" && <SimplePanel title="Discover" subtitle="High reward creator campaigns" items={videos.map((item) => `${item.title} - ${money(item.reward)}`)} />}
        {screen === "inbox" && <SimplePanel title="Inbox" subtitle="System updates" items={["Your reviewer account is verified.", "Daily task limit: 8 videos.", "Minimum withdrawal remains $1,000."]} />}
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

        <BottomNav screen={screen} setScreen={setScreen} />
      </section>

      {processing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/96 px-7 text-center">
          <div className="w-full max-w-[340px]">
            <div className="mx-auto mb-7 grid h-20 w-20 place-items-center rounded-full bg-white text-black shadow-[8px_0_0_#25F4EE,-8px_0_0_#FE2C55]">
              <Loader2 className="animate-spin" size={36} />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#25F4EE]">Processing review</p>
            <h2 className="mt-3 text-2xl font-black">{processingSteps[processingStep]}</h2>
          </div>
        </div>
      )}

      {successReward !== null && (
        <div className="fixed left-1/2 top-5 z-50 w-[min(390px,calc(100vw-28px))] -translate-x-1/2 rounded-[18px] bg-emerald-400 px-4 py-3 text-center text-sm font-black text-black shadow-2xl">
          +{money(successReward)} Added to your balance!
        </div>
      )}
    </main>
  );
}

function HomeFeed(props: {
  balanceText: string;
  canSubmit: boolean;
  comment: string;
  processing: boolean;
  progress: number;
  rating: number;
  recommend: string;
  reviewUnlocked: boolean;
  setComment: (value: string) => void;
  setRating: (value: number) => void;
  setRecommend: (value: string) => void;
  setUseful: (value: string) => void;
  submitReview: () => void;
  useful: string;
  video: VideoTask;
}) {
  const { video } = props;
  return (
    <article className={`relative min-h-dvh bg-gradient-to-br ${video.gradient}`}>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.34),transparent_30%,rgba(0,0,0,.9))]" />
      <header className="absolute left-0 right-0 top-0 z-20 flex items-start justify-between px-4 pt-4">
        <div className="flex gap-5 pt-1 text-[15px] font-black">
          <span className="text-white/62">Following</span>
          <span className="relative">For You<span className="absolute -bottom-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-[#FE2C55]" /></span>
        </div>
        <div className="rounded-[14px] bg-black/55 px-3 py-2 text-right text-xs font-black backdrop-blur">
          <p className="text-white/55">Available Balance</p>
          <p className="text-[#25F4EE]">{props.balanceText}</p>
        </div>
      </header>

      <div className="absolute left-1/2 top-[38%] grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/35 backdrop-blur">
        <Play className="ml-1 fill-white" size={36} />
      </div>

      <aside className="absolute bottom-[220px] right-3 z-10 flex flex-col items-center gap-4">
        <SideIcon icon={<Heart fill="currentColor" size={27} />} label={video.likes} />
        <SideIcon icon={<MessageCircle fill="currentColor" size={27} />} label={video.comments} />
        <SideIcon icon={<Bookmark fill="currentColor" size={25} />} label="Save" />
        <SideIcon icon={<Share2 size={26} />} label="Share" />
      </aside>

      <section className="absolute bottom-[78px] left-0 right-0 z-10 px-4">
        <div className="mb-4 pr-16">
          <p className="mb-1 text-base font-black">{video.creator}</p>
          <p className="text-sm font-semibold leading-5">{video.caption}</p>
          <p className="mt-2 flex items-center gap-2 text-xs font-bold text-white/75"><Music2 size={14} /> Original audio - {video.title}</p>
        </div>
        <div className="rounded-t-[22px] bg-black/92 p-4 shadow-2xl backdrop-blur">
          <div className="mb-3 flex items-center justify-between text-xs font-black">
            <span>{props.reviewUnlocked ? "Review unlocked" : "Finish watching the video to unlock the review."}</span>
            <span>{Math.round(props.progress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-[#FE2C55] transition-all duration-500" style={{ width: `${props.progress}%` }} />
          </div>
          {props.reviewUnlocked && (
            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} className={`grid h-9 w-9 place-items-center rounded-full ${props.rating >= star ? "bg-[#FE2C55]" : "bg-white/12"}`} onClick={() => props.setRating(star)} type="button">
                    <Star size={16} fill={props.rating >= star ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
              <RadioRow label="Was the content useful?" value={props.useful} onChange={props.setUseful} />
              <RadioRow label="Would you recommend it?" value={props.recommend} onChange={props.setRecommend} />
              <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-black">
                <input className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-zinc-400" value={props.comment} onChange={(event) => props.setComment(event.target.value)} placeholder="Additional comments for the algorithm" />
                <button className="grid h-9 w-9 place-items-center rounded-full bg-[#FE2C55] text-white disabled:bg-zinc-300" disabled={!props.canSubmit || props.processing} onClick={props.submitReview} type="button">
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </article>
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
    <PanelShell title="Wallet">
      <div className="grid gap-3">
        <MetricCard label="Current Balance" value={money(props.balance)} tone="from-[#FE2C55] to-[#25F4EE]" />
        <MetricCard label="Pending Balance" value={money(props.pendingBalance)} tone="from-zinc-800 to-zinc-950" />
        <MetricCard label="Minimum Withdrawal" value="$1,000.00" tone="from-[#25F4EE] to-zinc-950" />
      </div>
      <div className="mt-5 rounded-[18px] bg-white/8 p-4">
        <p className="mb-3 text-sm font-black">Withdrawal method</p>
        <select className="mb-3 h-12 w-full rounded-full bg-white px-4 text-sm font-bold text-black" value={props.paymentMethod} onChange={(event) => props.setPaymentMethod(event.target.value)}>
          {["PayPal Email", "Venmo", "Cash App", "Zelle", "Bank Account"].map((method) => <option key={method}>{method}</option>)}
        </select>
        <input className="h-12 w-full rounded-full bg-white px-4 text-sm font-bold text-black outline-none" value={props.paymentData} onChange={(event) => props.setPaymentData(event.target.value)} placeholder="Enter payment details" />
        <button className="mt-3 h-12 w-full rounded-full bg-[#FE2C55] font-black disabled:bg-white/15 disabled:text-white/45" disabled={!canWithdraw} type="button">
          {canWithdraw ? "Request Withdrawal" : "You need at least $1,000 available before requesting a withdrawal"}
        </button>
      </div>
    </PanelShell>
  );
}

function ProfileScreen({ user, reviews, balance }: { user: User; reviews: Review[]; balance: number }) {
  return (
    <PanelShell title="Profile">
      <div className="rounded-[18px] bg-white p-4 text-black">
        <div className="flex items-center gap-3">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-black text-white"><UserRound size={31} /></div>
          <div>
            <p className="text-lg font-black">{user.name}</p>
            <p className="text-sm font-bold text-zinc-500">{user.email}</p>
            <p className="mt-1 text-xs font-black text-[#FE2C55]">Total balance: {money(balance)}</p>
          </div>
        </div>
      </div>
      <h2 className="mb-3 mt-5 text-lg font-black">Review History</h2>
      <div className="space-y-2">
        {(reviews.length ? reviews : [{ date: "Today", title: "No reviews yet", reward: 0, status: "Waiting" }]).map((review, index) => (
          <div key={`${review.title}-${index}`} className="rounded-[14px] bg-white/8 p-3 text-sm">
            <div className="flex items-center justify-between font-black"><span>{review.title}</span><span>{money(review.reward)}</span></div>
            <div className="mt-1 flex items-center justify-between text-xs font-bold text-white/52"><span>{review.date}</span><span>{review.status}</span></div>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

function SimplePanel({ title, subtitle, items }: { title: string; subtitle: string; items: string[] }) {
  return (
    <PanelShell title={title}>
      <p className="mb-4 text-sm font-semibold text-white/55">{subtitle}</p>
      <div className="space-y-3">{items.map((item) => <div className="rounded-[16px] bg-white/8 p-4 text-sm font-bold" key={item}>{item}</div>)}</div>
    </PanelShell>
  );
}

function PanelShell({ title, children }: { title: string; children: ReactNode }) {
  return <div className="min-h-dvh bg-black px-4 pb-24 pt-5"><h1 className="mb-5 text-3xl font-black">{title}</h1>{children}</div>;
}

function BottomNav({ screen, setScreen }: { screen: Screen; setScreen: (screen: Screen) => void }) {
  return (
    <nav className="absolute bottom-0 left-0 right-0 z-30 grid h-[74px] grid-cols-5 border-t border-white/10 bg-black px-2 pb-2 pt-2 text-[10px] font-bold">
      <NavButton active={screen === "home"} icon={<Home size={22} fill="currentColor" />} label="Home" onClick={() => setScreen("home")} />
      <NavButton active={screen === "discover"} icon={<Compass size={22} />} label="Discover" onClick={() => setScreen("discover")} />
      <button className="mx-auto mt-1 grid h-10 w-14 place-items-center rounded-[12px] bg-white text-black shadow-[-4px_0_0_#25F4EE,4px_0_0_#FE2C55]" onClick={() => setScreen("wallet")} type="button"><Plus size={23} strokeWidth={3} /></button>
      <NavButton active={screen === "inbox"} icon={<Inbox size={22} />} label="Inbox" onClick={() => setScreen("inbox")} />
      <NavButton active={screen === "profile"} icon={<UserRound size={22} />} label="Profile" onClick={() => setScreen("profile")} />
    </nav>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return <button className={`flex flex-col items-center justify-center gap-1 ${active ? "text-white" : "text-white/48"}`} onClick={onClick} type="button">{icon}<span>{label}</span></button>;
}

function AuthInput({ icon, placeholder, type }: { icon: ReactNode; placeholder: string; type: string }) {
  return <label className="flex h-13 items-center gap-3 rounded-full bg-white px-4 text-black">{icon}<input required className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-zinc-400" placeholder={placeholder} type={type} /></label>;
}

function RadioRow({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs font-black">
      <span>{label}</span>
      <div className="flex gap-1">
        {["Yes", "No"].map((option) => <button key={option} className={`rounded-full px-3 py-1.5 ${value === option ? "bg-[#25F4EE] text-black" : "bg-white/12 text-white"}`} onClick={() => onChange(option)} type="button">{option}</button>)}
      </div>
    </div>
  );
}

function SideIcon({ icon, label }: { icon: ReactNode; label: string }) {
  return <button className="flex flex-col items-center gap-1 drop-shadow" type="button"><span className="grid h-11 w-11 place-items-center rounded-full bg-black/25 backdrop-blur">{icon}</span><span className="text-[11px] font-black">{label}</span></button>;
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <div className={`rounded-[18px] bg-gradient-to-br ${tone} p-4`}><p className="text-xs font-black uppercase tracking-[0.16em] text-white/70">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>;
}

function Brand() {
  return <div className="flex items-center gap-2 text-lg font-black"><span className="h-5 w-5 rounded-[6px] bg-[#25F4EE] shadow-[7px_0_0_#FE2C55]" /> Task Partners</div>;
}

function Server404() {
  return <main className="grid min-h-dvh place-items-center bg-white text-center text-black"><div><h1 className="text-5xl font-black">404</h1><p className="mt-3 text-lg text-zinc-600">Not Found</p></div></main>;
}

function money(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
