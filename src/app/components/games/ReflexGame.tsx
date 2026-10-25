"use client";

import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";
import useVibeLanguage from "@/app/components/useVibeLanguage";
import { ReflexOrbit, type ReflexSignalState } from "@/app/components/games/GameArtwork";
import { getReflexSummary, REFLEX_ROUND_COUNT } from "@/app/components/games/reflexLogic";

type ReflexPhase = ReflexSignalState;

export default function ReflexGame() {
  const de = useVibeLanguage() === "de";
  const [phase, setPhase] = useState<ReflexPhase>("idle");
  const [round, setRound] = useState(1);
  const [times, setTimes] = useState<number[]>([]);
  const [lastTime, setLastTime] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const signalAtRef = useRef<number | null>(null);
  const summary = getReflexSummary(times);

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function queueSignal() {
    clearTimer();
    signalAtRef.current = null;
    setPhase("waiting");
    timerRef.current = window.setTimeout(() => {
      signalAtRef.current = performance.now();
      setPhase("go");
    }, 1100 + Math.round(Math.random() * 2100));
  }

  function startGame() {
    clearTimer();
    signalAtRef.current = null;
    setTimes([]);
    setLastTime(null);
    setRound(1);
    queueSignal();
  }

  function handleTap() {
    if (phase === "idle" || phase === "finished") {
      startGame();
      return;
    }

    if (phase === "waiting") {
      clearTimer();
      signalAtRef.current = null;
      setPhase("false-start");
      timerRef.current = window.setTimeout(queueSignal, 950);
      return;
    }

    if (phase !== "go" || signalAtRef.current === null) return;

    const elapsed = Math.max(0, Math.round(performance.now() - signalAtRef.current));
    const nextTimes = [...times, elapsed];
    signalAtRef.current = null;
    setTimes(nextTimes);
    setLastTime(elapsed);

    if (nextTimes.length >= REFLEX_ROUND_COUNT) {
      clearTimer();
      setPhase("finished");
      return;
    }

    setRound(nextTimes.length + 1);
    setPhase("between");
    timerRef.current = window.setTimeout(queueSignal, 850);
  }

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  const liveMessage = phase === "waiting"
    ? (de ? "Warte auf das Signal …" : "Wait for the signal …")
    : phase === "go"
      ? (de ? "JETZT! Tippe!" : "NOW! Tap!")
      : phase === "false-start"
        ? (de ? "Zu früh! Gleich noch einmal." : "Too soon! Try this round again.")
        : phase === "between"
          ? (de ? `Runde geschafft: ${lastTime} ms. Nächste Runde …` : `Round done: ${lastTime} ms. Next round …`)
          : phase === "finished"
            ? (de ? "Geschafft! Hier ist dein Ergebnis." : "Done! Here is your result.")
            : (de ? "Fünf Runden. Wie schnell bist du?" : "Five rounds. How fast are you?");

  const buttonLabel = phase === "idle"
    ? (de ? "5 Runden starten" : "Start 5 rounds")
    : phase === "waiting"
      ? (de ? "Noch warten …" : "Wait …")
      : phase === "go"
        ? (de ? "JETZT TIPPEN!" : "TAP NOW!")
        : phase === "false-start"
          ? (de ? "Zu früh!" : "Too soon!")
          : phase === "between"
            ? (de ? `${lastTime} ms · nächste Runde` : `${lastTime} ms · next round`)
            : phase === "finished"
              ? (de ? "Nochmal spielen" : "Play again")
              : "";

  const buttonTone = phase === "go"
    ? "border-emerald-200/55 bg-[#101c19] text-white shadow-[0_0_50px_rgba(74,222,128,0.18)]"
    : phase === "false-start"
      ? "border-rose-200/45 bg-[#1b111c] text-white shadow-[0_0_45px_rgba(251,113,133,0.16)]"
      : phase === "between"
        ? "border-violet-300/20 bg-[#11132d] text-white/90"
        : "border-violet-300/30 bg-[#11132d] text-white shadow-[0_0_45px_rgba(139,92,246,0.14)]";
  const playfieldGlow = phase === "go"
    ? "bg-[radial-gradient(ellipse_at_50%_55%,rgba(74,222,128,0.24),transparent_58%)]"
    : phase === "false-start"
      ? "bg-[radial-gradient(ellipse_at_50%_55%,rgba(251,113,133,0.2),transparent_58%)]"
      : "bg-[radial-gradient(ellipse_at_50%_80%,rgba(124,58,237,0.3),transparent_58%)]";

  return (
    <section aria-label={de ? "VIBE Reflex-Spiel" : "VIBE Reflex game"} className="mt-2 rounded-[2rem] border border-violet-200/70 bg-white/80 p-2.5 shadow-xl shadow-violet-950/5 dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/20 sm:p-5 lg:mt-4 lg:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-violet-700 dark:text-violet-200"><Timer size={15} aria-hidden="true" /> {de ? "Reaktionsmodus" : "Reaction mode"}</p>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{de ? "Nur du gegen die Zeit" : "Just you vs. the clock"}</p>
      </div>

      <div className="mt-2 grid gap-3 md:mt-4 md:grid-cols-[minmax(0,1fr)_250px] md:gap-4">
        <div className="rounded-[1.6rem] border border-white/10 bg-[#0d1224] p-2 shadow-inner shadow-black/20 sm:p-3 md:p-5">
          <div className="mb-3 flex items-center justify-between px-1 text-xs font-bold text-slate-400">
            <span>{de ? `Runde ${phase === "idle" ? 0 : Math.min(round, REFLEX_ROUND_COUNT)} von ${REFLEX_ROUND_COUNT}` : `Round ${phase === "idle" ? 0 : Math.min(round, REFLEX_ROUND_COUNT)} of ${REFLEX_ROUND_COUNT}`}</span>
            <div className="flex gap-1.5" aria-label={de ? `${times.length} von 5 Runden abgeschlossen` : `${times.length} of 5 rounds complete`}>
              {Array.from({ length: REFLEX_ROUND_COUNT }, (_, index) => <span key={index} className={`size-2.5 rounded-full ${index < times.length ? "bg-emerald-300" : index === times.length && phase !== "idle" && phase !== "finished" ? "bg-violet-300" : "bg-white/15"}`} />)}
            </div>
          </div>

          <button
            type="button"
            onClick={handleTap}
            disabled={phase === "false-start" || phase === "between"}
            aria-label={buttonLabel}
            className={`group relative isolate grid min-h-44 w-full select-none place-items-center overflow-hidden rounded-[1.3rem] border p-3 text-center transition duration-300 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-300 active:scale-[0.99] disabled:cursor-wait disabled:opacity-90 md:min-h-60 md:p-5 lg:min-h-72 ${buttonTone}`}
          >
            <span aria-hidden="true" className={`pointer-events-none absolute inset-0 transition-colors duration-300 ${playfieldGlow}`} />
            <span aria-hidden="true" className="pointer-events-none absolute left-[18%] top-[22%] size-2 rounded-full bg-fuchsia-300/70" />
            <span aria-hidden="true" className="pointer-events-none absolute right-[20%] top-[31%] size-1.5 rounded-full bg-amber-200/80" />
            <span aria-hidden="true" className="pointer-events-none absolute bottom-[23%] left-[28%] size-1.5 rounded-full bg-cyan-200/80" />
            <span className="relative z-10 flex w-full flex-col items-center text-center">
              <div className="mb-2 flex w-full items-center justify-center transition-transform duration-200 group-hover:scale-105 md:mb-3">
                <ReflexOrbit state={phase} compact />
              </div>
              <span className="flex min-h-7 w-full items-center justify-center text-center text-xl font-black tracking-tight md:min-h-9 md:text-3xl">{buttonLabel}</span>
              <span className={`mt-1 flex w-full items-center justify-center text-center text-xs font-semibold md:mt-2 md:text-sm ${phase === "go" ? "text-emerald-100/80" : "text-white/65"}`}>
                {phase === "waiting" ? (de ? "Warte, bis das Feld grün wird" : "Wait until the field turns green") : phase === "go" ? (de ? "So schnell du kannst" : "As fast as you can") : phase === "false-start" ? (de ? "Der gleiche Versuch kommt gleich nochmal" : "The same round is coming right back") : phase === "between" ? (de ? "Mach dich bereit" : "Get ready") : phase === "finished" ? (de ? "Tippe für eine neue Runde" : "Tap to start a new run") : (de ? "Das Feld wechselt nach einer zufälligen Zeit" : "The field changes after a random delay")}
              </span>
            </span>
          </button>

          <p aria-live="polite" className="min-h-6 px-2 pt-3 text-center text-sm font-semibold text-slate-300">{liveMessage}</p>
        </div>

        <aside className="flex flex-col gap-3">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/50">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">{de ? "Dein Lauf" : "Your run"}</p>
            <div className="mt-4 space-y-2">
              {Array.from({ length: REFLEX_ROUND_COUNT }, (_, index) => (
                <div key={index} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm dark:bg-white/[0.045]">
                  <span className="font-bold text-slate-500 dark:text-slate-400">{de ? "Runde" : "Round"} {index + 1}</span>
                  <span className="font-black tabular-nums text-slate-800 dark:text-slate-100">{times[index] !== undefined ? `${times[index]} ms` : "—"}</span>
                </div>
              ))}
            </div>
          </div>

          {phase === "finished" && summary ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-300/15 dark:bg-emerald-300/[0.08]">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800 dark:text-emerald-200">{de ? "Durchschnitt" : "Average"}</p>
                <p className="mt-2 text-2xl font-black tabular-nums text-emerald-950 dark:text-white">{summary.averageMs}<span className="ml-1 text-xs">ms</span></p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-300/15 dark:bg-amber-300/[0.08]">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-amber-800 dark:text-amber-200">{de ? "Schnellste" : "Fastest"}</p>
                <p className="mt-2 text-2xl font-black tabular-nums text-amber-950 dark:text-white">{summary.fastestMs}<span className="ml-1 text-xs">ms</span></p>
              </div>
              <p className="col-span-2 rounded-2xl bg-violet-50 px-4 py-3 text-center text-xs font-bold text-violet-900 dark:bg-violet-400/10 dark:text-violet-100">
                {de ? "Dein Ergebnis bleibt nur in diesem Lauf. Ranglisten kommen später." : "Your result stays in this run. Leaderboards are planned for later."}
              </p>
            </div>
          ) : lastTime !== null ? (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm dark:border-white/10 dark:bg-slate-950/50">
              <span className="font-bold text-slate-500 dark:text-slate-400">{de ? "Letzte Reaktion" : "Last reaction"}</span>
              <span className="font-black tabular-nums text-slate-900 dark:text-white">{lastTime} ms</span>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
