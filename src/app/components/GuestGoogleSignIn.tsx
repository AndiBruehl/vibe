"use client";
import { useRef, useState } from "react";
import LocalizedText from "./LocalizedText";

// Post directly to Auth.js with its CSRF token; no anonymous server actions are needed.
export default function GuestGoogleSignIn({ register = false }: { register?: boolean }) {
  const form = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function start() {
    if (busy) return;
    setBusy(true); setError(false);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch("/api/auth/csrf", { cache: "no-store", signal: controller.signal });
      const data = await response.json();
      if (!response.ok || typeof data?.csrfToken !== "string" || !data.csrfToken) throw Error("Missing token");
      const field = form.current?.elements.namedItem("csrfToken");
      if (!(field instanceof HTMLInputElement) || !form.current) throw Error("Missing form");
      field.value = data.csrfToken;
      form.current.submit();
    } catch { setError(true); setBusy(false); }
    finally { clearTimeout(timeout); }
  }
  return <div><form ref={form} action="/api/auth/signin/google" method="post">
    <input type="hidden" name="csrfToken"/><input type="hidden" name="callbackUrl" value="/home"/>
    <button type="button" onClick={() => void start()} disabled={busy} className="min-h-11 w-full rounded-2xl bg-linear-to-r from-orange-500 to-red-500 px-6 py-3 font-bold text-white disabled:opacity-60">
      {busy ? <LocalizedText en="Opening Google…" de="Google wird geöffnet…"/> : register ? <LocalizedText en="Create account with Google" de="Konto mit Google erstellen"/> : <LocalizedText en="Sign in with Google" de="Mit Google anmelden"/>}
    </button>
  </form>{error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-300"><LocalizedText en="Sign-in could not be started. Please try again." de="Die Anmeldung konnte nicht gestartet werden. Bitte versuche es erneut."/></p>}</div>;
}
