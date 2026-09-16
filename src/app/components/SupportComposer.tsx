"use client";

import { useEffect, useState, type FormEvent } from "react";
import DraftStatus from "./DraftStatus";

type SupportComposerProps = {
  action: (formData: FormData) => void | Promise<void>;
  ticketId?: string;
  de: boolean;
  continuing: boolean;
};

export default function SupportComposer({ action, ticketId, de, continuing }: SupportComposerProps) {
  const draftKey = `vibe.supportDraft.${ticketId ?? "new"}`;
  const [body, setBody] = useState("");
  const [ready, setReady] = useState(false);
  const [draftStatus, setDraftStatus] = useState<"restored" | "saved" | null>(null);

  useEffect(() => {
    const draft = localStorage.getItem(draftKey) ?? "";
    setBody(draft);
    setDraftStatus(draft ? "restored" : null);
    setReady(true);
  }, [draftKey]);

  useEffect(() => {
    if (!ready) return;
    const timeout = window.setTimeout(() => {
      if (body.trim()) {
        localStorage.setItem(draftKey, body);
        setDraftStatus("saved");
      } else {
        localStorage.removeItem(draftKey);
        setDraftStatus(null);
      }
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [body, draftKey, ready]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await action(new FormData(event.currentTarget));
    setBody("");
    localStorage.removeItem(draftKey);
    setDraftStatus(null);
  }

  return (
    <form onSubmit={submit} className="mt-5">
      <label className="text-sm font-bold text-slate-900 dark:text-white" htmlFor="support-body">
        {continuing ? (de ? "Weitere Nachricht" : "Additional message") : (de ? "Wobei können wir helfen?" : "How can we help?")}
      </label>
      <textarea
        id="support-body"
        name="body"
        required
        maxLength={2000}
        rows={4}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white p-4 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
        placeholder={de ? "Beschreibe dein Anliegen so genau wie möglich…" : "Describe your issue in as much detail as possible…"}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {ready && body.trim() && <DraftStatus state={draftStatus} de={de} onDiscard={() => { setBody(""); localStorage.removeItem(draftKey); setDraftStatus(null); }} />}
        <button className="ml-auto rounded-xl bg-linear-to-r from-(--ig-orange) to-(--ig-red) px-4 py-2.5 text-sm font-bold text-white">
          {de ? "An Support@Vibe senden" : "Send to Support@Vibe"}
        </button>
      </div>
    </form>
  );
}
