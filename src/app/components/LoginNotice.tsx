"use client";
import { useSearchParams } from "next/navigation";
import useVibeLanguage from "./useVibeLanguage";
export default function LoginNotice() {
  const params = useSearchParams();
  const de = useVibeLanguage() === "de";
  const notice = params.get("notice");
  const messages: Record<string, [string, string]> = {
    expired: ["This linking request has expired. Start linking again from Sign-in methods.", "Diese Verknüpfungsanfrage ist abgelaufen. Starte die Verknüpfung unter Anmeldemethoden erneut."],
    link: ["This account already exists. Sign in using your existing method, then link the new provider in Settings → Sign-in methods.", "Dieses Konto existiert bereits. Melde dich mit deiner bisherigen Methode an und verknüpfe den Anbieter unter Einstellungen → Anmeldemethoden."],
    verify: ["Check your email to confirm this sign-in. Then sign in with Microsoft again.", "Bestätige diese Anmeldung über die E-Mail. Melde dich anschließend erneut mit Microsoft an."],
    email: ["This provider did not supply a verified email. Verify your email there or use another sign-in method.", "Dieser Anbieter hat keine bestätigte E-Mail geliefert. Bestätige sie dort oder nutze eine andere Anmeldemethode."],
    linked: ["Sign-in method linked.", "Anmeldemethode verknüpft."],
    conflict: ["This sign-in method belongs to another VIBE account.", "Diese Anmeldemethode gehört zu einem anderen VIBE-Konto."],
    unavailable: ["Sign-in is temporarily unavailable. Please retry.", "Die Anmeldung ist gerade nicht verfügbar. Bitte erneut versuchen."],
  };
  const message = notice ? messages[notice] : params.has("error") ? ["Sign-in failed. Check your details or try another method.", "Anmeldung fehlgeschlagen. Prüfe deine Angaben oder nutze eine andere Methode."] : null;
  return message ? <p role="status" className="rounded-xl border border-orange-400/40 p-3 text-sm">{message[de ? 1 : 0]}</p> : null;
}
