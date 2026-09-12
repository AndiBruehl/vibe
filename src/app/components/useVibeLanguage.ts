"use client";

import { useEffect, useState } from "react";

export type VibeLanguage = "en" | "de";

export default function useVibeLanguage(initialLanguage: VibeLanguage = "en") {
  const [language, setLanguage] = useState<VibeLanguage>(initialLanguage);

  useEffect(() => {
    const stored = localStorage.getItem("vibe-language");
    setLanguage(stored === "de" ? "de" : initialLanguage);
    const update = (event: Event) => setLanguage((event as CustomEvent<VibeLanguage>).detail === "de" ? "de" : "en");
    window.addEventListener("vibe-language-change", update);
    window.addEventListener("vibe-language-ui-change", update);
    return () => {
      window.removeEventListener("vibe-language-change", update);
      window.removeEventListener("vibe-language-ui-change", update);
    };
  }, [initialLanguage]);

  return language;
}
