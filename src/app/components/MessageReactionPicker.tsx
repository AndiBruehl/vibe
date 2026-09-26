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
    <div className="mt-2 flex flex-wrap items-center gap-1">
      {grouped.map(([emoji, { count, reacted }]) => (
        <button
          key={emoji}
          type="button"
          disabled={isPending}
          onClick={() => toggle(emoji)}
          className={`grid size-11 min-h-0 place-items-center rounded-full bg-transparent text-xl transition hover:scale-110 disabled:opacity-60 ${reacted ? "drop-shadow-[0_0_7px_rgba(251,146,60,0.8)]" : "opacity-85 hover:opacity-100"}`}
          aria-label={`${emoji} ${count}`}
        >
          <span aria-hidden="true">{emoji}</span><span className="sr-only">{count}</span>
        </button>
      ))}
      <EmojiPicker
        ariaLabel={de ? "Reaktion hinzufügen" : "Add reaction"}
        className="[&_button]:!size-11 [&_button]:!min-h-0 [&_button]:rounded-full [&_button]:!border-0 [&_button]:!bg-transparent [&_button]:text-xl [&_button]:hover:scale-110"
        onSelect={toggle}
      />
    </div>
  );
}
