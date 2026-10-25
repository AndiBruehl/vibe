import GameDetailShell from "@/app/components/games/GameDetailShell";
import ReflexGame from "@/app/components/games/ReflexGame";

export default function ReflexPage() {
  return (
    <GameDetailShell
      game="reflex"
      available
      description={{
        en: "Five short rounds. Wait for the green signal, then tap as fast as you can. False starts replay the same round.",
        de: "Fünf kurze Runden. Warte auf das grüne Signal und tippe so schnell du kannst. Bei einem Fehlstart kommt dieselbe Runde noch einmal.",
      }}
    >
      <ReflexGame />
    </GameDetailShell>
  );
}
