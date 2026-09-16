export default function ProtectedLoading() {
  return (
    <section aria-busy="true" aria-label="Loading content" className="mx-auto grid min-h-[58vh] w-full max-w-2xl place-items-center pb-24 md:pb-8">
      <div className="vibe-loading-screen w-full rounded-3xl border border-white/10 px-7 py-10 text-center shadow-2xl sm:px-12">
        <div aria-hidden="true" className="vibe-loader-orbit mx-auto grid size-24 place-items-center rounded-full">
          <span className="vibe-loader-core size-14 rounded-full" />
        </div>
        <p className="mt-6 text-xs font-black tracking-[0.24em] text-orange-400">VIBE</p>
        <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">Loading your next moment…</p>
        <div className="mx-auto mt-6 h-1.5 w-40 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10"><span className="vibe-loading-line block h-full rounded-full" /></div>
      </div>
      <span className="sr-only">Loading</span>
    </section>
  );
}
