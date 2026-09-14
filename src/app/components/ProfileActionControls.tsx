"use client";

import { MessageCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { startConversation, toggleBlock, toggleFollow, unblockProfileInline } from "@/actions";

type ProfileActionControlsProps = {
  targetProfileId: string;
  targetUsername: string;
  returnTo: string;
  followState: "following" | "requested" | "none";
  blockedByViewer: boolean;
  blockedByOther: boolean;
  language: "en" | "de";
};

export default function ProfileActionControls({
  targetProfileId,
  targetUsername,
  returnTo,
  followState,
  blockedByViewer,
  blockedByOther,
  language,
}: ProfileActionControlsProps) {
  const de = language === "de";
  const [blocked, setBlocked] = useState(blockedByViewer);
  const [pending, startTransition] = useTransition();

  if (blockedByOther) return null;

  if (blocked) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => {
          await unblockProfileInline(targetProfileId);
          setBlocked(false);
        })}
        className="rounded-2xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? (de ? "Wird entblockt..." : "Unblocking...") : (de ? "Entblocken" : "Unblock")}
      </button>
    );
  }

  return (
    <>
      <form action={toggleFollow}>
        <input type="hidden" name="targetProfileId" value={targetProfileId} />
        <input type="hidden" name="targetUsername" value={targetUsername} />
        <button type="submit" className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${followState !== "none" ? "border border-slate-200 bg-slate-100 text-slate-900 hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10" : "bg-linear-to-r from-red-500 to-yellow-500 text-white hover:scale-[1.02]"}`}>
          {followState === "following" ? (de ? "Folgt" : "Following") : followState === "requested" ? (de ? "Angefragt" : "Requested") : (de ? "Folgen" : "Follow")}
        </button>
      </form>
      <form action={startConversation}>
        <input type="hidden" name="targetProfileId" value={targetProfileId} />
        <button type="submit" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-gray-900 dark:text-slate-100 dark:hover:bg-gray-700">
          <MessageCircle size={16} />
          {de ? "Nachricht" : "Message"}
        </button>
      </form>
      <form action={toggleBlock}>
        <input type="hidden" name="targetProfileId" value={targetProfileId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <button className="rounded-2xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600">{de ? "Blockieren" : "Block"}</button>
      </form>
    </>
  );
}
