"use client";

import { Flag, X } from "lucide-react";
import { useState } from "react";
import { createReport } from "@/actions";
import useVibeLanguage from "@/app/components/useVibeLanguage";

export default function ReportButton({ targetType, targetId, targetUrl }: { targetType: "profile" | "post" | "comment"; targetId: string; targetUrl: string }) {
  const de = useVibeLanguage() === "de";
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-300">
        <Flag size={14} /> {de ? "Melden" : "Report"}
      </button>
      {open && <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/65 p-4" role="dialog" aria-modal="true" aria-labelledby={`report-title-${targetId}`} onMouseDown={(event) => { if (event.currentTarget === event.target) setOpen(false); }}>
        <form action={async (formData) => { await createReport(formData); setOpen(false); }} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-4">
            <div><h2 id={`report-title-${targetId}`} className="text-lg font-black text-slate-900 dark:text-white">{de ? "Inhalt melden" : "Report content"}</h2><p className="mt-1 text-sm text-slate-500">{de ? "Deine Meldung wird nur dem Admin-Team angezeigt." : "Your report is visible only to the admin team."}</p></div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={de ? "Schließen" : "Close"}><X size={18} /></button>
          </div>
          <input type="hidden" name="targetType" value={targetType} />
          <input type="hidden" name="targetId" value={targetId} />
          <input type="hidden" name="targetUrl" value={targetUrl} />
          <label className="mt-5 block text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor={`report-category-${targetId}`}>{de ? "Grund" : "Reason"}</label>
          <select id={`report-category-${targetId}`} name="category" required className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white">
            <option value="spam">{de ? "Spam oder Betrug" : "Spam or scam"}</option>
            <option value="harassment">{de ? "Belästigung oder Mobbing" : "Harassment or bullying"}</option>
            <option value="hate">{de ? "Hass oder Diskriminierung" : "Hate or discrimination"}</option>
            <option value="sexual">{de ? "Sexuelle oder unangemessene Inhalte" : "Sexual or inappropriate content"}</option>
            <option value="other">{de ? "Etwas anderes" : "Something else"}</option>
          </select>
          <label className="mt-4 block text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor={`report-description-${targetId}`}>{de ? "Zusätzliche Hinweise (optional)" : "Additional details (optional)"}</label>
          <textarea id={`report-description-${targetId}`} name="description" maxLength={600} rows={4} className="mt-1 w-full resize-none rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-orange-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white" placeholder={de ? "Beschreibe das Problem kurz…" : "Briefly describe the issue…"} />
          <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">{de ? "Abbrechen" : "Cancel"}</button><button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">{de ? "Meldung senden" : "Send report"}</button></div>
        </form>
      </div>}
    </>
  );
}
