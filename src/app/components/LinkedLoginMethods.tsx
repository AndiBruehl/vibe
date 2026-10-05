"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import useVibeLanguage from "./useVibeLanguage";

export default function LinkedLoginMethods({ methods }: { methods: { provider: string; name: string; since: string; enabled: boolean }[] }) {
  const de = useVibeLanguage() === "de";
  const router = useRouter();
  const [confirm, setConfirm] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [removedProviders, setRemovedProviders] = useState<string[]>([]);
  const visibleMethods = methods.filter((method) => !removedProviders.includes(method.provider));
  const canRemove = (provider: string) => visibleMethods.some((method) => method.provider !== provider && method.enabled);
  async function unlink(provider: string) {
    if (busy || !canRemove(provider)) return;
    setBusy(true); setFeedback("");
    try {
      const response = await fetch("/api/auth/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "unlink", provider }), signal: AbortSignal.timeout(12000) });
      const data = await response.json();
      if (!response.ok) {
        if (data.error === "LastMethod") setFeedback(de ? "Deine letzte verfügbare Anmeldemethode kann nicht entfernt werden." : "Your last available sign-in method cannot be removed.");
        else if (response.status === 401) setFeedback(de ? "Bitte melde dich erneut an." : "Please sign in again.");
        else throw Error("unavailable");
      } else { setRemovedProviders((current) => [...current, provider]); setConfirm(null); setFeedback(de ? "Anmeldemethode entfernt." : "Sign-in method removed."); router.refresh(); }
    } catch { setFeedback(de ? "Der Status konnte nicht bestätigt werden. Lade die Seite neu und versuche es erneut." : "The result could not be confirmed. Reload this page and try again."); }
    finally { setBusy(false); }
  }
  return <div className="overflow-hidden rounded-2xl border border-slate-300 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/20">
    {visibleMethods.map((method) => <div key={method.provider} className="border-b border-slate-200 p-4 last:border-b-0 dark:border-slate-700">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="flex items-center gap-2 font-bold">{method.name}<Check size={18} strokeWidth={3} className="shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /></p><p className="text-xs text-slate-500 dark:text-slate-400">{method.enabled ? (de ? "Verknüpft" : "Linked") : (de ? "Verknüpft · derzeit nicht verfügbar" : "Linked · currently unavailable")} · {method.since.slice(0, 10)}</p></div>
      {["google", "discord"].includes(method.provider) && canRemove(method.provider) && <button type="button" disabled={busy} onClick={() => setConfirm(method.provider)} className="min-h-11 rounded-xl border border-red-400/50 px-3 text-sm font-semibold text-red-600 disabled:opacity-50 dark:text-red-300">{de ? "Entfernen" : "Remove"}</button>}</div>
      {!canRemove(method.provider) && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{de ? "Zum Entfernen zuerst eine weitere Anmeldemethode verknüpfen." : "Link another sign-in method before removing this one."}</p>}
      {confirm === method.provider && canRemove(method.provider) && <div className="mt-3 space-y-2"><p className="text-sm">{de ? "Du musst danach eine andere verknüpfte Methode zur Anmeldung verwenden." : "You will need another linked method to sign in afterwards."}</p><div className="flex gap-3"><button type="button" disabled={busy} onClick={() => void unlink(method.provider)} className="min-h-11 rounded-xl bg-red-600 px-4 font-bold text-white disabled:opacity-50">{busy ? (de ? "Bitte warten…" : "Please wait…") : (de ? "Verknüpfung entfernen" : "Unlink method")}</button><button type="button" disabled={busy} onClick={() => setConfirm(null)} className="min-h-11 px-3">{de ? "Abbrechen" : "Cancel"}</button></div></div>}
    </div>)}
    {feedback && <p role="status" className="px-4 py-4 text-sm">{feedback}</p>}
  </div>;
}
