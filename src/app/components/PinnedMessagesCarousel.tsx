"use client";

import { ChevronLeft, ChevronRight, LoaderCircle, Pin, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeConversationMessagePin } from "@/actions";

type PinnedMessage = { id: string; messageId: string; body: string; sender: string };

export default function PinnedMessagesCarousel({ messages, de }: { messages: PinnedMessage[]; de: boolean }) {
  const [active, setActive] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const count = messages.length;
  const index = count ? Math.min(active, count - 1) : 0;
  const message = messages[index];

  useEffect(() => { if (!error) return; const timeout = window.setTimeout(() => setError(null), 5000); return () => window.clearTimeout(timeout); }, [error]);
  useEffect(() => { setActive((current) => Math.min(current, Math.max(messages.length - 1, 0))); }, [messages.length]);
  if (!message) return null;

  const move = (direction: -1 | 1) => setActive((current) => (current + direction + count) % count);
  const jumpToMessage = () => document.getElementById(`message-${message.messageId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  const remove = () => {
    const data = new FormData();
    data.set("pinId", message.id);
    startTransition(async () => {
      setError(null);
      try {
        const result = await removeConversationMessagePin(data);
        if (result.ok) { router.refresh(); return; }
        setError(result.reason === "missing" ? (de ? "Anheftung nicht mehr verfügbar" : "Pin is no longer available") : (de ? "Anheftung konnte nicht entfernt werden" : "The pin could not be removed"));
      } catch { setError(de ? "Anheftung konnte nicht entfernt werden" : "The pin could not be removed"); }
    });
  };

  return <section data-vibe-pinned-messages className="mx-4 mb-2 flex shrink-0 items-center gap-1 rounded-xl border border-orange-300/60 bg-orange-50/80 px-2 py-1.5 shadow-sm dark:border-orange-400/30 dark:bg-orange-400/10 sm:mx-6" aria-label={de ? "Angeheftete Nachrichten" : "Pinned messages"}>
    <Pin size={15} className="shrink-0 fill-orange-400 text-orange-500 dark:text-orange-300" aria-hidden="true" />
    {count > 1 ? <button type="button" onClick={() => move(-1)} className="grid size-8 shrink-0 place-items-center rounded-full text-orange-600 transition hover:bg-orange-500/10 dark:text-orange-300" aria-label={de ? "Vorherige angeheftete Nachricht" : "Previous pinned message"}><ChevronLeft size={18} /></button> : null}
    <button type="button" onClick={jumpToMessage} className="min-w-0 flex-1 text-left" title={de ? "Zur Nachricht springen" : "Jump to message"}><p className="truncate text-xs font-black text-slate-800 dark:text-slate-100">{message.sender}</p><p className="truncate text-xs text-slate-600 dark:text-slate-300">{message.body || (de ? "Mediennachricht" : "Media message")}</p></button>
    {count > 1 ? <button type="button" onClick={() => move(1)} className="grid size-8 shrink-0 place-items-center rounded-full text-orange-600 transition hover:bg-orange-500/10 dark:text-orange-300" aria-label={de ? "Nächste angeheftete Nachricht" : "Next pinned message"}><ChevronRight size={18} /></button> : null}
    <span className="min-w-8 text-center text-[10px] font-black text-orange-700 dark:text-orange-200">{index + 1}/{count}</span>
    <button type="button" onClick={remove} disabled={pending} className="grid size-8 shrink-0 place-items-center rounded-full text-red-500 transition hover:scale-105 hover:text-red-600 disabled:opacity-50 dark:text-red-300 dark:hover:text-red-200" aria-label={de ? "Anheftung entfernen" : "Remove pin"} title={de ? "Anheftung entfernen" : "Remove pin"}>{pending ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}</button>
    {error ? <span role="status" className="sr-only">{error}</span> : null}
  </section>;
}
