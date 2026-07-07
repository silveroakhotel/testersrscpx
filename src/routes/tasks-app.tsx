import { createFileRoute } from "@tanstack/react-router";
import {
  AtSign,
  BadgeCheck,
  Bell,
  Bookmark,
  Check,
  CircleUserRound,
  Clock3,
  Heart,
  Home,
  Loader2,
  LockKeyhole,
  MessageCircle,
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
      { title: "Creator Tasks" },
      {
        name: "description",
        content: "A mobile-first short video task app experience.",
      },
    ],
  }),
  component: TasksApp,
});

type VideoTask = {
  creator: string;
  handle: string;
  caption: string;
  tag: string;
  reward: number;
  duration: string;
  views: string;
  color: string;
};

const videoTasks: VideoTask[] = [
  {
    creator: "Mia Turner",
    handle: "@miaturner",
    caption: "Watch the full product story and leave a useful quality note.",
    tag: "Beauty launch review",
    reward: 18.75,
    duration: "0:45",
    views: "428.6K",
    color: "from-[#ff2d55] via-[#111827] to-[#25f4ee]",
  },
  {
    creator: "Noah Brooks",
    handle: "@noahreviews",
    caption: "Evaluate retention, audio clarity, and buying intent.",
    tag: "Tech demo audit",
    reward: 21.4,
    duration: "0:45",
    views: "612.8K",
    color: "from-[#25f4ee] via-[#18181b] to-[#fe2c55]",
  },
  {
    creator: "Ava Collins",
    handle: "@avacreates",
    caption: "Complete the video and submit a constructive comment.",
    tag: "Creator content score",
    reward: 24.9,
    duration: "0:45",
    views: "305.1K",
    color: "from-[#111827] via-[#fe2c55] to-[#25f4ee]",
  },
];

const processingSteps = [
  "Checking watch retention...",
  "Reviewing your comment...",
  "Matching creator quality signals...",
  "Adding reward to your wallet...",
];

const notifications = ["Olivia earned $18.75", "James cashed out $150.00", "Emma completed 3 video tasks"];

