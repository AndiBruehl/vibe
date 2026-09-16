"use client";

import { CircleHelp, Languages, MonitorSmartphone, Moon, Settings2, Sun } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { startTransition, useEffect, useRef, useState } from "react";
import { applyTheme, type ThemePreference } from "@/app/components/ProfileThemeRuntime";
import { applyVibeLanguage } from "@/app/components/language-events";

type Language = "en" | "de";

export default function QuickSettings({ initialLanguage, initialTheme }: { initialLanguage: Language; initialTheme: ThemePreference }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemePreference>(initialTheme);
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [feedback, setFeedback] = useState<"saved" | "failed" | "working" | null>(null);
  const [feedbackLeaving, setFeedbackLeaving] = useState(false);
  const [browseHeaderVisible, setBrowseHeaderVisible] = useState(true);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTheme(initialTheme);
    setLanguage(initialLanguage);
    const close = (event: MouseEvent | TouchEvent) => {
      if (panel.current && !panel.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [initialLanguage, initialTheme]);

  useEffect(() => {
    if (pathname !== "/browse") {
      setBrowseHeaderVisible(true);
      return;
    }

    const syncHeaderVisibility = () => {
      const header = document.querySelector("[data-vibe-browse-header]");
      if (header) setBrowseHeaderVisible(header.getBoundingClientRect().bottom > 0);
    };

    syncHeaderVisibility();
    window.setTimeout(syncHeaderVisibility, 0);
    window.addEventListener("scroll", syncHeaderVisibility, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", syncHeaderVisibility, true);
  }, [pathname]);

  function showFeedback(next: "saved" | "failed" | "working") {
    setFeedbackLeaving(false);
    setFeedback(next);
  }

  function hideFeedbackAfter(delay: number) {
    window.setTimeout(() => {
      setFeedbackLeaving(true);
      window.setTimeout(() => { setFeedback(null); setFeedbackLeaving(false); }, 180);
    }, delay);
  }

  async function chooseTheme(next: ThemePreference) {
    if (next === theme) return;
    const previous = theme;
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
    try {
      const response = await fetch("/api/profile/theme", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme: next }) });
      if (!response.ok) throw new Error("Theme could not be saved");
      showFeedback("saved");
    } catch {
      setTheme(previous);
      localStorage.setItem("theme", previous);
      applyTheme(previous);
      showFeedback("failed");
    }
    hideFeedbackAfter(2200);
  }

  async function chooseLanguage(next: Language) {
    if (next === language) return;
    const previous = language;
    setLanguage(next);
    applyVibeLanguage(next);
    showFeedback("working");
    let response: Response;
    try {
      response = await fetch("/api/profile/language", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language: next }) });
    } catch {
      response = new Response(null, { status: 503 });
    }
    if (!response.ok) {
      setLanguage(previous);
      applyVibeLanguage(previous);
      showFeedback("failed");
      hideFeedbackAfter(2200);
      return;
    }
    startTransition(() => router.refresh());
    window.setTimeout(() => showFeedback("saved"), 650);
    hideFeedbackAfter(2600);
  }

  const de = language === "de";
  const themeOptions: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
    { value: "light", label: de ? "Hell" : "Light", icon: Sun },
    { value: "dark", label: de ? "Dunkel" : "Dark", icon: Moon },
    { value: "system", label: de ? "System" : "System", icon: MonitorSmartphone },
  ];

  if (
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    pathname === "/profile"
  ) return null;

  // Browse has a right-aligned Profiles action in its header. Put the orb to
  // its left at every width so it cannot cover the action or the sort controls.
  const isConversation = pathname.startsWith("/messages/");
  const position = pathname === "/browse" && browseHeaderVisible
    ? "right-28 top-3.5 md:right-28 md:top-3.5"
    : isConversation
      ? "right-4 top-24 md:right-6 md:top-24"
    : "right-4 top-3.5 md:right-6 md:top-3.5";

  return (
    <div ref={panel} className={`fixed ${position} z-50 transition-[right] duration-300`} style={pathname === "/browse" && browseHeaderVisible ? { right: "7rem" } : undefined} data-vibe-quick-settings>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={de ? "Schnelleinstellungen" : "Quick settings"}
        className="grid size-10 place-items-center rounded-full border border-slate-300/80 bg-white/90 text-slate-600 shadow-lg shadow-slate-900/10 backdrop-blur transition hover:-translate-y-0.5 hover:border-orange-300 hover:text-orange-500 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-200 dark:shadow-black/30 dark:hover:border-orange-400 dark:hover:text-orange-300">
        <Settings2 size={18} aria-hidden="true" />
      </button>

      {open && <section className="vibe-quick-settings-panel absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-slate-300/80 bg-white/95 p-3 shadow-2xl shadow-slate-900/20 backdrop-blur dark:border-slate-600 dark:bg-slate-900/95 dark:shadow-black/40">
        <p className="mb-2 text-xs font-black uppercase tracking-[.14em] text-slate-500 dark:text-slate-400">{de ? "Schnellzugriff" : "Quick settings"}</p>
        <div className="space-y-1.5">
          <p className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200"><Sun size={14} /> {de ? "Darstellung" : "Theme"}</p>
          <div className="grid grid-cols-3 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {themeOptions.map(({ value, label, icon: Icon }) => <button key={value} type="button" onClick={() => void chooseTheme(value)} title={label}
              className={`grid place-items-center rounded-lg px-2 py-1.5 text-xs font-bold transition ${theme === value ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}>
              <Icon size={15} aria-label={label} />
            </button>)}
          </div>
        </div>
        <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 dark:border-slate-700">
          <p className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200"><Languages size={14} /> {de ? "Sprache" : "Language"}</p>
          <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {(["en", "de"] as Language[]).map((option) => <button key={option} type="button" onClick={() => void chooseLanguage(option)} className={`rounded-lg px-2 py-1.5 text-xs font-bold transition ${language === option ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700 dark:text-orange-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}>{option === "en" ? "English" : "Deutsch"}</button>)}
          </div>
        </div>
        {feedback && <p role="status" className={`mt-3 text-center text-xs font-semibold ${feedbackLeaving ? "vibe-quick-settings-feedback-exit" : ""} ${feedback === "failed" ? "text-red-600 dark:text-red-300" : `vibe-quick-settings-feedback vibe-quick-settings-feedback-${feedback} mx-auto flex items-center justify-center shadow-sm`}`}>{feedback === "saved" ? (de ? "Gespeichert" : "Saved") : feedback === "working" ? (de ? "WIRD UMGESTELLT" : "WORKING") : (de ? "Speichern fehlgeschlagen" : "Could not save")}</p>}
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
          <Link href="/support" className="inline-flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-bold text-cyan-700 transition hover:bg-cyan-50 dark:text-cyan-300 dark:hover:bg-cyan-500/10"><CircleHelp size={14} />{de ? "Hilfe" : "Help"}</Link>
          <Link href="/settings" className="inline-flex items-center justify-center rounded-lg px-2 py-2 text-xs font-bold text-orange-600 transition hover:bg-orange-50 dark:text-orange-300 dark:hover:bg-orange-500/10">{de ? "Einstellungen" : "Settings"}</Link>
        </div>
      </section>}
    </div>
  );
}
