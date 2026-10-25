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
    accent: "from-[#ff3483] via-[#ff4d54] to-[#ff9c24]",
  },
  {
    id: "trail",
    title: "VIBE Trail",
    description: { en: "Follow your trail and collect the VIBE mark. Keep an eye on your path.", de: "Folge deiner Spur und sammle das VIBE-Zeichen. Behalte deinen Weg im Blick." },
    badge: { en: "Coming soon", de: "Kommt bald" },
    available: false,
    accent: "from-[#22d3ee] to-[#6655ff]",
  },
  {
    id: "stack",
    title: "VIBE Stack",
    description: { en: "Stack VIBE-logo pieces, clear lines, and chase your local high score.", de: "Staple VIBE-Logo-Steine, lösche Reihen und knacke deinen lokalen Bestwert." },
    badge: { en: "Play offline", de: "Offline spielen" },
    available: true,
    accent: "from-[#fa47bb] to-[#7b5cff]",
  },
  {
    id: "glide",
    title: "VIBE Glide",
    description: { en: "Fly the VIBE logo through the gaps. How long can you stay airborne?", de: "Flieg mit dem VIBE-Logo durch die Lücken. Wie lange bleibst du in der Luft?" },
    badge: { en: "Coming soon", de: "Kommt bald" },
    available: false,
    accent: "from-[#ff5a8b] to-[#ffad37]",
  },
];

