"use client";

import { useEffect } from "react";

/**
 * React owns the page DOM. Mutating text nodes from a MutationObserver breaks
 * React's event bindings, so language state is kept separate from page markup.
 */
export default function LanguageRuntime({ initialLanguage }: { initialLanguage: "en" | "de" }) {
  useEffect(() => {
    const saved = localStorage.getItem("vibe-language");
    if (!saved) localStorage.setItem("vibe-language", initialLanguage);
    document.documentElement.lang = saved === "de" || (!saved && initialLanguage === "de") ? "de" : "en";

    const onChange = () => window.location.reload();
    window.addEventListener("vibe-language-change", onChange);
    return () => window.removeEventListener("vibe-language-change", onChange);
  }, [initialLanguage]);

  return null;
}
