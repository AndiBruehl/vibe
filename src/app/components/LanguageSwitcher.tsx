"use client";

import { useEffect, useState } from "react";

type Language = "en" | "de";

const labels: Record<Language, string> = { en: "English", de: "Deutsch" };

function Flag({ language }: { language: Language }) {
  if (language === "de") return <svg viewBox="0 0 30 20" className="h-4 w-6 overflow-hidden rounded-sm shadow-sm" aria-hidden="true"><rect width="30" height="7" fill="#111827" /><rect y="7" width="30" height="7" fill="#dd1f26" /><rect y="14" width="30" height="6" fill="#f6c945" /></svg>;
  return <svg viewBox="0 0 30 20" className="h-4 w-6 overflow-hidden rounded-sm shadow-sm" aria-hidden="true"><rect width="30" height="20" fill="#174a9b" /><path d="M0 0 30 20M30 0 0 20" stroke="#fff" strokeWidth="5" /><path d="M0 0 30 20M30 0 0 20" stroke="#c8102e" strokeWidth="2" /><path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="6" /><path d="M15 0v20M0 10h30" stroke="#c8102e" strokeWidth="3" /></svg>;
}

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
    void fetch("/api/profile/language", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language: next }) });
    document.documentElement.lang = next;
    window.dispatchEvent(new CustomEvent("vibe-language-change", { detail: next }));
  }

  return (
      <div className="flex items-center gap-1 rounded-xl border border-slate-300/80 bg-white p-1 shadow-sm dark:border-slate-600 dark:bg-slate-800">
      {(["en", "de"] as Language[]).map((option) => (
        <button key={option} type="button" onClick={() => select(option)} aria-label={`Switch language to ${labels[option]}`}
          className={`flex min-w-28 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition ${language === option ? "bg-linear-to-r from-(--ig-orange) to-(--ig-red) text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"}`}>
          <Flag language={option} /><span>{labels[option]}</span>
        </button>
      ))}
      </div>
  );
}
