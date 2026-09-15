"use client";

import Picker, { EmojiStyle, Theme, type EmojiClickData } from "emoji-picker-react";
import { Smile } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import useVibeLanguage from "./useVibeLanguage";

type EmojiPickerProps = {
  onSelect: (emoji: string) => void;
  ariaLabel?: string;
  className?: string;
};

/** A full Unicode emoji picker with categories, search and its own scroll area. */
export default function EmojiPicker({ onSelect, ariaLabel, className = "" }: EmojiPickerProps) {
  const de = useVibeLanguage() === "de";
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ left: 12, top: 12 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  function togglePicker() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(320, window.innerWidth - 24);
    const height = 360;
    const left = Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12));
    const top = rect.top - height - 12 >= 12 ? rect.top - height - 12 : Math.min(rect.bottom + 12, window.innerHeight - height - 12);
    setPosition({ left, top: Math.max(12, top) });
    setIsOpen(true);
  }

  function selectEmoji({ emoji }: EmojiClickData) {
    onSelect(emoji);
    setIsOpen(false);
  }

  return (
    <div className={`shrink-0 ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={togglePicker}
        className="flex size-11 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
        aria-label={ariaLabel || (de ? "Emoji hinzufügen" : "Add emoji")}
        aria-expanded={isOpen}
      >
        <Smile size={21} />
      </button>
      {isOpen && typeof document !== "undefined" ? createPortal(
        <>
          <button type="button" aria-label={de ? "Emoji-Auswahl schließen" : "Close emoji picker"} className="fixed inset-0 z-[90] cursor-default" onClick={() => setIsOpen(false)} />
          <div className="fixed z-[100] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50" style={{ left: position.left, top: position.top, width: Math.min(320, window.innerWidth - 24) }}>
          <Picker
            onEmojiClick={selectEmoji}
            theme={Theme.AUTO}
            emojiStyle={EmojiStyle.NATIVE}
            autoFocusSearch={false}
            searchPlaceholder={de ? "Emojis suchen" : "Search emojis"}
            previewConfig={{ showPreview: false }}
            skinTonesDisabled={false}
            height={360}
            width={Math.min(320, window.innerWidth - 24)}
          />
        </div>
        </>,
        document.body,
      ) : null}
    </div>
  );
}
