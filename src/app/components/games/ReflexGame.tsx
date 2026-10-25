"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Timer } from "lucide-react";
import useVibeLanguage from "@/app/components/useVibeLanguage";
import { getReflexSummary, REFLEX_ROUND_COUNT } from "@/app/components/games/reflexLogic";

type ReflexPhase = "idle" | "waiting" | "go" | "false-start" | "between" | "finished";

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
    ? "border-emerald-200 bg-linear-to-br from-emerald-300 to-lime-300 text-emerald-950 shadow-[0_0_50px_rgba(74,222,128,0.25)]"
    : phase === "waiting"
      ? "border-violet-300/20 bg-linear-to-br from-violet-950 to-slate-950 text-white"
      : phase === "false-start"
        ? "border-rose-300/20 bg-linear-to-br from-rose-950 to-slate-950 text-rose-100"
        : phase === "between"
          ? "border-white/10 bg-white/[0.06] text-white/80"
          : "border-transparent bg-linear-to-r from-violet-500 via-fuchsia-500 to-orange-400 text-white shadow-lg shadow-fuchsia-950/25";

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
            className={`group grid min-h-40 w-full select-none place-items-center rounded-[1.3rem] border p-3 text-center transition duration-200 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-300 active:scale-[0.99] disabled:cursor-wait disabled:opacity-90 md:min-h-56 md:p-5 lg:min-h-72 ${buttonTone}`}
          >
            <span className="block">
              <span className={`mx-auto mb-3 block w-16 transition duration-200 group-hover:scale-105 md:mb-5 md:w-24 ${phase === "go" ? "drop-shadow-[0_0_22px_rgba(74,222,128,0.85)]" : "drop-shadow-[0_0_14px_rgba(255,145,90,0.55)]"}`}>
                <Image src="/logo.svg" alt="" width={1536} height={1024} className="block h-auto w-full object-contain" />
              </span>
              <span className="block text-xl font-black tracking-tight md:text-3xl">{buttonLabel}</span>
              <span className={`mt-1 block text-xs font-semibold md:mt-2 md:text-sm ${phase === "go" ? "text-emerald-950/70" : "text-white/65"}`}>
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
