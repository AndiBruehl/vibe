"use client";

import { Smile } from "lucide-react";
import { useState } from "react";
import useVibeLanguage from "./useVibeLanguage";

const EMOJIS = [
  "😀", "😁", "😂", "🥹", "😍", "😘", "😎", "🤔",
  "😢", "😭", "😡", "🎉", "🔥", "❤️", "👍", "👏",
  "🙏", "✨", "💯", "👀", "🤝", "💜", "😈", "🥳",
];

type EmojiPickerProps = {
  onSelect: (emoji: string) => void;
};

export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const de = useVibeLanguage() === "de";
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex size-11 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
        aria-label={de ? "Emoji hinzufügen" : "Add emoji"}
        aria-expanded={isOpen}
      >
        <Smile size={21} />
      </button>
      {isOpen ? (
        <div className="absolute bottom-12 left-0 z-30 grid w-64 grid-cols-8 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-300/40 dark:border-slate-700 dark:bg-gray-900 dark:shadow-black/30">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onSelect(emoji);
                setIsOpen(false);
              }}
              className="flex size-7 items-center justify-center rounded-lg text-lg transition hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label={`${de ? "Hinzufügen" : "Add"} ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
