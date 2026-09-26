"use client";

import { Check, LoaderCircle, X } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { editMessage } from "@/actions";

type Props = { messageId: string; initialBody: string; de: boolean; ownMessage: boolean };

/** Inline message correction without a full-page form submission. */
export default function MessageEditControl({ messageId, initialBody, de, ownMessage }: Props) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(initialBody);
  const [error, setError] = useState("");
  const [cancelHovered, setCancelHovered] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function save() {
    const next = body.trim();
    if (!next) { setError(de ? "Die Nachricht darf nicht leer sein." : "The message cannot be empty."); return; }
    if (next === initialBody) { setOpen(false); return; }
    setError("");
    startTransition(async () => {
      try {
        const data = new FormData();
        data.set("messageId", messageId);
        data.set("body", next);
        await editMessage(data);
        setOpen(false);
        router.refresh();
      } catch {
        setError(de ? "Die Nachricht konnte nicht bearbeitet werden." : "The message could not be edited.");
      }
    });
  }

  if (!open) return <button type="button" onClick={() => { setOpen(true); requestAnimationFrame(() => { const textarea = textareaRef.current; if (!textarea) return; textarea.focus(); textarea.setSelectionRange(textarea.value.length, textarea.value.length); }); }} className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full bg-linear-to-r from-(--ig-orange) to-(--ig-red) px-4 text-xs font-black text-white shadow-md shadow-orange-950/25 transition hover:scale-[1.03] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300">{de ? "Bearbeiten" : "Edit"}</button>;

  return <div className={`mt-2 ${ownMessage ? "text-white" : "text-slate-700 dark:text-slate-200"}`}>
    <textarea ref={textareaRef} value={body} onChange={(event) => setBody(event.target.value)} maxLength={4000} rows={3} className="w-full rounded-lg border border-white/40 bg-black/10 px-2 py-1.5 text-xs text-inherit outline-none placeholder:text-current/60 dark:bg-black/20" />
    <div className="mt-3 flex items-center justify-end gap-2">
      <button type="button" onMouseEnter={() => setCancelHovered(true)} onMouseLeave={() => setCancelHovered(false)} onClick={() => { setBody(initialBody); setError(""); setOpen(false); }} disabled={pending} className="grid size-11 place-items-center rounded-full !bg-transparent !text-red-500 transition hover:!bg-transparent disabled:opacity-50" aria-label={de ? "Bearbeiten abbrechen" : "Cancel editing"}><X size={22} strokeWidth={cancelHovered ? 4 : 2.5} /></button>
      <button type="button" onClick={save} disabled={pending} className="flex size-11 items-center justify-center rounded-full bg-linear-to-tr from-(--ig-orange) to-(--ig-red) text-white shadow-md shadow-orange-950/25 transition hover:scale-105 disabled:opacity-60" aria-label={de ? "Nachricht speichern" : "Save message"}>{pending ? <LoaderCircle size={18} className="animate-spin" /> : <Check size={20} />}</button>
    </div>
    {error ? <p className="mt-2 text-xs font-semibold text-red-200 dark:text-red-300">{error}</p> : null}
  </div>;
}
