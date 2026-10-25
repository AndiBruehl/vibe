import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock3, Gamepad2, Sparkles, Zap } from "lucide-react";
import BackNavigationLink from "@/app/components/BackNavigationLink";
import GameArtwork, { type VibeGame } from "@/app/components/games/GameArtwork";
import LocalizedText from "@/app/components/LocalizedText";
import SecretFoundMap from "@/app/components/SecretFoundMap";

type GameCardData = {
  id: VibeGame;
  title: string;
  description: { en: string; de: string };
  badge: { en: string; de: string };
  available: boolean;
  accent: string;
};

const games: GameCardData[] = [
  {
    id: "reflex",
    title: "VIBE Reflex",
    description: { en: "Five quick rounds. Wait for the glow, then trust your reflexes.", de: "Fünf schnelle Runden. Warte auf das Leuchten und vertrau deinen Reflexen." },
    badge: { en: "Play now", de: "Jetzt spielen" },
    available: true,
    accent: "from-violet-500 via-fuchsia-500 to-orange-400",
  },
  {
    id: "trail",
    title: "VIBE Trail",
    description: { en: "Follow your trail and collect the VIBE mark. Keep an eye on your path.", de: "Folge deiner Spur und sammle das VIBE-Zeichen. Behalte deinen Weg im Blick." },
    badge: { en: "Coming soon", de: "Kommt bald" },
    available: false,
    accent: "from-cyan-400 to-violet-500",
  },
  {
    id: "stack",
    title: "VIBE Stack",
    description: { en: "Drop logo-shaped blocks, build lines, and make room for the next move.", de: "Setze logo-förmige Blöcke, bilde Reihen und schaff Platz für den nächsten Zug." },
    badge: { en: "Coming soon", de: "Kommt bald" },
    available: false,
    accent: "from-fuchsia-400 to-cyan-400",
  },
];

