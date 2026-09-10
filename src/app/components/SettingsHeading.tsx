"use client";

import { useEffect, useState } from "react";

export default function SettingsHeading({ initialLanguage }: { initialLanguage: "en" | "de" }) {
  const [language, setLanguage] = useState(initialLanguage);
  useEffect(() => {
    const apply = () => setLanguage(localStorage.getItem("vibe-language") === "de" ? "de" : "en");
    apply();
    const onChange = (event: Event) => setLanguage((event as CustomEvent<"en" | "de">).detail);
    window.addEventListener("vibe-language-ui-change", onChange);
    return () => window.removeEventListener("vibe-language-ui-change", onChange);
  }, []);
  const de = language === "de";
  return <header className="border-b border-slate-200 bg-linear-to-r from-orange-50 via-white to-pink-50 px-6 py-5 dark:border-slate-700/80 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 sm:px-8">
    <p className="text-sm font-semibold text-orange-600 dark:text-orange-300">{de ? "Konto" : "Account"}</p>
    <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{de ? "Profileinstellungen" : "Profile Settings"}</h1>
    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{de ? "Verwalte, wie dein Profil auf VIBE erscheint." : "Manage how your profile appears across VIBE."}</p>
  </header>;
}
