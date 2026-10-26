import GameDetailShell from "@/app/components/games/GameDetailShell";
import GlideGame from "@/app/components/games/GlideGame";

export default function GlidePage() {
  return (
    <GameDetailShell
      game="glide"
      available
      compact
      description={{
        en: "Guide the VIBE logo through the gaps with quick taps. Keep it airborne and see how far your run goes.",
        de: "Führe das VIBE-Logo mit schnellen Taps durch die Lücken. Halte es in der Luft und schau, wie weit du kommst.",
      }}
    >
      <GlideGame />
    </GameDetailShell>
  );
}
