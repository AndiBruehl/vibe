"use client";
import { useSearchParams } from "next/navigation";
import useVibeLanguage from "./useVibeLanguage";
export default function LoginNotice() {
  const params = useSearchParams();
  const de = useVibeLanguage() === "de";
  const notice = params.get("notice");
  const messages: Record<string, [string, string]> = {
    cancelled: ["Linking was cancelled before anything changed. Your existing sign-in methods are still active.", "Die Verknüpfung wurde abgebrochen, bevor etwas geändert wurde. Deine bisherigen Anmeldemethoden bleiben aktiv."],
    linkfailed: ["Linking could not be completed. Start it again here; your current session is still active.", "Die Verknüpfung konnte nicht abgeschlossen werden. Starte sie hier erneut; deine aktuelle Sitzung bleibt aktiv."],
    expired: ["This linking request expired. Start a fresh link from Sign-in methods so the provider can be verified again.", "Diese Verknüpfungsanfrage ist abgelaufen. Starte unter Anmeldemethoden eine neue Verknüpfung, damit der Anbieter erneut geprüft wird."],
    link: ["This provider appears to belong to an existing VIBE profile. Sign in with that profile first, then link the new provider in Settings → Sign-in methods.", "Dieser Anbieter scheint zu einem bestehenden VIBE-Profil zu gehören. Melde dich zuerst mit diesem Profil an und verknüpfe den neuen Anbieter dann unter Einstellungen → Anmeldemethoden."],
    verify: ["Check your email to confirm this sign-in. Then sign in with Microsoft again.", "Bestätige diese Anmeldung über die E-Mail. Melde dich anschließend erneut mit Microsoft an."],
    email: ["This provider did not supply a verified email. Verify your email there or use another sign-in method.", "Dieser Anbieter hat keine bestätigte E-Mail geliefert. Bestätige sie dort oder nutze eine andere Anmeldemethode."],
    linked: ["Sign-in method linked. You can use either method next time.", "Anmeldemethode verknüpft. Du kannst beim nächsten Mal beide Methoden verwenden."],
    conflict: ["This sign-in method is already linked to another VIBE account. Your current account was not changed.", "Diese Anmeldemethode ist bereits mit einem anderen VIBE-Konto verknüpft. Dein aktuelles Konto wurde nicht geändert."],
    unavailable: ["Sign-in is temporarily unavailable. Keep this page open and try again in a moment.", "Die Anmeldung ist gerade nicht verfügbar. Lass diese Seite offen und versuche es gleich erneut."],
    "session-expired": ["Your session ended or was revoked. Sign in again with one of your linked methods.", "Deine Sitzung ist abgelaufen oder wurde widerrufen. Melde dich erneut mit einer deiner verknüpften Methoden an."],
  };
  const errors: Record<string, [string, string]> = {
    AccessDenied: ["The provider did not authorize this sign-in. Try again and allow access, or choose another linked method.", "Der Anbieter hat diese Anmeldung nicht freigegeben. Versuche es erneut und erlaube den Zugriff oder nutze eine andere verknüpfte Methode."],
    OAuthCallbackError: ["The provider response could not be confirmed. Start sign-in again from this page so VIBE can create a fresh attempt.", "Die Antwort des Anbieters konnte nicht bestätigt werden. Starte die Anmeldung erneut von dieser Seite, damit VIBE einen frischen Versuch anlegt."],
    Configuration: ["This sign-in method is currently unavailable. Try another linked method or contact support.", "Diese Anmeldemethode ist gerade nicht verfügbar. Nutze eine andere verknüpfte Methode oder kontaktiere den Support."],
  };
  const error = params.get("error");
  const message = notice ? messages[notice] : params.has("error") ? errors[error || ""] || ["Sign-in could not be completed. No account was changed. Start again or use another linked method.", "Die Anmeldung konnte nicht abgeschlossen werden. Es wurde kein Konto geändert. Starte erneut oder nutze eine andere verknüpfte Methode."] : null;
  return message ? <p role="status" className="rounded-xl border border-orange-400/40 p-3 text-sm">{message[de ? 1 : 0]}</p> : null;
}
