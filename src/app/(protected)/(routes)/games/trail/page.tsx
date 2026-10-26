import GameDetailShell from "@/app/components/games/GameDetailShell";
import TrailGame from "@/app/components/games/TrailGame";

export default function TrailPage() {
  return (
    <GameDetailShell
      game="trail"
      available
      compact
      description={{
        en: "Guide the VIBE logo around the board, collect more marks, and avoid your own trail.",
        de: "Führe das VIBE-Logo über das Spielfeld, sammle weitere Logos und weiche deiner eigenen Spur aus.",
      }}
    >
      <TrailGame />
    </GameDetailShell>
  );
}
