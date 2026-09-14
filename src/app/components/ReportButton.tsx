"use client";

import { Flag } from "lucide-react";
import { createReport } from "@/actions";
import useVibeLanguage from "@/app/components/useVibeLanguage";

export default function ReportButton({ targetType, targetId, targetUrl }: { targetType: "profile" | "post" | "comment"; targetId: string; targetUrl: string }) {
  const de = useVibeLanguage() === "de";
  return (
    <details className="relative inline-block">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-300">
        <Flag size={14} /> {de ? "Melden" : "Report"}
      </summary>
      <form action={createReport} className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <input type="hidden" name="targetType" value={targetType} />
        <input type="hidden" name="targetId" value={targetId} />
        <input type="hidden" name="targetUrl" value={targetUrl} />
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">{de ? "Grund" : "Reason"}</label>
        <textarea name="reason" required minLength={3} maxLength={600} rows={3} className="mt-1 w-full resize-none rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 outline-none focus:border-orange-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white" placeholder={de ? "Beschreibe kurz das Problem…" : "Briefly describe the issue…"} />
        <button className="mt-2 w-full rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700">{de ? "Meldung senden" : "Send report"}</button>
      </form>
    </details>
  );
}
