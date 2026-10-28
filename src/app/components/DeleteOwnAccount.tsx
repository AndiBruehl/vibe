"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { deleteOwnProfile } from "@/actions";
import { AlertTriangle, Trash2 } from "lucide-react";

function clearLocalAccountDrafts() {
  const localPrefixes = ["vibe.commentDraft.", "vibe.messageDraft.", "vibe.supportDraft."];
  try {
    const keys = Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index)).filter((key): key is string => Boolean(key));
    for (const key of keys) {
      if (key === "vibe.postDraft.v1" || localPrefixes.some((prefix) => key.startsWith(prefix))) window.localStorage.removeItem(key);
    }
  } catch { /* Device-local drafts are best-effort cleanup; server deletion remains authoritative. */ }
  try {
    const keys = Array.from({ length: window.sessionStorage.length }, (_, index) => window.sessionStorage.key(index)).filter((key): key is string => Boolean(key));
    for (const key of keys) if (key.startsWith("vibe.locationDraft.")) window.sessionStorage.removeItem(key);
  } catch { /* Location drafts are also optional device-local data. */ }
}

export default function DeleteOwnAccount({ de, blockedReason }: { de: boolean; blockedReason?: "protected" | "system" }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const confirmationWord = de ? "LÖSCHEN" : "DELETE";
  const isConfirmed = confirmation.trim().toLocaleUpperCase(de ? "de-DE" : "en-US") === confirmationWord;

  const close = () => {
    if (pending) return;
    setOpen(false);
    setConfirmation("");
    setError("");
  };

  const handleDelete = async () => {
    if (!isConfirmed || pending) return;
    setPending(true);
    setError("");
    const formData = new FormData();
    formData.set("confirmation", "DELETE");
    try {
      await deleteOwnProfile(formData);
      clearLocalAccountDrafts();
      try { await signOut({ redirect: false }); }
      catch { /* The deleted profile invalidates this session even if cookie sign-out is unavailable. */ }
      window.location.assign("/");
    } catch {
      setPending(false);
      setError(de ? "Das Konto konnte nicht gelöscht werden. Bitte versuche es erneut." : "The account could not be deleted. Please try again.");
    }
  };

  return (
    <>
      <section data-account-deletion="" aria-labelledby="delete-own-account-title" className="mt-8 rounded-2xl border border-red-300/70 bg-red-50/70 p-4 dark:border-red-400/30 dark:bg-red-950/20 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h2 id="delete-own-account-title" className="text-base font-black text-red-900 dark:text-red-100">{de ? "Konto dauerhaft löschen" : "Permanently delete account"}</h2>
            <p className="mt-1 text-sm leading-5 text-red-900/75 dark:text-red-100/75">{de ? "Löscht dein VIBE-Profil und die damit verbundenen Inhalte und Anmeldedaten unwiderruflich." : "Permanently removes your VIBE profile, its content, and linked sign-in data."}</p>
            {blockedReason && <p className="mt-2 text-sm font-bold text-red-800 dark:text-red-200">{blockedReason === "system" ? (de ? "Systemkonten können nicht gelöscht werden." : "System accounts cannot be deleted.") : (de ? "Dieses geschützte Administratorkonto kann hier nicht gelöscht werden." : "This protected administrator account cannot be deleted here.")}</p>}
          </div>
          <button type="button" onClick={() => setOpen(true)} disabled={Boolean(blockedReason)} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-red-500/60 bg-white px-3.5 text-sm font-black text-red-700 transition hover:-translate-y-0.5 hover:border-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:border-red-500/60 disabled:hover:bg-white dark:border-red-400/50 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-900/50 dark:disabled:hover:bg-red-950/40">
            <Trash2 size={16} aria-hidden="true" />{de ? "Konto löschen" : "Delete account"}
          </button>
        </div>
      </section>

      {open && <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm" onClick={close}>
        <section role="dialog" aria-modal="true" aria-labelledby="delete-account-dialog-title" aria-describedby="delete-account-dialog-copy" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); close(); } }} className="w-full max-w-lg rounded-3xl border border-red-300/70 bg-white p-5 shadow-2xl shadow-black/35 dark:border-red-400/30 dark:bg-slate-900 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200"><AlertTriangle size={21} aria-hidden="true" /></span>
            <div>
              <h2 id="delete-account-dialog-title" className="text-xl font-black tracking-tight text-slate-950 dark:text-white">{de ? "Konto wirklich löschen?" : "Delete your account?"}</h2>
              <p className="mt-1 text-sm font-bold text-red-700 dark:text-red-300">{de ? "Diese Aktion kann nicht rückgängig gemacht werden." : "This action cannot be undone."}</p>
            </div>
          </div>

          <div id="delete-account-dialog-copy" className="mt-4 space-y-3 text-sm leading-5 text-slate-700 dark:text-slate-300">
            <p>{de ? "Dein Profil, eigene Beiträge und Stories, Kommentare, Likes, gespeicherte Inhalte, Follow-Verbindungen, gesendete Nachrichten, lokale Entwürfe sowie verknüpfte Anmeldemethoden und Zugangsdaten werden dauerhaft gelöscht." : "Your profile, posts and stories, comments, likes, saved content, follow connections, sent messages, local drafts, and linked sign-in methods and credentials will be permanently deleted."}</p>
            <p>{de ? "Nachrichten anderer Personen bleiben bestehen. Bereits bekannte oder geteilte direkte Medienlinks können weiterhin erreichbar sein; außerhalb von VIBE gespeicherte Kopien kann VIBE nicht zurückholen." : "Messages sent by other people remain. Previously known or shared direct media links may remain accessible; VIBE cannot retrieve copies stored outside the service."}</p>
          </div>

          <label className="mt-5 block text-sm font-bold text-slate-800 dark:text-slate-100">
            {de ? <>Tippe <span className="font-black">LÖSCHEN</span>, um fortzufahren.</> : <>Type <span className="font-black">DELETE</span> to continue.</>}
            <input autoFocus value={confirmation} onChange={(event) => setConfirmation(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }} data-account-deletion-input="" autoComplete="off" autoCapitalize="characters" spellCheck={false} disabled={pending} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950 dark:text-white" />
          </label>

          {error && <p role="alert" className="mt-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 dark:border-red-400/30 dark:bg-red-950/40 dark:text-red-200">{error}</p>}

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={close} disabled={pending} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">{de ? "Abbrechen" : "Cancel"}</button>
            <button type="button" onClick={() => void handleDelete()} disabled={!isConfirmed || pending} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-45">
              <Trash2 size={15} aria-hidden="true" />{pending ? (de ? "Wird gelöscht…" : "Deleting…") : (de ? "Endgültig löschen" : "Delete permanently")}
            </button>
          </div>
        </section>
      </div>}
    </>
  );
}