function GameCard({ game }: { game: GameCardData }) {
  return (
    <Link
      href={`/games/${game.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[1.7rem] border border-slate-200/80 bg-white/90 p-3 shadow-lg shadow-slate-900/5 transition duration-200 hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-950/10 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-violet-500 dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/20 dark:hover:border-violet-300/30"
    >
      <div className="overflow-hidden rounded-[1.35rem] transition-transform duration-300 group-hover:scale-[1.015]">
        <GameArtwork game={game.id} />
      </div>
      <div className="flex flex-1 flex-col px-2 pb-2 pt-4 sm:px-3">
        <div className="flex items-center justify-between gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-linear-to-r ${game.accent} px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-white shadow-sm`}>
            {game.available ? <Zap size={12} fill="currentColor" aria-hidden="true" /> : <Clock3 size={12} aria-hidden="true" />}
            <LocalizedText en={game.badge.en} de={game.badge.de} />
          </span>
          {game.available && <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">5 <LocalizedText en="rounds" de="Runden" /></span>}
        </div>
        <h2 className="mt-3 text-xl font-black tracking-tight text-slate-950 dark:text-white">{game.title}</h2>
        <p className="mt-2 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-300"><LocalizedText en={game.description.en} de={game.description.de} /></p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-violet-700 transition group-hover:gap-3 dark:text-violet-200">
          <LocalizedText en={game.available ? "Open game" : "See preview"} de={game.available ? "Spiel öffnen" : "Vorschau ansehen"} />
          <ArrowUpRight size={16} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

export default function GamesPage() {
  return (
    <main data-vibe-protected-main className="mx-auto w-full max-w-6xl pb-28 pt-3 md:pb-10">
      <BackNavigationLink fallbackHref="/home" />

      <section className="relative mt-4 overflow-hidden rounded-[2rem] border border-violet-200/80 bg-linear-to-br from-white via-violet-50 to-fuchsia-50 p-5 shadow-xl shadow-violet-950/5 dark:border-white/10 dark:from-slate-900 dark:via-[#17142a] dark:to-[#20132a] dark:shadow-black/25 sm:p-8 lg:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-fuchsia-400/15 blur-3xl dark:bg-fuchsia-500/10" />
        <div className="relative grid items-center gap-7 lg:grid-cols-[1fr_0.9fr] lg:gap-12">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/75 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-violet-800 dark:border-white/10 dark:bg-white/5 dark:text-violet-200"><Gamepad2 size={14} aria-hidden="true" /> VIBE ARCADE</span>
            <h1 className="mt-5 max-w-xl text-4xl font-black leading-[1.05] tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl"><LocalizedText en="Take a little VIBE break." de="Gönn dir eine kleine VIBE-Pause." /></h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg"><LocalizedText en="Tiny games, quick rounds, a fresh little challenge. Pick one and jump in." de="Kleine Spiele, kurze Runden, eine neue Mini-Herausforderung. Such dir eins aus und leg los." /></p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
              <span className="rounded-full border border-slate-200 bg-white/75 px-3 py-2 dark:border-white/10 dark:bg-white/5"><LocalizedText en="Free to play" de="Kostenlos spielbar" /></span>
              <span className="rounded-full border border-slate-200 bg-white/75 px-3 py-2 dark:border-white/10 dark:bg-white/5"><LocalizedText en="Quick breaks" de="Kurze Pausen" /></span>
              <span className="rounded-full border border-slate-200 bg-white/75 px-3 py-2 dark:border-white/10 dark:bg-white/5"><LocalizedText en="Made for VIBE" de="Für VIBE gemacht" /></span>
            </div>
            <Link href="/games/reflex" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-linear-to-r from-violet-600 via-fuchsia-600 to-orange-500 px-5 text-sm font-black text-white shadow-lg shadow-violet-900/20 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-violet-500">
              <LocalizedText en="Play VIBE Reflex" de="VIBE Reflex spielen" />
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>

          <Link href="/games/reflex" className="group relative block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-500">
            <div className="absolute -inset-3 rounded-[2rem] bg-linear-to-br from-violet-400/20 to-orange-300/10 blur-xl transition group-hover:from-violet-400/30" />
            <div className="relative overflow-hidden rounded-[1.65rem] border border-white/50 bg-slate-950 p-2 shadow-2xl shadow-violet-950/15 dark:border-white/10">
              <GameArtwork game="reflex" />
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/75 px-4 py-3 text-white shadow-lg backdrop-blur-md">
                <span><span className="block text-[10px] font-black uppercase tracking-[0.17em] text-violet-200"><LocalizedText en="Featured game" de="Im Spotlight" /></span><span className="mt-0.5 block font-black">VIBE Reflex</span></span>
                <span className="grid size-10 place-items-center rounded-full bg-white/10 text-violet-100 transition group-hover:bg-violet-400/25"><ArrowUpRight size={19} aria-hidden="true" /></span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section aria-labelledby="vibe-games-list" className="mt-9">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-1">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300"><Sparkles size={14} aria-hidden="true" /> VIBE GAMES</p>
            <h2 id="vibe-games-list" className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl"><LocalizedText en="Pick your next break" de="Wähl deine nächste Pause" /></h2>
          </div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400"><LocalizedText en="One live · more on the way" de="Ein Spiel verfügbar · mehr kommen" /></p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {games.map((game) => <GameCard key={game.id} game={game} />)}
        </div>
      </section>

      <section className="mt-8 rounded-[1.7rem] border border-slate-200/70 bg-white/65 p-4 dark:border-white/10 dark:bg-white/[0.03] sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-6">
        <div className="max-w-xl">
          <p className="text-sm font-black text-slate-900 dark:text-white"><LocalizedText en="More little games are in the works." de="Weitere kleine Spiele sind in Planung." /></p>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400"><LocalizedText en="The next ones will bring a VIBE trail to follow and logo-shaped blocks to stack." de="Als Nächstes warten eine VIBE-Spur zum Sammeln und logo-förmige Blöcke zum Stapeln." /></p>
        </div>
        <span className="mt-3 inline-flex shrink-0 items-center gap-2 rounded-full bg-violet-100 px-3 py-2 text-xs font-black text-violet-800 dark:bg-violet-400/10 dark:text-violet-200 sm:mt-0"><Clock3 size={14} aria-hidden="true" /><LocalizedText en="More soon" de="Mehr folgt" /></span>
      </section>

      <div className="mx-auto mt-8 max-w-xs"><SecretFoundMap /></div>
    </main>
  );
}
