"use client";

import { useEffect, useState } from "react";

const WEB_VERSION = "0.1.42.1";

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
      <p>Web version {WEB_VERSION}</p>
      {desktopVersion && <p>Desktop app version {desktopVersion}</p>}
      {androidVersion && <p>Android app version {androidVersion}</p>}
    </div>
  );
}
