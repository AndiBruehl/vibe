"use client";

import { useEffect, useState } from "react";

const WEB_VERSION = "0.1.60";

export default function AppVersion() {
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
      <p>Web version BETA {WEB_VERSION}</p>
      {desktopVersion && <p>Desktop app version BETA {desktopVersion}</p>}
      {androidVersion && <p>Android app version BETA {androidVersion}</p>}
    </div>
  );
}
