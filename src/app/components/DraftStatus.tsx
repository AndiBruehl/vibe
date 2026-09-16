"use client";

import { Check, RotateCcw, Trash2 } from "lucide-react";

type DraftStatusProps = {
  state: "restored" | "saved" | null;
  de: boolean;
  onDiscard?: () => void;
};

export default function DraftStatus({ state, de, onDiscard }: DraftStatusProps) {
  if (!state) return null;

  const restored = state === "restored";

  return (
    <div className="vibe-draft-status flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400" role="status">
      <span className="inline-flex items-center gap-1.5">
        {restored ? <RotateCcw size={13} aria-hidden="true" /> : <Check size={13} aria-hidden="true" />}
        {restored ? (de ? "Entwurf wiederhergestellt" : "Draft restored") : (de ? "Entwurf gespeichert" : "Draft saved")}
      </span>
      {onDiscard && (
        <button
          type="button"
          onClick={onDiscard}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-red-300"
        >
          <Trash2 size={12} aria-hidden="true" />
          {de ? "Verwerfen" : "Discard"}
        </button>
      )}
    </div>
  );
}
