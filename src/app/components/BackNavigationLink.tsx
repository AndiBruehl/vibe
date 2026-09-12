"use client";

import { MoveLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackNavigationLink({ language = "en" }: { language?: "en" | "de" }) {
  const router = useRouter();
  const label = language === "de" ? "Zurück" : "Back";

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/home");
      }}
      className="group flex items-center gap-2 text-slate-900 no-underline hover:text-slate-700 dark:text-white dark:hover:text-slate-300"
    >
      <MoveLeft className="shrink-0" />
      <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}
