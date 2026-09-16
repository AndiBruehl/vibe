"use client";

import { ChevronDown, ChevronUp, Link as LinkIcon } from "lucide-react";
import { useState } from "react";

type ProfileLink = { id: string; label: string; url: string };

export default function ProfileLinks({ links, language = "en", centered = false, accent }: { links: ProfileLink[]; language?: "en" | "de"; centered?: boolean | "mobile"; accent?: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const de = language === "de";
  const label = de ? `${links.length} Link${links.length === 1 ? "" : "s"}` : `${links.length} link${links.length === 1 ? "" : "s"}`;

  return (
    <div className={`mt-3 ${centered === true ? "flex flex-col items-center" : centered === "mobile" ? "flex flex-col items-center lg:block" : ""}`}>
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition dark:border-slate-600 dark:text-slate-200"
        style={accent ? { borderColor: accent, color: accent } : undefined}
      >
        <LinkIcon size={15} />
        {label}
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {expanded && (
        <div className={`mt-2 flex flex-wrap gap-2 ${centered === true ? "justify-center" : centered === "mobile" ? "justify-center lg:justify-start" : ""}`}>
          {links.map((link) => (
            <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="rounded-lg border px-3 py-1.5 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-white/10" style={accent ? { borderColor: accent, color: accent } : undefined}>
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
