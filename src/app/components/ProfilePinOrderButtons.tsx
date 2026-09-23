"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { moveProfilePostPin } from "@/actions";

export default function ProfilePinOrderButtons({ postId, position, total, language }: { postId: string; position: number; total: number; language: "de" | "en" }) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const de = language === "de";

  function move(direction: -1 | 1) {
    setMessage("");
    startTransition(async () => {
      const result = await moveProfilePostPin(postId, direction);
      if (!result.ok) {
        setMessage(de ? "Reihenfolge konnte nicht geändert werden." : "Order could not be changed.");
        return;
      }
      router.refresh();
    });
  }

  return <div className="absolute right-2 top-2 z-10 flex items-center rounded-lg bg-slate-950/80 p-0.5 text-white shadow-sm backdrop-blur">
    <button type="button" onClick={() => move(-1)} disabled={position === 0 || isPending} aria-label={de ? "Pin nach oben" : "Move pin up"} className="rounded p-1.5 transition hover:bg-white/15 disabled:opacity-30"><ArrowUp size={14} /></button>
    <button type="button" onClick={() => move(1)} disabled={position === total - 1 || isPending} aria-label={de ? "Pin nach unten" : "Move pin down"} className="rounded p-1.5 transition hover:bg-white/15 disabled:opacity-30"><ArrowDown size={14} /></button>
    {message && <p role="status" className="absolute right-0 top-full mt-2 w-56 rounded-lg bg-slate-950 px-2 py-1.5 text-right text-xs text-white shadow-lg">{message}</p>}
  </div>;
}
