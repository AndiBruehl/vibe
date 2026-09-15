"use client";

import { useEffect } from "react";

/**
 * React owns the page DOM. Client components subscribe to the shared language
 * event instead of refreshing the full route on every language choice.
 */
export default function LanguageRuntime({ initialLanguage }: { initialLanguage: "en" | "de" }) {
  useEffect(() => {
    const saved = localStorage.getItem("vibe-language");
    if (!saved) localStorage.setItem("vibe-language", initialLanguage);
    document.documentElement.lang = saved === "de" || (!saved && initialLanguage === "de") ? "de" : "en";

  }, [initialLanguage]);

  return null;
}
