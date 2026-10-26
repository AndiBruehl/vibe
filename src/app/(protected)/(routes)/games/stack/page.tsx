import GameDetailShell from "@/app/components/games/GameDetailShell";
import StackGame from "@/app/components/games/StackGame";

export default function StackPage() {
  return (
    <GameDetailShell
      game="stack"
      available
      compact
      description={{
        en: "Stack VIBE-logo pieces, clear rows, and beat your personal best on this device.",
        de: "Staple VIBE-Logo-Steine, lösche Reihen und knacke deinen persönlichen Bestwert auf diesem Gerät.",
      }}
    >
      <StackGame />
    </GameDetailShell>
  );
}
