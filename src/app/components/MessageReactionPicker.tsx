"use client";

import { useMemo, useTransition } from "react";
import { toggleMessageReaction } from "@/actions";
import EmojiPicker from "./EmojiPicker";
import useVibeLanguage from "./useVibeLanguage";

type Reaction = { emoji: string; profileId: string };

type MessageReactionPickerProps = {
  messageId: string;
  currentProfileId: string;
  reactions: Reaction[];
};

/** Compact message reactions with the same full picker used by every composer. */
export default function MessageReactionPicker({ messageId, currentProfileId, reactions }: MessageReactionPickerProps) {
  const de = useVibeLanguage() === "de";
  const [isPending, startTransition] = useTransition();
  const grouped = useMemo(() => {
    const counts = new Map<string, { count: number; reacted: boolean }>();
    for (const reaction of reactions) {
      const item = counts.get(reaction.emoji) || { count: 0, reacted: false };
      item.count += 1;
      item.reacted ||= reaction.profileId === currentProfileId;
      counts.set(reaction.emoji, item);
    }
    return [...counts.entries()];
  }, [currentProfileId, reactions]);

  function toggle(emoji: string) {
    startTransition(async () => {
      const data = new FormData();
      data.set("messageId", messageId);
      data.set("emoji", emoji);
      await toggleMessageReaction(data);
    });
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {grouped.map(([emoji, { count, reacted }]) => (
        <button
          key={emoji}
          type="button"
          disabled={isPending}
          onClick={() => toggle(emoji)}
          className={`inline-flex min-h-7 items-center gap-1 rounded-full border px-2 text-xs font-bold transition disabled:opacity-60 ${reacted ? "border-orange-400 bg-orange-50 text-orange-800 dark:bg-orange-500/20 dark:text-orange-100" : "border-slate-200 bg-white/75 text-slate-700 hover:border-orange-300 dark:border-slate-600 dark:bg-slate-950/30 dark:text-slate-200"}`}
          aria-label={`${emoji} ${count}`}
        >
          <span>{emoji}</span><span>{count}</span>
        </button>
      ))}
      <EmojiPicker
        ariaLabel={de ? "Reaktion hinzufügen" : "Add reaction"}
        className="[&_button]:size-7 [&_button]:rounded-full [&_button]:border [&_button]:border-slate-200 [&_button]:bg-white/75 [&_button]:text-base dark:[&_button]:border-slate-600 dark:[&_button]:bg-slate-950/30"
        onSelect={toggle}
      />
    </div>
  );
}
