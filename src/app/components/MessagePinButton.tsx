"use client";

import { LoaderCircle, Pin } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleConversationMessagePin } from "@/actions";

type Props = { messageId: string; initialPinned: boolean; de: boolean; ownMessage: boolean };

export default function MessagePinButton({ messageId, initialPinned, de, ownMessage }: Props) {
  const [pending, startTransition] = useTransition();
  const [pinned, setPinned] = useState(initialPinned);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const label = pinned ? (de ? "Anheftung entfernen" : "Remove pin") : (de ? "Nachricht anheften" : "Pin message");

  useEffect(() => { setPinned(initialPinned); }, [initialPinned]);
  useEffect(() => {
    if (!error) return;
    const timeout = window.setTimeout(() => setError(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [error]);

  function toggle() {
    const data = new FormData();
    data.set("messageId", messageId);
    const previous = pinned;
    startTransition(async () => {
      setError(null);
      setPinned(!previous);
      try {
        const result = await toggleConversationMessagePin(data);
        if (result.ok) {
          setPinned(result.pinned ?? !previous);
          router.refresh();
          return;
        }
        setPinned(previous);
        setError(result.reason === "limit" ? (de ? "Es können höchstens drei Nachrichten angeheftet werden" : "You can pin up to three messages") : result.reason === "missing" ? (de ? "Nachricht nicht mehr verfügbar" : "Message is no longer available") : (de ? "Anheften gerade nicht möglich" : "Pinning is unavailable right now"));
      } catch {
        setPinned(previous);
        setError(de ? "Anheften gerade nicht möglich" : "Pinning is unavailable right now");
      }
    });
  }

  return <span className="relative inline-flex"><button type="button" onClick={toggle} disabled={pending} className={`grid size-9 place-items-center rounded-full transition hover:scale-105 disabled:opacity-55 ${ownMessage ? "text-white/80 hover:text-white" : "text-slate-400 hover:text-orange-500 dark:text-slate-500 dark:hover:text-orange-300"}`} aria-label={label} title={label}>{pending ? <LoaderCircle size={17} className="animate-spin" /> : <Pin size={17} className={pinned ? "fill-current" : "fill-transparent"} />}</button>{error ? <span role="status" className="absolute bottom-full right-0 z-30 mb-1 w-max max-w-56 rounded-lg bg-slate-950 px-2 py-1 text-[10px] font-semibold text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">{error}</span> : null}</span>;
}
