"use client";

import useVibeLanguage from "@/app/components/useVibeLanguage";

export default function SettingsHeading({ initialLanguage }: { initialLanguage: "en" | "de" }) {
  const language = useVibeLanguage(initialLanguage);
  const de = language === "de";
  return <header className="border-b border-slate-200 bg-linear-to-r from-orange-50 via-white to-pink-50 px-5 py-4 dark:border-slate-700/80 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 sm:px-6">
    <p className="text-sm font-semibold text-orange-600 dark:text-orange-300">{de ? "Konto" : "Account"}</p>
    <h1 className="mt-0.5 text-xl font-bold text-slate-950 dark:text-white">{de ? "Profileinstellungen" : "Profile Settings"}</h1>
    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{de ? "Verwalte, wie dein Profil auf VIBE erscheint." : "Manage how your profile appears across VIBE."}</p>
  </header>;
}
