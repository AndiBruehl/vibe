import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Sparkles } from "lucide-react";
import GameArtwork, { type VibeGame } from "@/app/components/games/GameArtwork";
import LocalizedText from "@/app/components/LocalizedText";

const gameNames: Record<VibeGame, string> = {
  reflex: "VIBE Reflex",
  trail: "VIBE Trail",
  stack: "VIBE Stack",
};

export default function GameDetailShell({
  game,
  available,
  description,
  children,
}: {
  game: VibeGame;
  available: boolean;
  description: { en: string; de: string };
  children: ReactNode;
}) {
  return (
    <main data-vibe-protected-main className="mx-auto w-full max-w-5xl pb-28 pt-3 md:pb-10">
      <Link href="/games" className="group inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-slate-600 transition hover:bg-white/60 hover:text-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-violet-200">
        <ArrowLeft size={17} aria-hidden="true" />
        <LocalizedText en="Back to games" de="Zurück zu den Spielen" />
      </Link>

      <section className="mt-4 grid gap-5 overflow-hidden rounded-[2rem] border border-violet-200/70 bg-white/80 p-4 shadow-xl shadow-violet-950/5 dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/20 sm:p-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-8 lg:p-8">
        <div className="order-2 min-w-0 px-1 pb-2 lg:order-1 lg:px-2">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] ${available ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200" : "bg-violet-100 text-violet-800 dark:bg-violet-400/10 dark:text-violet-200"}`}>
            <Sparkles size={13} aria-hidden="true" />
            <LocalizedText en={available ? "Ready to play" : "Coming soon"} de={available ? "Jetzt spielbar" : "Kommt bald"} />
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">{gameNames[game]}</h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300"><LocalizedText en={description.en} de={description.de} /></p>
        </div>
        <div className="order-1 min-w-0 lg:order-2">
          <GameArtwork game={game} />
        </div>
      </section>

      {children}

      {!available && (
        <Link href="/games/reflex" className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-linear-to-r from-violet-600 to-fuchsia-600 px-5 text-sm font-black text-white shadow-lg shadow-violet-900/15 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500">
          <LocalizedText en="Play VIBE Reflex in the meantime" de="Bis dahin VIBE Reflex spielen" />
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      )}
    </main>
  );
}
