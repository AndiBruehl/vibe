"use client";

import { ExternalLink, Eye, X } from "lucide-react";
import { useState } from "react";

export default function ReportContentPreview({ href, de }: { href: string | null; de: boolean }) {
  const [open, setOpen] = useState(false);
  const previewHref = href ? (href.includes("#") ? href.replace("#", "?adminPreview=1#") : `${href}${href.includes("?") ? "&" : "?"}adminPreview=1`) : null;
  if (!href || !previewHref) return <p className="text-sm font-semibold text-slate-500">{de ? "Der gemeldete Inhalt ist nicht mehr verfügbar." : "The reported content is no longer available."}</p>;

  return <>
    <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-bold text-orange-600 hover:underline dark:text-orange-300"><Eye size={16}/>{de ? "Vorschau öffnen" : "Open preview"}</button>
    {open && <div className="fixed inset-0 z-[110] flex flex-col bg-slate-950/70 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={de ? "Gemeldeten Inhalt prüfen" : "Review reported content"}>
      <section className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-white shadow-2xl dark:bg-slate-950">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <div><h2 className="font-black text-slate-900 dark:text-white">{de ? "Gemeldeten Inhalt prüfen" : "Review reported content"}</h2><p className="text-xs text-slate-500">{de ? "Die Vorschau öffnet sich ohne die Admin Area zu verlassen." : "The preview opens without leaving the admin area."}</p></div>
          <div className="flex items-center gap-2"><a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-600 dark:text-slate-200"><ExternalLink size={14}/>{de ? "Vollständig öffnen" : "Open full page"}</a><button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={de ? "Schließen" : "Close"}><X size={19}/></button></div>
        </header>
        <iframe src={previewHref} title={de ? "Gemeldeter Inhalt" : "Reported content"} onLoad={(event) => event.currentTarget.contentDocument?.body.classList.add("vibe-admin-preview")} className="min-h-0 w-full flex-1 border-0 bg-white" />
      </section>
    </div>}
  </>;
}
