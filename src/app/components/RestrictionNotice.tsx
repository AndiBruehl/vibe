"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, ShieldAlert } from "lucide-react";

type Restriction = { endsAt: string; blocksMessages: boolean; blocksComments: boolean; blocksPosts: boolean };

function remaining(endsAt: string) {
  const ms = Math.max(0, new Date(endsAt).getTime() - Date.now());
  const minutes = Math.ceil(ms / 60000);
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export default function RestrictionNotice({ restriction, language }: { restriction: Restriction | null; language: "de" | "en" }) {
  const [clock, setClock] = useState(() => restriction ? remaining(restriction.endsAt) : "");
  const router = useRouter();
  useEffect(() => {
    if (!restriction) return;
    const update = () => {
      const ms = new Date(restriction.endsAt).getTime() - Date.now();
      setClock(remaining(restriction.endsAt));
      if (ms <= 0) router.refresh();
    };
    update();
    const interval = window.setInterval(update, 30000);
    return () => window.clearInterval(interval);
  }, [restriction, router]);
  if (!restriction) return null;
  const de = language === "de";
  const affected = [restriction.blocksMessages && (de ? "Nachrichten" : "messages"), restriction.blocksComments && (de ? "Kommentare" : "comments"), restriction.blocksPosts && (de ? "Beiträge" : "posts")].filter(Boolean).join(", ");
  return <div className="fixed inset-x-3 top-3 z-[80] mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-amber-400/60 bg-amber-50 px-4 py-3 text-amber-950 shadow-xl dark:bg-slate-900 dark:text-amber-100 md:left-48 md:right-auto"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-400/20"><ShieldAlert size={19}/></span><div className="min-w-0"><p className="text-sm font-black">{de ? "Temporäre Restriktion aktiv" : "Temporary restriction active"}</p><p className="text-xs opacity-80">{de ? `Eingeschränkt: ${affected}.` : `Restricted: ${affected}.`}</p></div><div className="ml-auto shrink-0 text-right"><p className="flex items-center justify-end gap-1 text-[11px] font-bold opacity-75"><Clock3 size={12}/>{de ? "Restriktion endet in" : "Restrictions ending in"}</p><p className="font-mono text-lg font-black tabular-nums">{clock}</p></div></div>;
}
