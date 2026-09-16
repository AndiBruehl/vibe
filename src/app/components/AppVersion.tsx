"use client";

import { useEffect, useState } from "react";
import useVibeLanguage from "@/app/components/useVibeLanguage";

const WEB_VERSION = "0.1.69.13.1";
const BETA_FLAIR = " 😈🔥";

export default function AppVersion() {
  const language = useVibeLanguage();
  const [desktopVersion, setDesktopVersion] = useState<string | null>(null);
  const [androidVersion, setAndroidVersion] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDesktopVersion(
        navigator.userAgent.match(/VibeDesktop\/(\d+(?:\.\d+){2,3})/)?.[1] ?? null,
      );
      setAndroidVersion(
        navigator.userAgent.match(/VibeAndroid\/(\d+(?:\.\d+){2,3})/)?.[1] ?? null,
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
      <p>{language === "de" ? "Webversion" : "Web version"} BETA {WEB_VERSION}{BETA_FLAIR}</p>
      {desktopVersion && <p>{language === "de" ? "Desktop-App-Version" : "Desktop app version"} BETA {desktopVersion}{BETA_FLAIR}</p>}
      {androidVersion && <p>{language === "de" ? "Android-App-Version" : "Android app version"} BETA {androidVersion}{BETA_FLAIR}</p>}
    </div>
  );
}
