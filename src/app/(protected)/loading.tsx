function Bar({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 ${className}`} />;
}

export default function ProtectedLoading() {
  return (
    <section aria-busy="true" aria-label="Loading content" className="mx-auto w-full max-w-5xl space-y-6 pb-24 md:pb-8">
      <div className="flex items-center justify-between"><Bar className="h-10 w-28" /><Bar className="h-10 w-36" /></div>
      {[0, 1].map((index) => (
        <article key={index} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-3 border-b border-slate-200 p-5 dark:border-white/10"><Bar className="size-11 rounded-full" /><div className="space-y-2"><Bar className="h-4 w-32" /><Bar className="h-3 w-20" /></div></div>
          <div className="xl:grid xl:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]"><Bar className="aspect-[4/3] w-full rounded-none" /><div className="space-y-4 p-5"><Bar className="h-4 w-full" /><Bar className="h-4 w-5/6" /><Bar className="h-4 w-2/3" /><div className="pt-4"><Bar className="h-11 w-full" /></div></div></div>
        </article>
      ))}
      <span className="sr-only">Loading</span>
    </section>
  );
}
