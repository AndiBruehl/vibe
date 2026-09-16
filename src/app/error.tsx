"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled page error", error);
  }, [error]);

  return (
    <main className="mx-auto grid min-h-[70vh] w-full max-w-xl place-items-center p-4 text-center">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/25">
        <p className="text-xs font-black tracking-[0.2em] text-orange-500">VIBE</p>
        <h1 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">Etwas ist schiefgelaufen</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-slate-600 dark:text-slate-300">Die Seite konnte gerade nicht geladen werden. Du kannst es erneut versuchen oder zur Startseite zurückkehren.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="rounded-xl bg-linear-to-r from-(--ig-orange) to-(--ig-red) px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-110">Erneut versuchen</button>
          <Link href="/home" className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 no-underline transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Zur Startseite</Link>
        </div>
      </section>
    </main>
  );
}
