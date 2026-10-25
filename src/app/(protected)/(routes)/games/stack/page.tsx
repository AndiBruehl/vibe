import GameDetailShell from "@/app/components/games/GameDetailShell";
import LocalizedText from "@/app/components/LocalizedText";

export default function StackPage() {
  return (
    <GameDetailShell
      game="stack"
      available={false}
      description={{
        en: "Fit falling VIBE-logo blocks together, complete rows, and keep the board open for one more move.",
        de: "Setze fallende VIBE-Logo-Blöcke zusammen, vervollständige Reihen und halte das Feld für den nächsten Zug frei.",
      }}
    >
      <section className="mt-5 rounded-[1.7rem] border border-fuchsia-200/60 bg-fuchsia-50/70 p-5 dark:border-fuchsia-300/10 dark:bg-fuchsia-300/[0.045] sm:p-6">
        <h2 className="text-lg font-black text-slate-950 dark:text-white"><LocalizedText en="Logo blocks, VIBE style" de="Logo-Blöcke im VIBE-Style" /></h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300"><LocalizedText en="This future block puzzle will use VIBE-logo pieces and short, satisfying rounds. Its controls and board size will be tuned for both touch and keyboard." de="Dieses spätere Block-Puzzle nutzt VIBE-Logo-Steine und kurze, befriedigende Runden. Steuerung und Feldgröße werden für Touch und Tastatur abgestimmt." /></p>
        <p className="mt-4 inline-flex rounded-full bg-white/80 px-3 py-2 text-xs font-black text-fuchsia-900 dark:bg-white/[0.06] dark:text-fuchsia-100"><LocalizedText en="Preview only · not playable yet" de="Nur Vorschau · noch nicht spielbar" /></p>
      </section>
    </GameDetailShell>
  );
}