function TasksApp() {
  const [signedIn, setSignedIn] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [taskIndex, setTaskIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [balance, setBalance] = useState(124.8);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [showNotice, setShowNotice] = useState(true);

  const task = videoTasks[taskIndex % videoTasks.length];
  const canSubmit = progress >= 100 && rating > 0 && comment.trim().length >= 12;
  const balanceText = useMemo(() => balance.toLocaleString("en-US", { style: "currency", currency: "USD" }), [balance]);

  useEffect(() => {
    if (!signedIn || processing) return;
    setProgress(0);
    const timer = window.setInterval(() => {
      setProgress((value) => Math.min(100, value + 4));
    }, 650);
    return () => window.clearInterval(timer);
  }, [signedIn, taskIndex, processing]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setShowNotice(true);
      setNoticeIndex((value) => (value + 1) % notifications.length);
      window.setTimeout(() => setShowNotice(false), 3000);
    }, 6500);
    return () => window.clearInterval(timer);
  }, []);

  function finishSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSignupLoading(true);
    window.setTimeout(() => {
      setSignupLoading(false);
      setSignedIn(true);
    }, 900);
  }

  function submitTask() {
    if (!canSubmit) return;
    setProcessing(true);
    setProcessingStep(0);
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      setProcessingStep(Math.min(step, processingSteps.length - 1));
      if (step >= processingSteps.length) {
        window.clearInterval(timer);
        setBalance((value) => Number((value + task.reward).toFixed(2)));
        setTaskIndex((value) => value + 1);
        setRating(0);
        setComment("");
        setProcessing(false);
      }
    }, 1350);
  }

  if (!signedIn) {
    return (
      <main className="min-h-dvh bg-white text-zinc-950">
        <section className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pb-6 pt-4">
          <header className="flex h-12 items-center justify-between">
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100" type="button" aria-label="Search">
              <Search size={20} />
            </button>
            <div className="flex items-center gap-1.5 text-[22px] font-black tracking-normal">
              <span className="h-5 w-5 rounded-[6px] bg-[#25f4ee] shadow-[7px_0_0_#fe2c55]" />
              TikTask
            </div>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100" type="button" aria-label="Notifications">
              <Bell size={20} />
            </button>
          </header>

          <div className="flex flex-1 flex-col justify-center py-7">
            <div className="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-[28px] bg-zinc-950 text-white shadow-[8px_8px_0_#25f4ee,-8px_-8px_0_#fe2c55]">
              <Play className="ml-1 fill-white" size={38} />
            </div>
            <h1 className="text-center text-[31px] font-black leading-tight">App updated successfully</h1>
            <p className="mx-auto mt-3 max-w-[330px] text-center text-[15px] leading-6 text-zinc-600">
              Your account is qualified. Finish your profile to unlock lifetime access and keep earning from new video tasks.
            </p>

            <form onSubmit={finishSignup} className="mt-7 space-y-3">
              <AuthField icon={<UserRound size={18} />} placeholder="Full name" autoComplete="name" />
              <AuthField icon={<AtSign size={18} />} placeholder="Email" type="email" autoComplete="email" />
              <AuthField icon={<CircleUserRound size={18} />} placeholder="Mobile phone" type="tel" autoComplete="tel" />
              <AuthField icon={<LockKeyhole size={18} />} placeholder="Password" type="password" autoComplete="new-password" />
              <button
                className="mt-2 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-zinc-950 text-[15px] font-extrabold text-white shadow-lg shadow-zinc-300 transition active:scale-[0.98]"
                type="submit"
              >
                {signupLoading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                Sign up and continue
              </button>
            </form>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-zinc-500">
              <BadgeCheck size={15} className="text-[#25f4ee]" />
              Verified account
              <span className="text-zinc-300">|</span>
              Premium access active
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-white text-white">
      <section className="relative mx-auto min-h-dvh w-full max-w-[430px] overflow-hidden bg-black">
        {showNotice && (
          <div className="fixed left-1/2 top-3 z-40 flex w-[min(390px,calc(100vw-28px))] -translate-x-1/2 items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-zinc-950 shadow-xl">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#25f4ee]">
              <Wallet size={14} />
            </span>
            {notifications[noticeIndex]}
          </div>
        )}

        <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 pt-4 text-white">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">Balance</p>
            <p className="text-xl font-black">{balanceText}</p>
          </div>
          <div className="flex rounded-full bg-white/10 p-1 text-sm font-extrabold backdrop-blur">
            <button className="rounded-full bg-white px-4 py-1.5 text-black" type="button">
              Tasks
            </button>
            <button className="px-4 py-1.5 text-white/80" type="button">
              Live
            </button>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/12 backdrop-blur" type="button" aria-label="Profile">
            <UserRound size={21} />
          </button>
        </header>

        <article className={`relative flex min-h-dvh items-end bg-gradient-to-br ${task.color}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,.22),transparent_27%),linear-gradient(180deg,rgba(0,0,0,.22),rgba(0,0,0,.1)_36%,rgba(0,0,0,.82))]" />
          <div className="absolute left-1/2 top-[43%] flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 backdrop-blur-md">
            <Play className="ml-1 fill-white text-white" size={35} />
          </div>
          <div className="absolute left-4 top-[50%] rounded-full bg-black/35 px-3 py-1.5 text-xs font-bold backdrop-blur">
            Watch {task.duration} to unlock
          </div>

          <aside className="absolute bottom-[172px] right-3 z-10 flex flex-col items-center gap-4">
            <SocialAction icon={<Heart fill="currentColor" size={27} />} label="72K" />
            <SocialAction icon={<MessageCircle fill="currentColor" size={27} />} label="884" />
            <SocialAction icon={<Bookmark fill="currentColor" size={25} />} label="Save" />
            <SocialAction icon={<Share2 size={26} />} label="Share" />
          </aside>

          <div className="relative z-10 w-full px-4 pb-[88px] pr-[76px]">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-950">
                <UserRound size={21} />
              </div>
              <div>
                <div className="flex items-center gap-1 text-sm font-black">
                  {task.creator}
                  <BadgeCheck size={15} className="fill-[#25f4ee] text-[#25f4ee]" />
                </div>
                <p className="text-xs font-semibold text-white/72">{task.handle} | {task.views} views</p>
              </div>
              <button className="ml-auto flex h-8 items-center gap-1 rounded-full border border-white/45 px-3 text-xs font-black" type="button">
                <Plus size={14} />
                Follow
              </button>
            </div>

            <p className="text-[15px] font-semibold leading-5">{task.caption}</p>
            <p className="mt-1 text-sm font-bold text-white/80">#{task.tag.replaceAll(" ", "")}</p>

            <div className="mt-4 rounded-[18px] bg-white p-3 text-zinc-950 shadow-2xl">
              <div className="mb-2 flex items-center justify-between text-xs font-black">
                <span className="flex items-center gap-1"><Clock3 size={14} /> Reward unlock</span>
                <span>${task.reward.toFixed(2)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
                <div className="h-full rounded-full bg-[#fe2c55] transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${rating >= star ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-400"}`}
                      onClick={() => setRating(star)}
                      type="button"
                      aria-label={`Rate ${star}`}
                    >
                      <Star size={15} fill={rating >= star ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-zinc-500">{progress}% watched</span>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-2">
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-zinc-400"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Add a useful comment..."
                />
                <button
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fe2c55] text-white disabled:bg-zinc-300"
                  disabled={!canSubmit}
                  onClick={submitTask}
                  type="button"
                  aria-label="Submit task"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </article>

        <nav className="absolute bottom-0 left-0 right-0 z-20 grid h-[72px] grid-cols-5 border-t border-white/10 bg-black/92 px-3 pb-2 pt-2 text-[10px] font-bold text-white">
          <BottomNav icon={<Home size={22} fill="currentColor" />} label="Home" active />
          <BottomNav icon={<Search size={22} />} label="Discover" />
          <button className="mx-auto flex h-10 w-14 items-center justify-center rounded-[12px] bg-white text-black shadow-[-4px_0_0_#25f4ee,4px_0_0_#fe2c55]" type="button" aria-label="Create">
            <Plus size={23} strokeWidth={3} />
          </button>
          <BottomNav icon={<MessageCircle size={22} />} label="Inbox" />
          <BottomNav icon={<UserRound size={22} />} label="Profile" />
        </nav>
      </section>

      {processing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white px-6 text-center text-zinc-950">
          <div className="w-full max-w-[350px]">
            <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-950 text-white shadow-[7px_0_0_#25f4ee,-7px_0_0_#fe2c55]">
              <Loader2 className="animate-spin" size={36} />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Processing reward</p>
            <h2 className="mt-3 text-2xl font-black">{processingSteps[processingStep]}</h2>
            <div className="mt-7 grid grid-cols-4 gap-2">
              {processingSteps.map((step, index) => (
                <div key={step} className={`h-2 rounded-full ${index <= processingStep ? "bg-[#fe2c55]" : "bg-zinc-200"}`} />
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function AuthField({
  icon,
  placeholder,
  type = "text",
  autoComplete,
}: {
  icon: ReactNode;
  placeholder: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="flex h-13 items-center gap-3 rounded-full border border-zinc-200 bg-zinc-50 px-4 focus-within:border-zinc-950">
      <span className="text-zinc-500">{icon}</span>
      <input
        required
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-zinc-950 outline-none placeholder:text-zinc-400"
      />
    </label>
  );
}

function SocialAction({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button className="flex flex-col items-center gap-1 text-white drop-shadow" type="button">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/24 backdrop-blur">{icon}</span>
      <span className="text-[11px] font-black">{label}</span>
    </button>
  );
}

function BottomNav({ icon, label, active = false }: { icon: ReactNode; label: string; active?: boolean }) {
  return (
    <button className={`flex flex-col items-center justify-center gap-0.5 ${active ? "text-white" : "text-white/62"}`} type="button">
      {icon}
      <span>{label}</span>
    </button>
  );
}
