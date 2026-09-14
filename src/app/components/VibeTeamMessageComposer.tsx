"use client";

import { useMemo, useState } from "react";
import { sendVibeTeamMessageAsAdmin } from "@/actions";

type Recipient = { id: string; username: string | null; name: string | null };
type Template = "welcome" | "report-received" | "report-update" | "content-removed" | "account-warning" | "account-restriction" | "support" | "technical-help" | "friendly-follow-up" | "case-closed" | "custom";

const copy: Record<Template, { de: string; en: string; previewDe: string; previewEn: string }> = {
  welcome: { de: "Willkommen", en: "Welcome", previewDe: "Willkommen bei VIBE! Schön, dass du hier bist. Wir wünschen dir viel Freude beim Entdecken, Teilen und Vernetzen.", previewEn: "Welcome to VIBE! We are happy you are here and hope you enjoy discovering, sharing, and connecting." },
  "report-received": { de: "Meldung eingegangen", en: "Report received", previewDe: "Danke, dass du dir die Zeit für eine Meldung genommen hast. Wir haben sie erhalten und schauen uns den Sachverhalt sorgfältig an.", previewEn: "Thank you for taking the time to send a report. We received it and will review the situation carefully." },
  "report-update": { de: "Update zu einer Meldung", en: "Report update", previewDe: "Danke für deine Geduld. Es gibt ein Update zu deiner Meldung: Unser Team hat den Vorgang erneut geprüft.", previewEn: "Thank you for your patience. There is an update regarding your report: our team reviewed the case again." },
  "content-removed": { de: "Inhalt entfernt", en: "Content removed", previewDe: "Danke für deinen Hinweis. Nach unserer Prüfung wurde der betreffende Inhalt entfernt.", previewEn: "Thank you for bringing this to our attention. Following our review, the relevant content was removed." },
  "account-warning": { de: "Verwarnung", en: "Account warning", previewDe: "Wir möchten dich persönlich auf einen möglichen Verstoß gegen unsere Community-Regeln hinweisen. Bitte wirf einen Blick auf die folgenden Informationen.", previewEn: "We want to personally let you know about a possible violation of our community rules. Please review the information below." },
  "account-restriction": { de: "Kontoeinschränkung", en: "Account restriction", previewDe: "Nach einer sorgfältigen Prüfung wurde für dein Konto eine Einschränkung vorgenommen. Wenn etwas unklar ist, kannst du den Support kontaktieren.", previewEn: "After a careful review, a restriction was applied to your account. If anything is unclear, you can contact support." },
  support: { de: "Support-Antwort", en: "Support reply", previewDe: "Danke für deine Nachricht. Wir haben dein Anliegen erhalten und helfen dir gerne weiter. Ein Mitglied unseres Teams meldet sich so bald wie möglich.", previewEn: "Thank you for your message. We received your request and are happy to help. A member of our team will get back to you as soon as possible." },
  "technical-help": { de: "Technisches Problem", en: "Technical issue", previewDe: "Danke für die genaue Beschreibung. Wir prüfen das technische Problem und geben dir Bescheid, sobald wir mehr wissen.", previewEn: "Thank you for the detailed description. We are looking into the technical issue and will let you know as soon as we have more information." },
  "friendly-follow-up": { de: "Freundliche Nachfrage", en: "Friendly follow-up", previewDe: "Wir wollten kurz nachfragen, ob unser letzter Hinweis dir weiterhelfen konnte. Gib uns gerne Bescheid, falls du noch Unterstützung brauchst.", previewEn: "We wanted to check whether our previous note helped. Please let us know if you still need support." },
  "case-closed": { de: "Anliegen abgeschlossen", en: "Case closed", previewDe: "Dein Anliegen wurde von uns abgeschlossen. Danke für deine Geduld und dafür, dass du VIBE mitgestaltest.", previewEn: "We have closed your request. Thank you for your patience and for helping shape VIBE." },
  custom: { de: "Freie Nachricht", en: "Free message", previewDe: "Der eigene Text wird unverändert versendet.", previewEn: "Your own text will be sent as written." },
};

export default function VibeTeamMessageComposer({ recipients, de }: { recipients: Recipient[]; de: boolean }) {
  const [template, setTemplate] = useState<Template>("support");
  const preview = useMemo(() => copy[template][de ? "previewDe" : "previewEn"], [template, de]);

  return <details className="border-t border-slate-200 pt-8 dark:border-slate-700">
    <summary className="cursor-pointer text-lg font-black text-slate-900 dark:text-white">{de ? "VibeTeam-Nachricht senden" : "Send VibeTeam message"}</summary>
    <p className="mt-2 text-sm text-slate-500">{de ? "Wähle einen geprüften Textbaustein und ergänze bei Bedarf eigene Informationen. VibeTeam-Nachrichten können nicht beantwortet werden." : "Choose a reviewed message template and add your own details if needed. VibeTeam messages cannot be replied to."}</p>
    <form action={sendVibeTeamMessageAsAdmin} className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200" htmlFor="vibeteam-recipient">{de ? "Empfänger" : "Recipient"}<select id="vibeteam-recipient" name="profileId" required className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white"><option value="">{de ? "Profil auswählen" : "Select a profile"}</option>{recipients.map((recipient) => <option key={recipient.id} value={recipient.id}>@{recipient.username || recipient.name || recipient.id}</option>)}</select></label>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200" htmlFor="vibeteam-template">{de ? "Textbaustein" : "Message template"}<select id="vibeteam-template" name="template" value={template} onChange={(event) => setTemplate(event.target.value as Template)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white">{(Object.keys(copy) as Template[]).map((key) => <option key={key} value={key}>{copy[key][de ? "de" : "en"]}</option>)}</select></label>
      </div>
      <div className="mt-4 rounded-xl border border-cyan-300/60 bg-cyan-50/60 p-3 text-sm text-slate-700 dark:border-cyan-500/25 dark:bg-cyan-500/10 dark:text-slate-200"><p className="text-xs font-black uppercase tracking-wide text-cyan-700 dark:text-cyan-200">{de ? "Vorschau" : "Preview"}</p><p className="mt-1 whitespace-pre-wrap">{preview}</p></div>
      <label className="mt-4 block text-xs font-bold text-slate-700 dark:text-slate-200" htmlFor="vibeteam-additional">{template === "custom" ? (de ? "Nachricht" : "Message") : (de ? "Eigene Ergänzung (optional)" : "Additional text (optional)")}</label>
      <textarea id="vibeteam-additional" name="additionalMessage" required={template === "custom"} maxLength={2000} rows={4} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white" placeholder={template === "custom" ? (de ? "Eigene Nachricht von VibeTeam…" : "Your own VibeTeam message…") : (de ? "Zusätzliche Informationen für den Empfänger…" : "Additional information for the recipient…")} />
      <button className="mt-3 rounded-xl bg-linear-to-r from-(--ig-orange) to-(--ig-red) px-4 py-2 text-sm font-bold text-white">{de ? "Als VibeTeam senden" : "Send as VibeTeam"}</button>
    </form>
  </details>;
}
