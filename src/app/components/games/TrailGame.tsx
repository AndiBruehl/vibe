"use client";

import Image from "next/image";
import { useCallback, useEffect, useReducer } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Pause, Play, RotateCcw, Sparkles, Trophy } from "lucide-react";
import useVibeLanguage from "@/app/components/useVibeLanguage";
import {
  createInitialTrailGame,
  getTrailTickInterval,
  readTrailBestScore,
  TRAIL_BOARD_SIZE,
  writeTrailBestScore,
  trailGameReducer,
  type TrailDirection,
} from "@/app/components/games/trailLogic";

const controls: { direction: TrailDirection; icon: typeof ArrowUp }[] = [
  { direction: "up", icon: ArrowUp },
  { direction: "left", icon: ArrowLeft },
  { direction: "down", icon: ArrowDown },
  { direction: "right", icon: ArrowRight },
];

export default function TrailGame() {
  const de = useVibeLanguage() === "de";
  const [game, dispatch] = useReducer(trailGameReducer, undefined, createInitialTrailGame);
  const startGame = useCallback(() => dispatch({ type: "start", random: Math.random() }), []);
  const snakeCells = new Map(game.snake.map((cell, index) => [`${cell.x},${cell.y}`, index]));

  useEffect(() => {
    if (game.phase !== "playing") return;
    const timer = window.setInterval(() => dispatch({ type: "tick", random: Math.random() }), getTrailTickInterval(game.score));
    return () => window.clearInterval(timer);
  }, [game.phase, game.score]);

  useEffect(() => {
    try {
      const saved = readTrailBestScore(window.localStorage);
      if (saved > 0) dispatch({ type: "restore-best", score: saved });
    } catch { /* A local record is optional; gameplay does not depend on browser storage. */ }
  }, []);

  useEffect(() => {
    if (game.bestScore <= 0) return;
    try {
      writeTrailBestScore(window.localStorage, game.bestScore);
    } catch { /* Keep the current run playable when storage is unavailable. */ }
  }, [game.bestScore]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (target instanceof HTMLElement && target.closest("button") && (event.key === "Enter" || event.code === "Space")) return;

      const key = event.key.toLowerCase();
      if ((event.key === "Enter" || event.code === "Space") && (game.phase === "ready" || game.phase === "over" || game.phase === "won")) {
        event.preventDefault();
        if (!event.repeat) startGame();
        return;
      }
      if (event.key === "Escape" || key === "p") {
        if (game.phase === "playing") dispatch({ type: "pause" });
        else if (game.phase === "paused") dispatch({ type: "resume" });
        return;
      }
      if (game.phase !== "playing" || event.repeat) return;

      const direction: TrailDirection | null = event.key === "ArrowUp" || key === "w" ? "up"
        : event.key === "ArrowRight" || key === "d" ? "right"
          : event.key === "ArrowDown" || key === "s" ? "down"
            : event.key === "ArrowLeft" || key === "a" ? "left"
              : null;
      if (direction) {
        event.preventDefault();
        dispatch({ type: "turn", direction });
      }
    };
    const onVisibilityChange = () => {
      if (document.hidden) dispatch({ type: "pause" });
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [game.phase, startGame]);

  const status = game.phase === "ready"
    ? (de ? "Bereit für deine Spur?" : "Ready to trail?")
    : game.phase === "paused"
      ? (de ? "Pause" : "Paused")
      : game.phase === "won"
        ? (de ? "Spielfeld geschafft!" : "Board cleared!")
        : game.phase === "over"
          ? (de ? "Deine Spur endet hier" : "Trail ended")
          : (de ? "Spur läuft" : "Trail in progress");
  const subtitle = game.phase === "ready"
    ? (de ? "Sammle VIBE-Logos und weiche deiner Spur aus." : "Collect VIBE logos and stay clear of your trail.")
    : game.phase === "paused"
      ? (de ? "Dein Lauf wartet auf dich." : "Your run is waiting for you.")
      : game.phase === "won"
        ? (de ? "Du hast das ganze Feld gefüllt." : "You filled the whole board.")
        : (de ? `Du hast ${game.score} Punkte gesammelt.` : `You collected ${game.score} points.`);
  const actionLabel = game.phase === "paused"
    ? (de ? "Fortsetzen" : "Resume")
    : game.phase === "over" || game.phase === "won"
      ? (de ? "Nochmal spielen" : "Play again")
      : (de ? "VIBE Trail starten" : "Start VIBE Trail");

  return (
    <section aria-label={de ? "VIBE Trail-Spiel" : "VIBE Trail game"} className="mt-2 rounded-[2rem] border border-cyan-200/70 bg-white/80 p-3 shadow-xl shadow-cyan-950/5 dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/20 sm:p-5 lg:mt-4 lg:p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-800 dark:text-cyan-200"><Sparkles size={15} aria-hidden="true" /> {de ? "VIBE ARCADE" : "VIBE ARCADE"}</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => dispatch({ type: game.phase === "paused" ? "resume" : "pause" })} disabled={game.phase !== "playing" && game.phase !== "paused"} aria-label={game.phase === "paused" ? (de ? "Fortsetzen" : "Resume") : (de ? "Pausieren" : "Pause")} className="grid size-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-cyan-300 dark:hover:text-cyan-200"><span className="sr-only">{game.phase === "paused" ? (de ? "Fortsetzen" : "Resume") : (de ? "Pausieren" : "Pause")}</span>{game.phase === "paused" ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}</button>
          <button type="button" onClick={startGame} aria-label={de ? "Neuen Lauf starten" : "Start a new run"} className="grid size-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-cyan-300 dark:hover:text-cyan-200"><RotateCcw size={16} aria-hidden="true" /></button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">{status}</p>

      <div className="mt-3 grid gap-3 sm:mt-4 lg:grid-cols-[minmax(0,1fr)_14rem] lg:gap-5">
        <div className="min-w-0 rounded-[1.6rem] border border-cyan-100 bg-[#f4fbfc] p-2 shadow-inner shadow-cyan-950/[0.035] dark:border-white/10 dark:bg-[#0c1424] dark:shadow-black/20 sm:p-3">
          <div className="relative mx-auto w-full max-w-[28rem]" style={{ width: "min(100%, 28rem, max(13rem, calc(100svh - 25rem)))" }}>
            <div role="img" aria-label={de ? `Spielfeld mit ${game.snake.length} VIBE-Steinen und ${game.score} Punkten.` : `Board with ${game.snake.length} VIBE pieces and ${game.score} points.`} className="grid aspect-square gap-[3px] overflow-hidden rounded-[1.15rem] border border-cyan-200 bg-white p-2 dark:border-cyan-200/20 dark:bg-[#080e1a]" style={{ gridTemplateColumns: `repeat(${TRAIL_BOARD_SIZE}, minmax(0, 1fr))` }}>
              {Array.from({ length: TRAIL_BOARD_SIZE * TRAIL_BOARD_SIZE }, (_, index) => {
                const x = index % TRAIL_BOARD_SIZE;
                const y = Math.floor(index / TRAIL_BOARD_SIZE);
                const segment = snakeCells.get(`${x},${y}`);
                const isHead = segment === 0;
                const isBody = segment !== undefined && segment > 0;
                const isLogo = game.food?.x === x && game.food.y === y;
                return <span key={index} aria-hidden="true" className={`relative grid aspect-square min-w-0 place-items-center overflow-hidden rounded-[4px] ${isHead ? "bg-linear-to-br from-cyan-200 to-teal-400 shadow-[0_0_12px_rgba(34,211,238,0.5)]" : isBody ? segment! % 2 === 0 ? "bg-linear-to-br from-violet-500 to-indigo-600 shadow-[0_0_8px_rgba(129,140,248,0.3)]" : "bg-linear-to-br from-fuchsia-500 to-violet-600 shadow-[0_0_8px_rgba(217,70,239,0.25)]" : isLogo ? "bg-amber-300/10 shadow-[0_0_14px_rgba(251,191,36,0.22)]" : "bg-slate-100/75 dark:bg-white/[0.035]"}`}>
                  {(isHead || isLogo) && <Image src="/logo.svg" alt="" width={1536} height={1024} className={`h-full w-full scale-[1.8] object-contain ${isHead ? "drop-shadow-[0_0_5px_rgba(255,255,255,0.75)]" : "drop-shadow-[0_0_9px_rgba(251,191,36,0.95)]"}`} />}
                </span>;
              })}
            </div>
            {game.phase !== "playing" && <div className="absolute inset-2 grid place-items-center rounded-[1rem] bg-white/80 p-4 text-center backdrop-blur-sm dark:bg-slate-950/80">
              <div className="max-w-[17rem]">
                <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-linear-to-br from-cyan-400 to-violet-600 text-white shadow-lg shadow-cyan-900/20">{game.phase === "over" || game.phase === "won" ? <Trophy size={20} aria-hidden="true" /> : <Sparkles size={20} aria-hidden="true" />}</span>
                <h2 className="mt-3 text-xl font-black tracking-tight text-slate-950 dark:text-white">{status}</h2>
                <p className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-300">{subtitle}</p>
                <button type="button" onClick={game.phase === "paused" ? () => dispatch({ type: "resume" }) : startGame} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-violet-600 px-4 text-sm font-black text-white shadow-lg shadow-cyan-950/15 transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500">{actionLabel}<Play size={15} fill="currentColor" aria-hidden="true" /></button>
              </div>
            </div>}
          </div>
        </div>

        <aside className="grid grid-cols-2 content-start gap-2.5 lg:grid-cols-1" aria-label={de ? "Spielstand und Steuerung" : "Score and controls"}>
          <div className="col-span-2 rounded-2xl border border-cyan-100 bg-cyan-50/80 p-2.5 text-[11px] leading-4 text-slate-600 dark:border-cyan-300/10 dark:bg-cyan-300/[0.045] dark:text-slate-300 sm:p-3 sm:text-xs sm:leading-5 lg:col-span-1">
            <p className="font-black text-cyan-900 dark:text-cyan-100">{de ? "Steuerung" : "Controls"}</p>
            <p className="mt-1">{de ? "Pfeiltasten oder WASD. Auf Touch nutzt du das Steuerkreuz. Eine Wendung pro Schritt; kein U-Turn." : "Arrow keys or WASD. Use the direction pad on touch. One turn per step; no U-turns."}</p>
          </div>

          <div className="col-span-2 rounded-2xl border border-slate-200 bg-white/70 p-2.5 dark:border-white/10 dark:bg-white/[0.025] sm:p-3 lg:col-span-1">
            <div className="mx-auto grid max-w-40 grid-cols-3 gap-1.5">
              {[
                null,
                controls[0],
                null,
                controls[1],
                null,
                controls[3],
                null,
                controls[2],
                null,
              ].map((control, index) => control ? <button key={control.direction} type="button" onClick={() => dispatch({ type: "turn", direction: control.direction })} disabled={game.phase !== "playing"} aria-label={de ? `Nach ${control.direction === "up" ? "oben" : control.direction === "down" ? "unten" : control.direction === "left" ? "links" : "rechts"} lenken` : `Turn ${control.direction}`} className="grid aspect-square place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700 active:scale-95 disabled:opacity-40 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-cyan-300"><control.icon size={18} aria-hidden="true" /></button> : <span key={`empty-${index}`} aria-hidden="true" />)}
            </div>
          </div>

          <p className="col-span-2 rounded-2xl border border-cyan-100 bg-cyan-50/80 p-2.5 text-[11px] leading-4 text-slate-600 dark:border-cyan-300/10 dark:bg-cyan-300/[0.045] dark:text-slate-300 sm:p-3 sm:text-xs sm:leading-5 lg:col-span-1">
            <span className="font-black text-cyan-900 dark:text-cyan-100">{de ? "Dein lokaler Lauf" : "Your local run"}</span><br />
            {de ? "Dein Bestwert bleibt auf diesem Gerät. Es gibt keine Online-Rangliste oder Synchronisierung." : "Your best stays on this device. There is no online leaderboard or syncing."}
          </p>

          {[
            { label: de ? "Punkte" : "Score", value: game.score },
            { label: de ? "Bestwert · Gerät" : "Best · device", value: game.bestScore },
            { label: de ? "Spurlänge" : "Trail length", value: game.snake.length },
            { label: de ? "Tempo" : "Speed", value: `${(1000 / getTrailTickInterval(game.score)).toFixed(1)}×` },
          ].map((stat) => <div key={stat.label} className="rounded-2xl border border-cyan-100 bg-white/80 p-2.5 dark:border-white/10 dark:bg-white/[0.035] sm:p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 sm:text-[10px] sm:tracking-[0.12em]">{stat.label}</p>
            <p className="mt-1 text-lg font-black tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-xl">{stat.value.toLocaleString(de ? "de-DE" : "en-US")}</p>
          </div>)}

        </aside>
      </div>
    </section>
  );
}
