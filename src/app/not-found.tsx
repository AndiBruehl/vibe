import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-[70vh] w-full max-w-xl place-items-center p-4 text-center">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/25">
        <p className="text-xs font-black tracking-[0.2em] text-orange-500">VIBE · 404</p>
        <h1 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">Diese Seite gibt es nicht</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-slate-600 dark:text-slate-300">Der Link ist möglicherweise nicht mehr gültig oder die Seite wurde verschoben.</p>
        <Link href="/home" className="mt-6 inline-flex rounded-xl bg-linear-to-r from-(--ig-orange) to-(--ig-red) px-4 py-2.5 text-sm font-bold text-white no-underline shadow-sm transition hover:brightness-110">Zur Startseite</Link>
      </section>
    </main>
  );
}
