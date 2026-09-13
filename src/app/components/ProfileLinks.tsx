"use client";

import { ChevronDown, ChevronUp, Link as LinkIcon } from "lucide-react";
import { useState } from "react";

type ProfileLink = { id: string; label: string; url: string };

export default function ProfileLinks({ links, language = "en", centered = false }: { links: ProfileLink[]; language?: "en" | "de"; centered?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const de = language === "de";
  const label = de ? `${links.length} Link${links.length === 1 ? "" : "s"}` : `${links.length} link${links.length === 1 ? "" : "s"}`;

  return (
    <div className={`mt-3 ${centered ? "flex flex-col items-center" : ""}`}>
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-slate-600 dark:text-slate-200 dark:hover:border-orange-400 dark:hover:text-orange-300"
      >
        <LinkIcon size={15} />
        {label}
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {expanded && (
        <div className={`mt-2 flex flex-wrap gap-2 ${centered ? "justify-center" : ""}`}>
          {links.map((link) => (
            <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="rounded-lg border border-orange-300 px-3 py-1.5 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 dark:border-orange-400/60 dark:text-orange-300 dark:hover:bg-orange-400/10">
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
