"use client";
import { useSearchParams } from "next/navigation";
import useVibeLanguage from "./useVibeLanguage";
export default function LoginNotice() {
  const params = useSearchParams();
  const de = useVibeLanguage() === "de";
  const notice = params.get("notice");
  const messages: Record<string, [string, string]> = {
    cancelled: ["Linking cancelled. Your existing sign-in methods are unchanged.", "Verknüpfung abgebrochen. Deine bisherigen Anmeldemethoden bleiben unverändert."],
    linkfailed: ["Linking could not be completed. Please try again here.", "Die Verknüpfung konnte nicht abgeschlossen werden. Bitte versuche es hier erneut."],
    expired: ["This linking request has expired. Start linking again from Sign-in methods.", "Diese Verknüpfungsanfrage ist abgelaufen. Starte die Verknüpfung unter Anmeldemethoden erneut."],
    link: ["This account already exists. Sign in using your existing method, then link the new provider in Settings → Sign-in methods.", "Dieses Konto existiert bereits. Melde dich mit deiner bisherigen Methode an und verknüpfe den Anbieter unter Einstellungen → Anmeldemethoden."],
    verify: ["Check your email to confirm this sign-in. Then sign in with Microsoft again.", "Bestätige diese Anmeldung über die E-Mail. Melde dich anschließend erneut mit Microsoft an."],
    email: ["This provider did not supply a verified email. Verify your email there or use another sign-in method.", "Dieser Anbieter hat keine bestätigte E-Mail geliefert. Bestätige sie dort oder nutze eine andere Anmeldemethode."],
    linked: ["Sign-in method linked.", "Anmeldemethode verknüpft."],
    conflict: ["This sign-in method belongs to another VIBE account.", "Diese Anmeldemethode gehört zu einem anderen VIBE-Konto."],
    unavailable: ["Sign-in is temporarily unavailable. Please retry.", "Die Anmeldung ist gerade nicht verfügbar. Bitte erneut versuchen."],
  };
  const errors: Record<string, [string, string]> = {
    AccessDenied: ["Sign-in was not authorized. Try again and allow access at your provider.", "Die Anmeldung wurde nicht freigegeben. Versuche es erneut und erlaube den Zugriff beim Anbieter."],
    OAuthCallbackError: ["The provider response could not be confirmed. Start sign-in again from this page.", "Die Antwort des Anbieters konnte nicht bestätigt werden. Starte die Anmeldung von dieser Seite erneut."],
    Configuration: ["This sign-in method is currently unavailable. Try another linked method or contact support.", "Diese Anmeldemethode ist gerade nicht verfügbar. Nutze eine andere verknüpfte Methode oder kontaktiere den Support."],
  };
  const error = params.get("error");
  const message = notice ? messages[notice] : params.has("error") ? errors[error || ""] || ["Sign-in could not be completed. Start again or use another linked method.", "Die Anmeldung konnte nicht abgeschlossen werden. Starte erneut oder nutze eine andere verknüpfte Methode."] : null;
  return message ? <p role="status" className="rounded-xl border border-orange-400/40 p-3 text-sm">{message[de ? 1 : 0]}</p> : null;
}
