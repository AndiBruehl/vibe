"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import useVibeLanguage from "./useVibeLanguage";
import Link from "next/link";

type Provider = { id: string; name: string; enabled: boolean };
type AcknowledgementText = { en: string; de: string };

export default function LoginMethods({ providers, emailEnabled, register = false, linking = false, showGuestLink = true, linkedProviders = [], requireAcknowledgement = false, acknowledgementText }: { providers: Provider[]; emailEnabled: boolean; register?: boolean; linking?: boolean; showGuestLink?: boolean; linkedProviders?: string[]; requireAcknowledgement?: boolean; acknowledgementText?: AcknowledgementText }) {
  const de = useVibeLanguage() === "de";
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register" | "reset">(register ? "register" : "login");
  const [acknowledged, setAcknowledged] = useState(!requireAcknowledgement);
  const t = (en: string, german: string) => de ? german : en;
  const comingSoon = providers.some((provider) => !provider.enabled) || !emailEnabled;
  const disabled = busy || !acknowledged;

  async function requestAccount(action: string) {
    if (disabled) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, email, language: de ? "de" : "en" }), signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw Error("unavailable");
      setMessage(t("If this request is available for your account, an email is on its way. Check your inbox and spam folder.", "Wenn diese Anfrage für dein Konto möglich ist, erhältst du eine E-Mail. Prüfe auch den Spamordner."));
    } catch { setMessage(t("The request could not be completed. Please wait a moment and retry.", "Die Anfrage konnte nicht abgeschlossen werden. Bitte warte kurz und versuche es erneut.")); }
    finally { setBusy(false); }
  }

  async function login(provider: string) {
    if (disabled) return;
    setBusy(true); setMessage("");
    try {
      if (linking) {
        const response = await fetch("/api/auth/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "link", provider }), signal: AbortSignal.timeout(12000) });
        if (!response.ok) throw Error("link unavailable");
      }
      await signIn(provider, {
        redirectTo: linking ? "/settings/login" : "/home",
        ...(provider === "password" ? { email, password } : {}),
      });
    } catch { setBusy(false); setMessage(t("Sign-in could not be started. Please retry.", "Die Anmeldung konnte nicht gestartet werden. Bitte versuche es erneut.")); }
  }

  const button = "min-h-11 w-full rounded-xl bg-linear-to-r from-orange-500 to-red-500 px-4 py-3 font-bold text-white disabled:opacity-50";
  const field = "w-full min-h-11 rounded-xl border border-slate-400/40 bg-white p-3 text-slate-900 dark:bg-slate-800 dark:text-white";
  return <div className="w-full space-y-3">
    {requireAcknowledgement && <label className="flex items-start gap-3 rounded-2xl border border-orange-400/40 bg-orange-50/80 p-3 text-left text-sm font-semibold text-slate-800 dark:bg-slate-950/50 dark:text-slate-100"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-1 size-4 accent-orange-500"/><span>{acknowledgementText ? t(acknowledgementText.en, acknowledgementText.de) : t("I have read and acknowledge this.", "Ich habe das gelesen und verstanden.")}</span></label>}
    {providers.filter((p) => p.enabled && (!linking || !linkedProviders.includes(p.id))).map((provider) => { const linked = linkedProviders.includes(provider.id); return <button key={provider.id} type="button" disabled={disabled || linked} className={`${button} ${linked ? "cursor-not-allowed opacity-45" : ""}`} onClick={() => void login(provider.id)}>{linked ? t("Already linked", "Bereits verknüpft") : linking ? t("Link", "Verknüpfen:") : t("Continue with", "Weiter mit")} {provider.name}</button>; })}
    {emailEnabled && (linking ? <button type="button" disabled={disabled} onClick={() => void requestAccount("setup")} className={button}>{t("Set up email/password", "E-Mail/Passwort einrichten")}</button> : <form onSubmit={(event) => { event.preventDefault(); if (mode === "login") void login("password"); else void requestAccount(mode); }} className="space-y-3 border-t border-slate-400/30 pt-4 text-left">
      <h2 className="font-bold">{mode === "login" ? t("Email and password", "E-Mail und Passwort") : mode === "reset" ? t("Reset password", "Passwort zurücksetzen") : t("Register with email", "Mit E-Mail registrieren")}</h2>
      <label className="block text-sm">{t("Email", "E-Mail")}<input className={field} type="email" autoComplete="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} required/></label>
      {mode === "login" && <label className="block text-sm">{t("Password", "Passwort")}<input className={field} type="password" autoComplete="current-password" minLength={12} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} required/></label>}
      {mode === "register" && <p className="text-sm">{t("Verify your email first, then choose a password using the link we send you.", "Bestätige zuerst deine E-Mail. Über den zugesendeten Link legst du anschließend dein Passwort fest.")}</p>}
      <button disabled={disabled} className={button}>{busy ? t("Please wait…", "Bitte warten…") : mode === "login" ? t("Sign in", "Anmelden") : t("Send email", "E-Mail senden")}</button>
      <div className="flex flex-wrap gap-4 text-sm">{(["login", "register", "reset"] as const).filter((value) => value !== mode).map((value) => <button key={value} type="button" onClick={() => { setMode(value); setMessage(""); setPassword(""); }} className="min-h-11 font-bold text-orange-500">{value === "login" ? t("Sign in", "Anmelden") : value === "register" ? t("Create account", "Konto erstellen") : t("Forgot password?", "Passwort vergessen?")}</button>)}</div>
    </form>)}
    {message && <p role="status" className="text-sm">{message}</p>}
    {comingSoon && <p className="text-center text-xs opacity-75">{t("Other sign-in methods are coming soon.", "Weitere Anmeldemethoden folgen bald.")}</p>}
    {!linking && showGuestLink && <Link href="/home" className="inline-block py-2 text-sm">{t("Continue as a guest", "Weiter als Gast")}</Link>}
  </div>;
}
