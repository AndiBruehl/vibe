"use client";

import { useEffect, useState, type FormEvent } from "react";

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

  useEffect(() => {
    setBody(localStorage.getItem(draftKey) ?? "");
    setReady(true);
  }, [draftKey]);

  useEffect(() => {
    if (!ready) return;
    const timeout = window.setTimeout(() => {
      if (body.trim()) localStorage.setItem(draftKey, body);
      else localStorage.removeItem(draftKey);
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [body, draftKey, ready]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await action(new FormData(event.currentTarget));
    setBody("");
    localStorage.removeItem(draftKey);
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
        {ready && body.trim() && <p className="text-xs text-slate-500 dark:text-slate-400">{de ? "Entwurf wird automatisch gespeichert" : "Draft saves automatically"}</p>}
        <button className="ml-auto rounded-xl bg-linear-to-r from-(--ig-orange) to-(--ig-red) px-4 py-2.5 text-sm font-bold text-white">
          {de ? "An Support@Vibe senden" : "Send to Support@Vibe"}
        </button>
      </div>
    </form>
  );
}
