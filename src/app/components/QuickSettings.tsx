"use client";

import { Languages, Moon, Settings2, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Language = "en" | "de";
type VibeTheme = "light" | "dark";

export default function QuickSettings({ initialLanguage }: { initialLanguage: Language }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<VibeTheme>("dark");
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTheme(localStorage.getItem("theme") === "light" ? "light" : "dark");
    setLanguage(localStorage.getItem("vibe-language") === "de" ? "de" : initialLanguage);
    const close = (event: MouseEvent | TouchEvent) => {
      if (panel.current && !panel.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [initialLanguage]);

  function chooseTheme(next: VibeTheme) {
    setTheme(next);
    localStorage.setItem("theme", next);
    const html = document.documentElement;
    html.classList.remove("light", "dark");
    html.classList.add(next);
    html.dataset.theme = next;
  }

  async function chooseLanguage(next: Language) {
    if (next === language) return;
    setLanguage(next);
    localStorage.setItem("vibe-language", next);
    document.documentElement.lang = next;
    await fetch("/api/profile/language", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: next }),
    });
    window.dispatchEvent(new CustomEvent("vibe-language-change", { detail: next }));
  }

  const de = language === "de";
  return (
    <div ref={panel} className="fixed right-4 top-4 z-50 md:right-6 md:top-5" data-vibe-quick-settings>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={de ? "Schnelleinstellungen" : "Quick settings"}
        className="grid size-10 place-items-center rounded-full border border-slate-300/80 bg-white/90 text-slate-600 shadow-lg shadow-slate-900/10 backdrop-blur transition hover:-translate-y-0.5 hover:border-orange-300 hover:text-orange-500 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-200 dark:shadow-black/30 dark:hover:border-orange-400 dark:hover:text-orange-300"
      >
        <Settings2 size={18} aria-hidden="true" />
      </button>

      {open && (
        <section className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-300/80 bg-white/95 p-3 shadow-2xl shadow-slate-900/20 backdrop-blur dark:border-slate-600 dark:bg-slate-900/95 dark:shadow-black/40">
          <p className="mb-2 text-xs font-black uppercase tracking-[.14em] text-slate-500 dark:text-slate-400">{de ? "Schnellzugriff" : "Quick settings"}</p>
          <div className="space-y-1.5">
            <p className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200"><Sun size={14} /> {de ? "Darstellung" : "Theme"}</p>
            <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {(["light", "dark"] as VibeTheme[]).map((option) => (
                <button key={option} type="button" onClick={() => chooseTheme(option)} className={`rounded-lg px-2 py-1.5 text-xs font-bold transition ${theme === option ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}>
                  {option === "light" ? <span className="inline-flex items-center gap-1"><Sun size={13} />{de ? "Hell" : "Light"}</span> : <span className="inline-flex items-center gap-1"><Moon size={13} />{de ? "Dunkel" : "Dark"}</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 dark:border-slate-700">
            <p className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200"><Languages size={14} /> {de ? "Sprache" : "Language"}</p>
            <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {(["en", "de"] as Language[]).map((option) => (
                <button key={option} type="button" onClick={() => chooseLanguage(option)} className={`rounded-lg px-2 py-1.5 text-xs font-bold transition ${language === option ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}>
                  {option === "en" ? "English" : "Deutsch"}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}