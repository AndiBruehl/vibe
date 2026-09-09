"use client";

import { Download, MonitorDown, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

type Release = {
  version: string;
  downloadUrl: string;
};

type Releases = {
  windows: Release | null;
  android: Release | null;
};

export default function ReleaseDownloads() {
  const [releases, setReleases] = useState<Releases | null>(null);

  useEffect(() => {
    void fetch("/api/releases/latest", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Releases | null) => setReleases(data));
  }, []);

  const downloadOptions = [
    {
      label: "Windows",
      detail: "Setup EXE",
      icon: MonitorDown,
      release: releases?.windows,
    },
    {
      label: "Android",
      detail: "APK",
      icon: Smartphone,
      release: releases?.android,
    },
  ];

  return (
    <section className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-700/80">
      <div className="mb-3 flex items-center gap-2">
        <Download className="size-4 text-orange-500" />
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Get the app
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Latest uploaded desktop and mobile builds.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {downloadOptions.map(({ label, detail, icon: Icon, release }) => (
          <a
            key={label}
            href={release?.downloadUrl ?? undefined}
            download={Boolean(release)}
            aria-disabled={!release}
            className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition ${
              release
                ? "border-slate-200 bg-slate-50 hover:border-orange-300 hover:bg-orange-50 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-orange-400/60 dark:hover:bg-orange-500/10"
                : "pointer-events-none border-slate-200 bg-slate-50/60 opacity-60 dark:border-slate-700 dark:bg-slate-800/40"
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                <Icon className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                  {label}
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {release ? `Version ${release.version}` : "Checking for a release…"}
                </span>
              </span>
            </span>
            <span className="text-xs font-semibold text-orange-600 dark:text-orange-300">
              {release ? `Download ${detail}` : "…"}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
