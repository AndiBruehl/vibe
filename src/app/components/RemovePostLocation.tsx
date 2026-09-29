"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RemovePostLocation({ postId, de }: { postId: string; de: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const remove = async () => {
    setBusy(true); setError(false);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`/api/posts/${postId}/location`, { method: "DELETE", signal: controller.signal });
      if (!response.ok) throw Error("failed");
      router.replace(`/posts/${postId}`); router.refresh();
    } catch { setError(true); }
    finally { clearTimeout(timer); setBusy(false); }
  };
  return <div className="space-y-2 text-sm">
    {confirming ? <div className="rounded-xl border border-red-400/50 p-3"><p>{de ? "Standort dieses Beitrags vollständig entfernen?" : "Remove this post’s location completely?"}</p><div className="mt-2 flex gap-3"><button type="button" disabled={busy} onClick={() => void remove()} className="min-h-11 rounded-xl bg-red-600 px-4 font-bold text-white">{busy ? (de ? "Wird entfernt…" : "Removing…") : "OK"}</button><button type="button" disabled={busy} onClick={() => setConfirming(false)} className="min-h-11 rounded-xl border px-4">{de ? "Abbrechen" : "Cancel"}</button></div></div> : <button type="button" onClick={() => setConfirming(true)} className="min-h-11 rounded-xl border border-red-400 px-3 font-bold text-red-700 dark:text-red-300">{de ? "Standort entfernen" : "Remove location"}</button>}
    {error && <p role="alert" className="text-red-700 dark:text-red-300">{de ? "Entfernen konnte nicht bestätigt werden. Bitte erneut versuchen." : "Could not confirm removal. Please try again."}</p>}
  </div>;
}
