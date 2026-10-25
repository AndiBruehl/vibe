import GameDetailShell from "@/app/components/games/GameDetailShell";
import LocalizedText from "@/app/components/LocalizedText";

export default function GlidePage() {
  return (
    <GameDetailShell
      game="glide"
      available={false}
      description={{
        en: "Guide the VIBE logo through the gaps with quick taps. Keep it airborne and see how far your run goes.",
        de: "Führe das VIBE-Logo mit schnellen Taps durch die Lücken. Halte es in der Luft und schau, wie weit du kommst.",
      }}
    >
      <section className="mt-5 rounded-[1.7rem] border border-orange-200/60 bg-orange-50/70 p-5 dark:border-orange-300/10 dark:bg-orange-300/[0.045] sm:p-6">
        <h2 className="text-lg font-black text-slate-950 dark:text-white"><LocalizedText en="The VIBE logo takes flight" de="Das VIBE-Logo hebt ab" /></h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300"><LocalizedText en="This future one-touch flyer will make the VIBE logo your flying character. Tap to rise, thread the gaps, and keep your run alive." de="In diesem späteren One-touch-Flugspiel wird das VIBE-Logo zur Spielfigur. Tippe zum Aufsteigen, flieg durch die Lücken und halte deinen Lauf am Leben." /></p>
        <p className="mt-4 inline-flex rounded-full bg-white/80 px-3 py-2 text-xs font-black text-orange-900 dark:bg-white/[0.06] dark:text-orange-100"><LocalizedText en="Preview only · not playable yet" de="Nur Vorschau · noch nicht spielbar" /></p>
      </section>
    </GameDetailShell>
  );
}
