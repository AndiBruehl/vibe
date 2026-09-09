"use client";

import { useEffect, useState } from "react";

const WEB_VERSION = "0.1.17";

export default function AppVersion() {
  const [desktopVersion, setDesktopVersion] = useState<string | null>(null);

  useEffect(() => {
    const match = navigator.userAgent.match(/VibeDesktop\/(\d+\.\d+\.\d+)/);
    setDesktopVersion(match?.[1] ?? null);
  }, []);

  return (
    <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
      <p>Web version {WEB_VERSION}</p>
      {desktopVersion && <p>Desktop app version {desktopVersion}</p>}
    </div>
  );
}
