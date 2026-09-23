import { ChevronDown, History } from "lucide-react";
import { webReleaseNotes } from "@/release-notes";

export default function HomeChangelog() {
  return <details className="group mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/75 shadow-sm shadow-black/20">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-slate-100 marker:hidden transition hover:bg-slate-800/80 sm:px-5">
      <span className="inline-flex items-center gap-2"><History size={16} className="text-orange-400" /> Changelog</span>
      <ChevronDown size={18} className="text-slate-400 transition-transform duration-200 group-open:rotate-180" />
    </summary>
    <div className="border-t border-slate-700/80 px-4 py-4 sm:px-5">
      <div className="space-y-5">
        {webReleaseNotes.map((release) => <article key={release.version}>
          <h2 className="text-sm font-bold text-white">Web version {release.version} <span className="font-medium text-slate-400">· {release.date}</span></h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-300">
            {release.changes.map((change) => <li key={change}>{change}</li>)}
          </ul>
        </article>)}
      </div>
    </div>
  </details>;
}
