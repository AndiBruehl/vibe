"use client";

import { useState, useTransition } from "react";
import { Pin, PinOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { toggleProfilePostPin } from "@/actions";

export default function ProfilePostPinButton({ postId, initialPinned, language, className = "" }: { postId: string; initialPinned: boolean; language: "de" | "en"; className?: string }) {
  const [pinned, setPinned] = useState(initialPinned);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const de = language === "de";
  const label = pinned ? (de ? "Pin entfernen" : "Unpin") : (de ? "Anpinnen" : "Pin");

  function toggle() {
    setMessage("");
    startTransition(async () => {
      const result = await toggleProfilePostPin(postId);
      if (!result.ok) {
        setMessage(result.error === "limit" ? (de ? "Maximal drei Beiträge können angepinnt werden." : "You can pin up to three posts.") : (de ? "Pin konnte nicht geändert werden." : "Pin could not be changed."));
        return;
      }
      setPinned(Boolean(result.pinned));
      router.refresh();
    });
  }

  return <div className={`relative ${className}`}>
    <button type="button" onClick={toggle} disabled={isPending} aria-label={label} title={label} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold shadow-sm transition disabled:cursor-wait disabled:opacity-60 ${pinned ? "bg-orange-500 text-white" : "bg-slate-950/80 text-white backdrop-blur hover:bg-slate-950"}`}>
      {pinned ? <PinOff size={14} /> : <Pin size={14} />} {isPending ? "…" : label}
    </button>
    {message && <p role="status" className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg bg-slate-950 px-2 py-1.5 text-right text-xs text-white shadow-lg">{message}</p>}
  </div>;
}
