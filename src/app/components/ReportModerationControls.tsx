"use client";

import { useState } from "react";
import { moderateReport } from "@/actions";

export default function ReportModerationControls({ reportId, targetType, status, currentAction, de, canRemoveContent }: { reportId: string; targetType: string; status: string; currentAction: string | null; de: boolean; canRemoveContent: boolean }) {
  const [action, setAction] = useState(currentAction || (status === "open" ? "review" : "no-action"));
  const canRemove = canRemoveContent && targetType !== "profile";
  return <form action={moderateReport} className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/80">
    <input type="hidden" name="reportId" value={reportId} />
    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200" htmlFor={`report-action-${reportId}`}>{de ? "Moderationsentscheidung" : "Moderation decision"}</label>
    <select id={`report-action-${reportId}`} name="action" value={action} onChange={(event) => setAction(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white">
      <option value="no-action">{de ? "Keine Maßnahme erforderlich" : "No action needed"}</option>
      <option value="review">{de ? "Weiter prüfen" : "Continue reviewing"}</option>
      {canRemove && <option value="content-removed">{de ? "Gemeldeten Inhalt löschen" : "Remove reported content"}</option>}
      <option value="other">{de ? "Andere Maßnahme" : "Other action"}</option>
    </select>
    <textarea name="moderationNote" required={action === "other"} maxLength={600} rows={2} className="mt-3 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white" placeholder={action === "other" ? (de ? "Beschreibe die Maßnahme…" : "Describe the action taken…") : (de ? "Zusätzliche Nachricht an den Melder (optional)…" : "Additional message to the reporter (optional)…")} />
    <p className="mt-2 text-xs text-slate-500">{de ? "Beim Anwenden erhält der Melder automatisch eine Nachricht von VibeTeam." : "Applying this sends the reporter an automatic VibeTeam message."}</p>
    <button className="mt-3 rounded-lg bg-linear-to-r from-(--ig-orange) to-(--ig-red) px-3 py-2 text-xs font-bold text-white">{de ? "Anwenden und informieren" : "Apply and notify"}</button>
  </form>;
}
