"use client";

import { Smile, X } from "lucide-react";
import { useEffect, useState } from "react";
import { EMOJIS } from "./EmojiPicker";
import useVibeLanguage from "./useVibeLanguage";

type TextField = HTMLInputElement | HTMLTextAreaElement;

function isTextField(element: Element | null): element is TextField {
  if (element instanceof HTMLTextAreaElement) return !element.disabled && !element.readOnly && !element.dataset.emojiBuiltin && !element.dataset.emojiDisabled;
  if (!(element instanceof HTMLInputElement)) return false;
  const name = element.name.toLowerCase();
  return ["", "text", "search"].includes(element.type) && !element.disabled && !element.readOnly && !element.dataset.emojiBuiltin && !element.dataset.emojiDisabled && name !== "username" && !name.includes("tag") && !name.includes("topic");
}

function insertEmoji(field: TextField, emoji: string) {
  const start = field.selectionStart ?? field.value.length;
  const end = field.selectionEnd ?? start;
  const value = `${field.value.slice(0, start)}${emoji}${field.value.slice(end)}`;
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(field), "value");
  descriptor?.set?.call(field, value);
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
  field.focus();
  field.setSelectionRange(start + emoji.length, start + emoji.length);
}

export default function EmojiInputEnhancer() {
  const de = useVibeLanguage() === "de";
  const [field, setField] = useState<TextField | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    function focus(event: FocusEvent) {
      const target = event.target instanceof Element ? event.target : null;
      if (!isTextField(target)) return;
      setField(target);
      setOpen(false);
    }
    document.addEventListener("focusin", focus);
    return () => {
      document.removeEventListener("focusin", focus);
    };
  }, []);

  if (!field || !document.body.contains(field)) return null;

  return (
    <div className="fixed bottom-24 right-5 z-[80] md:bottom-6 md:right-6">
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen((current) => !current)}
        className="grid size-8 place-items-center rounded-full bg-white/90 text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:text-orange-500 dark:bg-slate-800/90 dark:text-slate-300 dark:ring-slate-600"
        aria-label={de ? "Emoji hinzufügen" : "Add emoji"}
        aria-expanded={open}
      >
        <Smile size={17} />
      </button>
      {open ? (
        <div className="absolute bottom-10 right-0 grid w-64 grid-cols-8 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => setOpen(false)} className="col-span-8 mb-1 flex items-center justify-end gap-1 px-1 text-xs text-slate-500"><X size={14} />{de ? "Schließen" : "Close"}</button>
          {EMOJIS.map((emoji) => <button key={emoji} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { insertEmoji(field, emoji); setOpen(false); }} className="grid size-7 place-items-center rounded-lg text-lg transition hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={`${de ? "Hinzufügen" : "Add"} ${emoji}`}>{emoji}</button>)}
        </div>
      ) : null}
    </div>
  );
}
