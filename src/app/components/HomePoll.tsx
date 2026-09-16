"use client";

import { useEffect, useState } from "react";
import { BarChart3, Clock3 } from "lucide-react";
import Image from "next/image";
import { votePoll } from "@/actions";

type PollOption = {
  id: string;
  label: string;
  votes: { profile: { id: string; name: string | null; username: string | null; avatar: string | null } }[];
};

type HomePollProps = {
  poll: { id: string; question: string; expiresAt: string; options: PollOption[] };
  viewerProfileId: string;
  de: boolean;
};

function remaining(expiresAt: string, de: boolean) {
  const milliseconds = new Date(expiresAt).getTime() - Date.now();
  if (milliseconds <= 0) return de ? "Abgeschlossen" : "Ended";
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  return de ? `Noch ${hours} Std. ${minutes} Min.` : `${hours}h ${minutes}m left`;
}

export default function HomePoll({ poll, viewerProfileId, de }: HomePollProps) {
  const [timeLeft, setTimeLeft] = useState(() => remaining(poll.expiresAt, de));
  useEffect(() => {
    const timer = window.setInterval(() => setTimeLeft(remaining(poll.expiresAt, de)), 30_000);
    return () => window.clearInterval(timer);
  }, [poll.expiresAt, de]);

  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes.length, 0);
  const selectedOptionId = poll.options.find((option) => option.votes.some((vote) => vote.profile.id === viewerProfileId))?.id;

  return (
    <section className="overflow-hidden rounded-3xl border border-orange-400/30 bg-white shadow-xl dark:bg-slate-900">
      <div className="bg-linear-to-r from-orange-500 via-rose-500 to-fuchsia-600 px-5 py-4 text-white sm:px-6">
        <div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 text-xs font-black tracking-[.16em]"><BarChart3 size={16} /> VIBE POLL</span><span className="inline-flex items-center gap-1 rounded-full bg-black/15 px-2.5 py-1 text-xs font-bold"><Clock3 size={13} /> {timeLeft}</span></div>
        <h2 className="mt-3 text-lg font-black sm:text-xl">{poll.question}</h2>
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        {poll.options.map((option) => {
          const votes = option.votes.length;
          const percent = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
          const selected = selectedOptionId === option.id;
          return <form key={option.id} action={votePoll}>
            <input type="hidden" name="pollId" value={poll.id} />
            <input type="hidden" name="optionId" value={option.id} />
            <button type="submit" className={`relative w-full overflow-hidden rounded-2xl border px-4 py-3 text-left transition ${selected ? "border-orange-500 bg-orange-50 dark:bg-orange-500/15" : "border-slate-200 bg-slate-50 hover:border-orange-300 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-orange-400/60"}`}>
              <span className="absolute inset-y-0 left-0 bg-orange-400/15 transition-all dark:bg-orange-400/10" style={{ width: `${percent}%` }} />
              <span className="relative flex items-center justify-between gap-3"><span className="font-bold text-slate-900 dark:text-white">{option.label}</span><span className="text-sm font-black text-slate-600 dark:text-slate-300">{percent}%</span></span>
              <span className="relative mt-2 flex items-center justify-between gap-3"><span className="flex -space-x-1.5">{option.votes.slice(0, 5).map((vote) => <span key={vote.profile.id} title={vote.profile.name || vote.profile.username || "VIBE"} className="relative grid size-5 place-items-center overflow-hidden rounded-full border-2 border-white bg-slate-300 text-[8px] font-bold text-slate-700 dark:border-slate-800">{vote.profile.avatar ? <Image src={vote.profile.avatar} alt="" fill sizes="20px" className="object-cover" unoptimized /> : (vote.profile.name || vote.profile.username || "?").slice(0, 1)}</span>)}</span><span className="text-xs font-medium text-slate-500 dark:text-slate-400">{votes} {de ? (votes === 1 ? "Stimme" : "Stimmen") : (votes === 1 ? "vote" : "votes")}</span></span>
            </button>
          </form>;
        })}
        <p className="pt-1 text-center text-xs text-slate-500 dark:text-slate-400">{totalVotes} {de ? (totalVotes === 1 ? "Teilnahme" : "Teilnahmen") : (totalVotes === 1 ? "response" : "responses")}</p>
      </div>
    </section>
  );
}
