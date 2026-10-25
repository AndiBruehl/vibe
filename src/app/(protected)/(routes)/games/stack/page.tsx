import GameDetailShell from "@/app/components/games/GameDetailShell";
import StackGame from "@/app/components/games/StackGame";

export default function StackPage() {
  return (
    <GameDetailShell
      game="stack"
      available
      compact
      description={{
        en: "A solo block puzzle. Stack VIBE-logo pieces, clear rows, and beat your personal best on this device.",
        de: "Ein Blockpuzzle für eine Person. Staple VIBE-Logo-Steine, lösche Reihen und knacke deinen persönlichen Bestwert auf diesem Gerät.",
      }}
    >
      <StackGame />
    </GameDetailShell>
  );
}
