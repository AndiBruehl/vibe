"use client";

import { MoveLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import useVibeLanguage, { type VibeLanguage } from "@/app/components/useVibeLanguage";

export default function BackNavigationLink({ language, fallbackHref = "/home", label }: { language?: VibeLanguage; fallbackHref?: string; label?: string }) {
  const router = useRouter();
  const activeLanguage = useVibeLanguage(language);
  const resolvedLabel = label ?? (activeLanguage === "de" ? "Zurück" : "Back");

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
      className="group inline-flex min-h-11 items-center gap-2 px-0 text-slate-900 no-underline transition-colors hover:text-slate-700 active:scale-[0.98] dark:text-white dark:hover:text-slate-300"
    >
      <MoveLeft className="shrink-0" />
      <span className="hidden whitespace-nowrap opacity-0 transition-opacity duration-200 sm:inline group-hover:opacity-100">
        {resolvedLabel}
      </span>
    </button>
  );
}
