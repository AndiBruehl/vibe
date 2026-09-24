"use client";

import { useEffect, useState } from "react";

export type VibeLanguage = "en" | "de";

export default function useVibeLanguage(initialLanguage: VibeLanguage = "en") {
  const [language, setLanguage] = useState<VibeLanguage>(initialLanguage);

  useEffect(() => {
    const stored = localStorage.getItem("vibe-language");
    const apply = (next: VibeLanguage) => { setLanguage(next); document.documentElement.lang = next; };
    apply(stored === "de" ? "de" : initialLanguage);
    const update = (event: Event) => apply((event as CustomEvent<VibeLanguage>).detail === "de" ? "de" : "en");
    window.addEventListener("vibe-language-change", update);
    return () => {
      window.removeEventListener("vibe-language-change", update);
    };
  }, [initialLanguage]);

  return language;
}
