"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import useVibeLanguage from "@/app/components/useVibeLanguage";

type PendingDelete = { form?: HTMLFormElement; submitter?: HTMLElement | null; onConfirm?: () => void; onCancel?: () => void };

export default function DeleteConfirmationGuard() {
  const de = useVibeLanguage() === "de";
  const [pending, setPending] = useState<PendingDelete | null>(null);
  const approvedForm = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    const onSubmit = (event: SubmitEvent) => {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      const submitter = event.submitter instanceof HTMLElement ? event.submitter : null;
      if (!form || !submitter) return;
      if (approvedForm.current === form) { approvedForm.current = null; return; }
      const label = [submitter.textContent, submitter.getAttribute("aria-label"), submitter.getAttribute("title")].filter(Boolean).join(" ").toLocaleLowerCase();
      if (!/(delete|löschen)/i.test(label)) return;
      event.preventDefault();
      setPending({ form, submitter });
    };
    const onDeleteRequest = (event: Event) => {
      const detail = (event as CustomEvent<(() => void) | { onConfirm: () => void; onCancel?: () => void }>).detail;
      setPending(typeof detail === "function" ? { onConfirm: detail } : detail);
    };
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("vibe:delete-confirm", onDeleteRequest);
    return () => { document.removeEventListener("submit", onSubmit, true); window.removeEventListener("vibe:delete-confirm", onDeleteRequest); };
  }, []);

  if (!pending) return null;
  const confirm = () => {
    const current = pending;
    setPending(null);
    if (current.onConfirm) { current.onConfirm(); return; }
    if (current.form) { approvedForm.current = current.form; current.form.requestSubmit(current.submitter instanceof HTMLButtonElement || current.submitter instanceof HTMLInputElement ? current.submitter : undefined); }
  };
  const cancel = () => { pending.onCancel?.(); setPending(null); };
  return <div className="fixed inset-0 z-[200] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm" role="presentation">
    <section role="alertdialog" aria-modal="true" aria-labelledby="delete-confirmation-title" className="w-full max-w-md rounded-3xl border border-red-400/35 bg-white p-5 text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-white">
      <div className="flex items-start justify-between gap-4"><span className="grid size-11 place-items-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300"><AlertTriangle size={22}/></span><button type="button" onClick={cancel} className="grid size-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label={de ? "Abbrechen" : "Cancel"}><X size={19}/></button></div>
      <h2 id="delete-confirmation-title" className="mt-4 text-lg font-black">{de ? "Wirklich löschen?" : "Delete this item?"}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{de ? "Diese Aktion kann nicht rückgängig gemacht werden. Möchtest du fortfahren?" : "This action cannot be undone. Do you want to continue?"}</p>
      <div className="mt-6 flex flex-wrap justify-end gap-2"><button type="button" onClick={cancel} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold transition hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800">{de ? "Abbrechen" : "Cancel"}</button><button type="button" onClick={confirm} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700">{de ? "Löschen" : "Delete"}</button></div>
    </section>
  </div>;
}
