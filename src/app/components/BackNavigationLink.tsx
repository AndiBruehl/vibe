"use client";

import { MoveLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackNavigationLink({ language = "en", fallbackHref = "/home", label }: { language?: "en" | "de"; fallbackHref?: string; label?: string }) {
  const router = useRouter();
  const resolvedLabel = label ?? (language === "de" ? "Zurück" : "Back");

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
      className="group inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-slate-900 no-underline transition hover:bg-slate-100 hover:text-slate-700 active:scale-[0.98] dark:text-white dark:hover:bg-slate-800 dark:hover:text-slate-300"
    >
      <MoveLeft className="shrink-0" />
      <span className="hidden whitespace-nowrap opacity-0 transition-opacity duration-200 sm:inline group-hover:opacity-100">
        {resolvedLabel}
      </span>
    </button>
  );
}
