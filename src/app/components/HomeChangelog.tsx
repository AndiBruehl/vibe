"use client";

import { ChevronDown, History } from "lucide-react";
import { useState } from "react";
import { webReleaseNotes } from "@/release-notes";

export default function HomeChangelog() {
  const [isOpen, setIsOpen] = useState(false);
  return <section className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/75 shadow-sm shadow-black/20">
    <button type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-bold text-slate-100 transition-colors hover:bg-slate-800/80 sm:px-5">
      <span className="inline-flex items-center gap-2"><History size={16} className="text-orange-400" /> Changelog</span>
      <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
    </button>
    <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
      <div className="overflow-hidden">
        <div className={`border-t border-slate-700/80 px-4 py-4 transition-opacity duration-200 sm:px-5 ${isOpen ? "opacity-100 delay-100" : "opacity-0"}`}>
          <div className="space-y-5">
        {webReleaseNotes.map((release) => <article key={release.version}>
          <h2 className="text-sm font-bold text-white">Web version {release.version} <span className="font-medium text-slate-400">· {release.date}</span></h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-300">
            {release.changes.map((change) => <li key={change}>{change}</li>)}
          </ul>
        </article>)}
          </div>
        </div>
      </div>
    </div>
  </section>;
}
