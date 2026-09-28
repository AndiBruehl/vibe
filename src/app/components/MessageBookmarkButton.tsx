"use client";

import { Bookmark, LoaderCircle } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toggleMessageBookmark } from "@/actions";

type Props = { messageId: string; initialBookmarked: boolean; de: boolean; ownMessage: boolean };

export default function MessageBookmarkButton({ messageId, initialBookmarked, de, ownMessage }: Props) {
  const [pending, startTransition] = useTransition();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [error, setError] = useState<string | null>(null);
  const label = bookmarked ? (de ? "Gespeicherte Nachricht entfernen" : "Remove saved message") : (de ? "Nachricht speichern" : "Save message");

  useEffect(() => {
    if (!error) return;
    const timeout = window.setTimeout(() => setError(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [error]);

  function toggle() {
    const data = new FormData();
    data.set("messageId", messageId);
    const previous = bookmarked;
    startTransition(async () => {
      setError(null);
      setBookmarked(!previous);
      try {
        const result = await toggleMessageBookmark(data);
        if (result.ok) {
          setBookmarked(result.saved ?? !previous);
          return;
        }
        setBookmarked(previous);
        setError(result.reason === "missing" ? (de ? "Nachricht nicht mehr verfügbar" : "Message is no longer available") : (de ? "Speichern gerade nicht möglich" : "Saving is unavailable right now"));
      } catch {
        setBookmarked(previous);
        setError(de ? "Speichern gerade nicht möglich" : "Saving is unavailable right now");
      }
    });
  }

  return <span className="relative inline-flex"><button type="button" onClick={toggle} disabled={pending} className={`grid size-9 place-items-center rounded-full transition hover:scale-105 disabled:opacity-55 ${ownMessage ? "text-white/80 hover:text-white" : "text-slate-400 hover:text-orange-500 dark:text-slate-500 dark:hover:text-orange-300"}`} aria-label={label} title={label}>{pending ? <LoaderCircle size={17} className="animate-spin" /> : <Bookmark size={17} className={bookmarked ? "fill-current" : "fill-transparent"} />}</button>{error ? <span role="status" className="absolute bottom-full right-0 z-20 mb-1 w-max max-w-52 rounded-lg bg-slate-950 px-2 py-1 text-[10px] font-semibold text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">{error}</span> : null}</span>;
}
