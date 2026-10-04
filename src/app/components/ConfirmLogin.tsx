"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import useVibeLanguage from "./useVibeLanguage";
export default function ConfirmLogin() {
  const de = useVibeLanguage() === "de";
  const t = (en: string, german: string) => de ? german : en;
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [oauth, setOauth] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    const value = window.location.hash.slice(1);
    // Keep the secret out of subsequent links and browser history entries.
    window.history.replaceState(null, "", window.location.pathname);
    setToken(value);
  }, []);
  async function confirm() {
    setBusy(true); setError(false);
    try {
      const response = await fetch("/api/auth/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "confirm", token, password: oauth ? undefined : password }), signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw Error("failed");
      setDone(true); setPassword(""); setRepeat(""); setToken("");
    } catch { setError(true); }
    finally { setBusy(false); }
  }
  const field = "w-full rounded-xl border border-slate-400/40 bg-white p-3 text-slate-900 dark:bg-slate-800 dark:text-white";
  return <section className="mx-auto max-w-lg space-y-4 rounded-2xl border border-slate-400/30 p-6">
    <h1 className="text-2xl font-bold">{t("Confirm your request", "Anfrage bestätigen")}</h1>
    {done ? <p>{t("Confirmed. You can now sign in using your chosen method.", "Bestätigt. Du kannst dich jetzt mit deiner gewählten Methode anmelden.")}</p> : <form onSubmit={(e) => { e.preventDefault(); void confirm(); }} className="space-y-4">
      <label className="flex items-center gap-2"><input type="checkbox" checked={oauth} onChange={(e) => setOauth(e.target.checked)}/>{t("This email confirms Microsoft sign-in", "Diese E-Mail bestätigt die Microsoft-Anmeldung")}</label>
      {!oauth && <><label className="block">{t("New password (12–128 characters)", "Neues Passwort (12–128 Zeichen)")}<input type="password" autoComplete="new-password" minLength={12} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} className={field} required/></label><label className="block">{t("Repeat password", "Passwort wiederholen")}<input type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} className={field} required/></label></>}
      <button disabled={busy || !/^[a-f0-9]{64}$/.test(token) || (!oauth && (password.length < 12 || password !== repeat))} className="min-h-11 rounded-xl bg-linear-to-r from-orange-500 to-red-500 px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? t("Please wait…", "Bitte warten…") : t("Confirm", "Bestätigen")}</button>
      {error && <p role="alert">{t("Could not confirm. The link may have expired or already been used. Request a new email if retrying fails.", "Bestätigung fehlgeschlagen. Der Link ist möglicherweise abgelaufen oder bereits benutzt. Fordere bei erneutem Fehler eine neue E-Mail an.")}</p>}
    </form>}
    <Link href="/" className="inline-block font-bold text-orange-500">{t("Back to sign-in", "Zur Anmeldung")}</Link>
  </section>;
}
