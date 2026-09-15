"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";

/**
 * React owns the page DOM. Mutating text nodes from a MutationObserver breaks
 * React's event bindings, so language state is kept separate from page markup.
 */
export default function LanguageRuntime({ initialLanguage }: { initialLanguage: "en" | "de" }) {
  const router = useRouter();
  useEffect(() => {
    const saved = localStorage.getItem("vibe-language");
    if (!saved) localStorage.setItem("vibe-language", initialLanguage);
    document.documentElement.lang = saved === "de" || (!saved && initialLanguage === "de") ? "de" : "en";

    // Refresh the server-rendered copy without discarding navigation state,
    // scroll position, open menus, or the native WebView session.
    const onChange = () => startTransition(() => router.refresh());
    window.addEventListener("vibe-language-change", onChange);
    return () => window.removeEventListener("vibe-language-change", onChange);
  }, [initialLanguage, router]);

  return null;
}
