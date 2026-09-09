"use client";

import { Languages } from "lucide-react";
import { useEffect, useState } from "react";

type Language = "en" | "de";

const labels: Record<Language, string> = { en: "English", de: "Deutsch" };

export default function LanguageSwitcher() {
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
    <div className="fixed right-4 top-4 z-50 flex items-center gap-1 rounded-xl border border-slate-300/80 bg-white/90 p-1 shadow-lg backdrop-blur dark:border-slate-600 dark:bg-slate-800/90">
      <Languages className="ml-1 size-4 text-slate-500 dark:text-slate-300" aria-hidden="true" />
      {(["en", "de"] as Language[]).map((option) => (
        <button key={option} type="button" onClick={() => select(option)} aria-label={`Switch language to ${labels[option]}`}
          className={`rounded-lg px-2 py-1 text-sm font-bold transition ${language === option ? "bg-linear-to-r from-(--ig-orange) to-(--ig-red) text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"}`}>
          <span aria-hidden="true">{option === "de" ? "🇩🇪" : "🇬🇧"}</span><span className="ml-1 hidden sm:inline">{option.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}
