import GameDetailShell from "@/app/components/games/GameDetailShell";
import LocalizedText from "@/app/components/LocalizedText";

export default function TrailPage() {
  return (
    <GameDetailShell
      game="trail"
      available={false}
      description={{
        en: "Guide a growing VIBE trail around the board and collect the glowing VIBE logo. Plan your turns before the path closes in.",
        de: "Führe eine wachsende VIBE-Spur über das Spielfeld und sammle das leuchtende VIBE-Logo. Plane deine Züge, bevor der Weg eng wird.",
      }}
    >
      <section className="mt-5 rounded-[1.7rem] border border-cyan-200/60 bg-cyan-50/70 p-5 dark:border-cyan-300/10 dark:bg-cyan-300/[0.045] sm:p-6">
        <h2 className="text-lg font-black text-slate-950 dark:text-white"><LocalizedText en="A trail with a VIBE twist" de="Eine Spur mit VIBE-Dreh" /></h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300"><LocalizedText en="This future game is planned as a quick, keyboard- and touch-friendly score chase. The collectible will be the VIBE logo instead of fruit." de="Dieses spätere Spiel ist als schnelle Jagd mit Tastatur und Touch geplant. Gesammelt wird das VIBE-Logo statt Früchten." /></p>
        <p className="mt-4 inline-flex rounded-full bg-white/80 px-3 py-2 text-xs font-black text-cyan-900 dark:bg-white/[0.06] dark:text-cyan-100"><LocalizedText en="Preview only · not playable yet" de="Nur Vorschau · noch nicht spielbar" /></p>
      </section>
    </GameDetailShell>
  );
}
