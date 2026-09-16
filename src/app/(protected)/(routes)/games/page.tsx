import { Gamepad2, Sparkles } from "lucide-react";
import BackNavigationLink from "@/app/components/BackNavigationLink";
import LocalizedText from "@/app/components/LocalizedText";
import SecretFoundMap from "@/app/components/SecretFoundMap";

export default function GamesPage() {
  return (
    <main className="mx-auto w-full max-w-4xl pb-24 md:pb-8">
      <BackNavigationLink fallbackHref="/home" />
      <section className="mt-6 overflow-hidden rounded-[2rem] border border-violet-400/20 bg-linear-to-br from-violet-950 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-violet-950/30 sm:p-10">
        <div className="mx-auto max-w-xl text-center">
          <SecretFoundMap />
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-linear-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-950/50">
            <Gamepad2 size={32} aria-hidden="true" />
          </span>
          <p className="mt-6 inline-flex items-center gap-2 text-xs font-black tracking-[0.22em] text-violet-200"><Sparkles size={14} aria-hidden="true" /> VIBE GAMES</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl"><LocalizedText en="A little break is coming soon." de="Eine kleine Pause kommt bald." /></h1>
          <p className="mt-4 text-sm leading-6 text-slate-300 sm:text-base"><LocalizedText en="This will be a place for small JavaScript games when you want to switch off between two VIBEs. We will decide which games move in next." de="Hier entsteht ein Ort für kleine JavaScript-Games, wenn du zwischen zwei VIBEs kurz abschalten möchtest. Welche Spiele einziehen, entscheiden wir als Nächstes." /></p>
          <p className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-violet-100"><LocalizedText en="Game selection: still open" de="Game-Auswahl: noch offen" /></p>
        </div>
      </section>
    </main>
  );
}
