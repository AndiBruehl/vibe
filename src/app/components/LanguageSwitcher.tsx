"use client";

import { Languages } from "lucide-react";
import { useEffect, useState } from "react";

type Language = "en" | "de";

const labels: Record<Language, string> = { en: "English", de: "Deutsch" };

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    setLanguage((localStorage.getItem("vibe-language") as Language) === "de" ? "de" : "en");
    const onChange = (event: Event) => setLanguage((event as CustomEvent<Language>).detail);
    window.addEventListener("vibe-language-change", onChange);
    return () => window.removeEventListener("vibe-language-change", onChange);
  }, []);

  function select(next: Language) {
    localStorage.setItem("vibe-language", next);
    document.documentElement.lang = next;
    window.dispatchEvent(new CustomEvent("vibe-language-change", { detail: next }));
  }

  return (
    <div className={`flex items-center gap-1 rounded-xl border border-slate-300/80 bg-white p-1 shadow-sm dark:border-slate-600 dark:bg-slate-800 ${compact ? "w-full justify-center" : ""}`}>
      <Languages className="ml-1 size-4 text-slate-500 dark:text-slate-300" aria-hidden="true" />
      {(["en", "de"] as Language[]).map((option) => (
        <button key={option} type="button" onClick={() => select(option)} aria-label={`Switch language to ${labels[option]}`}
          className={`rounded-lg px-2 py-1 text-sm font-bold transition ${language === option ? "bg-linear-to-r from-(--ig-orange) to-(--ig-red) text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"}`}>
          <span aria-hidden="true" className={`inline-block h-3 w-5 rounded-sm shadow-sm ${option === "de" ? "vibe-flag-de" : "vibe-flag-en"}`} />
          <span className="ml-1">{option.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}