function GameCard({ game }: { game: GameCardData }) {
  return (
    <Link
      href={`/games/${game.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.7rem] border border-[#eadde4] bg-white p-3 shadow-[0_16px_42px_rgba(90,38,63,0.09)] transition duration-200 hover:-translate-y-1 hover:border-[#ff7b65]/60 hover:shadow-[0_24px_65px_rgba(255,65,119,0.14)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ff7b65] dark:border-white/10 dark:bg-[#111324] dark:shadow-[0_20px_55px_rgba(2,3,16,0.32)]"
    >
      <div className="relative overflow-hidden rounded-[1.35rem]">
        <GameArtwork game={game.id} />
      </div>
      <div className="flex flex-1 flex-col px-2 pb-2 pt-4 sm:px-3">
        <div className="flex items-center justify-between gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-linear-to-r ${game.accent} px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-white shadow-sm`}>
            {game.available ? <Zap size={12} fill="currentColor" aria-hidden="true" /> : <Clock3 size={12} aria-hidden="true" />}
            <LocalizedText en={game.badge.en} de={game.badge.de} />
          </span>
          {game.available && <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">5 <LocalizedText en="rounds" de="Runden" /></span>}
        </div>
        <h2 className="mt-3 text-xl font-black tracking-tight text-slate-950 dark:text-white">{game.title}</h2>
        <p className="mt-2 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-300"><LocalizedText en={game.description.en} de={game.description.de} /></p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#c52c5c] transition group-hover:gap-3 group-hover:text-[#8c1740] dark:text-[#ffac78] dark:group-hover:text-white">
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

      <div className="mt-2 flex justify-center">
        <SecretFoundMap />
      </div>

      <section className="relative isolate mt-1 overflow-hidden rounded-[2.1rem] border border-[#f2c4d0] bg-[#fff7f5] p-5 shadow-[0_24px_70px_rgba(141,38,73,0.12)] dark:border-[#ff6984]/20 dark:bg-[#090b18] dark:shadow-[0_28px_90px_rgba(11,7,28,0.48)] sm:p-8 lg:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_82%_10%,rgba(255,89,115,0.22),transparent_34%),radial-gradient(ellipse_at_10%_100%,rgba(115,73,255,0.2),transparent_42%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(rgba(80,35,65,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(80,35,65,0.16)_1px,transparent_1px)] [background-size:34px_34px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)] dark:opacity-[0.14] dark:[background-image:linear-gradient(rgba(255,255,255,0.13)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.13)_1px,transparent_1px)]" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_0.9fr] lg:gap-12">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#ff8c70]/25 bg-[#ff6a7d]/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#b42356] dark:text-[#ffc198]"><Gamepad2 size={14} aria-hidden="true" /> VIBE ARCADE</span>
            <h1 className="mt-5 max-w-xl text-4xl font-black leading-[1.02] tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl"><LocalizedText en="Your next little side quest." de="Deine nächste kleine Nebenmission." /></h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg"><LocalizedText en="Quick games. Big VIBE. Pick a challenge and make this break yours." de="Kurze Spiele. Große VIBE. Such dir eine Herausforderung und mach diese Pause zu deiner." /></p>
            <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.1em] text-slate-600 dark:text-slate-300">
              <span className="rounded-lg border border-[#e9d8df] bg-white/75 px-3 py-2 dark:border-white/10 dark:bg-white/[0.045]"><LocalizedText en="Free play" de="Kostenlos" /></span>
              <span className="rounded-lg border border-[#e9d8df] bg-white/75 px-3 py-2 dark:border-white/10 dark:bg-white/[0.045]"><LocalizedText en="Fast rounds" de="Kurze Runden" /></span>
              <span className="rounded-lg border border-[#e9d8df] bg-white/75 px-3 py-2 dark:border-white/10 dark:bg-white/[0.045]">Made for VIBE</span>
            </div>
            <Link href="/games/reflex" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/20 bg-linear-to-r from-[#ff3881] via-[#ff4f52] to-[#ff9b23] px-5 text-sm font-black text-white shadow-[0_8px_35px_rgba(255,67,107,0.3)] transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ffc198]">
              <LocalizedText en="Play VIBE Reflex" de="VIBE Reflex spielen" />
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>

          <Link href="/games/reflex" className="group relative block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffc198]">
            <div aria-hidden="true" className="absolute -inset-4 rounded-[2rem] bg-linear-to-br from-[#ff3985]/30 via-transparent to-[#ffad36]/25 blur-2xl transition group-hover:from-[#ff3985]/45" />
            <div className="relative rotate-1 overflow-hidden rounded-[1.65rem] border border-[#eadde4] bg-white p-2 shadow-xl shadow-[#5a263f]/10 transition duration-300 group-hover:rotate-0 dark:border-white/15 dark:bg-[#111324] dark:shadow-2xl dark:shadow-black/40">
              <GameArtwork game="reflex" />
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-xl border border-white/15 bg-[#090b18]/85 px-4 py-3 text-white shadow-lg backdrop-blur-md">
                <span><span className="block text-[10px] font-black uppercase tracking-[0.17em] text-[#ffc198]"><LocalizedText en="Featured game" de="Im Spotlight" /></span><span className="mt-0.5 block font-black">VIBE Reflex</span></span>
                <span className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-[#ff3985] to-[#ff9b23] text-white transition group-hover:scale-105"><ArrowUpRight size={19} aria-hidden="true" /></span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section aria-labelledby="vibe-games-list" className="mt-9">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-1">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.18em] text-[#c52c5c] dark:text-[#ff8c70]"><Sparkles size={14} aria-hidden="true" /> SELECT YOUR GAME</p>
            <h2 id="vibe-games-list" className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl"><LocalizedText en="Choose your side quest" de="Wähl deine Nebenmission" /></h2>
          </div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400"><LocalizedText en="02 playable · 02 in the works" de="02 spielbar · 02 in Arbeit" /></p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {games.map((game) => <GameCard key={game.id} game={game} />)}
        </div>
      </section>

      <section className="relative mt-8 overflow-hidden rounded-[1.7rem] border border-[#f2c4d0] bg-white p-5 shadow-md shadow-[#5a263f]/[0.06] dark:border-[#ff8d72]/20 dark:bg-[#111324] dark:shadow-none sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-6">
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-16 size-48 rounded-full bg-[#ff4b8c]/10 blur-3xl" />
        <div className="relative max-w-xl">
          <p className="text-sm font-black text-slate-950 dark:text-white"><LocalizedText en="More little games are loading." de="Weitere kleine Spiele laden schon." /></p>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300"><LocalizedText en="The next games put the VIBE logo in motion: chase it, fly it, stack it." de="Die nächsten Spiele bringen das VIBE-Logo in Bewegung: sammeln, fliegen, stapeln." /></p>
        </div>
        <span className="relative mt-3 inline-flex shrink-0 items-center gap-2 rounded-lg border border-[#f2c4d0] bg-[#fff5f3] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#bd315d] dark:border-white/10 dark:bg-white/[0.06] dark:text-[#ffc198] sm:mt-0"><Clock3 size={14} aria-hidden="true" /><LocalizedText en="More soon" de="Mehr folgt" /></span>
      </section>
    </main>
  );
}
