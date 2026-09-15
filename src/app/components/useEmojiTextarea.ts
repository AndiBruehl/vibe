"use client";

import { useRef } from "react";

/** Provides a textarea ref and cursor-aware insertion for the shared emoji picker. */
export default function useEmojiTextarea() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertEmoji(emoji: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? start;
    textarea.setRangeText(emoji, start, end, "end");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.focus();
  }

  return { textareaRef, insertEmoji };
}
