import Image from "next/image";
import Link from "next/link";
import { CircleHelp, House } from "lucide-react";
import BackNavigationLink from "@/app/components/BackNavigationLink";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#101828] px-4 py-5 text-slate-100 sm:px-8 sm:py-8">
      <div className="mx-auto flex w-full max-w-5xl items-center">
        <BackNavigationLink fallbackHref="/home" language="de" label="Zurück" />
      </div>

      <section className="mx-auto grid min-h-[calc(100vh-7rem)] w-full max-w-2xl place-items-center py-8 text-center">
        <div className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 p-7 shadow-2xl shadow-black/30 backdrop-blur sm:p-10">
          <Image src="/logo.svg" alt="VIBE" width={140} height={140} priority className="mx-auto h-auto w-28 drop-shadow-xl sm:w-32" />
          <p className="mt-6 text-xs font-black tracking-[0.24em] text-orange-400">VIBE · 404</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Ups, diese Ecke von VIBE gibt es nicht.</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">Vielleicht wurde der Link verschoben, vielleicht war er nie für dich bestimmt. Kein Stress — wir bringen dich wieder zurück in den Vibe.</p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/home" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-(--ig-orange) to-(--ig-red) px-5 py-2.5 text-sm font-bold text-white no-underline shadow-lg shadow-orange-950/30 transition hover:brightness-110">
              <House size={17} aria-hidden="true" />
              Zur Startseite
            </Link>
            <Link href="/support" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cyan-300/50 bg-cyan-400/10 px-5 py-2.5 text-sm font-bold text-cyan-100 no-underline transition hover:border-cyan-200 hover:bg-cyan-400/20">
              <CircleHelp size={17} aria-hidden="true" />
              Fehler an Support melden
            </Link>
          </div>

          <p className="mt-6 text-xs text-slate-400">Wenn du über einen VIBE-Link hier gelandet bist, freut sich das Support-Team über einen kurzen Hinweis.</p>
        </div>
      </section>
    </main>
  );
}
