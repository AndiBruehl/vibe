"use client";

import { useCallback, useEffect, useReducer } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, Pause, Play, RotateCcw, RotateCw, Sparkles, Trophy } from "lucide-react";
import useVibeLanguage from "@/app/components/useVibeLanguage";
import {
  createInitialStackGame,
  createStackBag,
  createStackPiece,
  getStackDropInterval,
  getStackLandingY,
  getStackPieceCells,
  STACK_BOARD_HEIGHT,
  STACK_BOARD_WIDTH,
  STACK_PIECE_COLORS,
  stackGameReducer,
  type StackPieceType,
} from "@/app/components/games/stackLogic";

const BEST_SCORE_KEY = "vibe-stack-best-v1";

function PiecePreview({ type }: { type: StackPieceType }) {
  const occupied = new Set(getStackPieceCells(createStackPiece(type, 0, 0)).map(({ x, y }) => `${x},${y}`));
  return (
    <div aria-hidden="true" className="grid w-fit grid-cols-4 gap-1 rounded-xl border border-slate-200/80 bg-white/70 p-2 dark:border-white/10 dark:bg-slate-950/50">
      {Array.from({ length: 16 }, (_, index) => {
        const key = `${index % 4},${Math.floor(index / 4)}`;
        const filled = occupied.has(key);
        return <span key={index} className={`aspect-square size-4 rounded-[3px] border ${filled ? "border-white/70 shadow-inner shadow-white/20" : "border-slate-200/70 bg-slate-100/70 dark:border-white/[0.04] dark:bg-white/[0.025]"}`} style={filled ? { backgroundColor: STACK_PIECE_COLORS[type], backgroundImage: "url('/logo.svg')", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "135% auto" } : undefined} />;
      })}
    </div>
  );
}

export default function StackGame() {
  const de = useVibeLanguage() === "de";
  const [game, dispatch] = useReducer(stackGameReducer, undefined, createInitialStackGame);
  const level = Math.floor(game.lines / 10) + 1;
  const currentCells = new Map((game.active ? getStackPieceCells(game.active) : []).map((cell) => [`${cell.x},${cell.y}`, game.active!.type]));
  const landingCells = game.phase === "playing" && game.active
    ? new Set(getStackPieceCells({ ...game.active, y: getStackLandingY(game.board, game.active) }).map(({ x, y }) => `${x},${y}`))
    : new Set<string>();

  const startGame = useCallback(() => {
    dispatch({ type: "start", bag: createStackBag() });
  }, []);

  function move(dx: number) {
    dispatch({ type: "move", dx });
  }

  function rotate() {
    dispatch({ type: "rotate" });
  }

  function softDrop() {
    dispatch({ type: "soft-drop", refill: createStackBag() });
  }

  function hardDrop() {
    dispatch({ type: "hard-drop", refill: createStackBag() });
  }

  useEffect(() => {
    if (game.phase !== "playing") return;
    const timer = window.setInterval(() => dispatch({ type: "tick", refill: createStackBag() }), getStackDropInterval(game.lines));
    return () => window.clearInterval(timer);
  }, [game.phase, game.lines]);

  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(BEST_SCORE_KEY));
      if (Number.isFinite(saved) && saved > 0) dispatch({ type: "restore-best", score: Math.floor(saved) });
    } catch { /* A local record is optional; gameplay does not depend on browser storage. */ }
  }, []);

  useEffect(() => {
    if (game.bestScore <= 0) return;
    try {
      window.localStorage.setItem(BEST_SCORE_KEY, String(game.bestScore));
    } catch { /* Keep the current run playable when storage is unavailable. */ }
  }, [game.bestScore]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("button, input, textarea, select, [contenteditable='true']")) return;

      if ((event.key === "Enter" || event.key === " ") && (game.phase === "ready" || game.phase === "over")) {
        event.preventDefault();
        startGame();
        return;
      }
      if (event.key === "Escape" || event.key.toLowerCase() === "p") {
        if (game.phase === "playing") dispatch({ type: "pause" });
        else if (game.phase === "paused") dispatch({ type: "resume" });
        return;
      }
      if (game.phase !== "playing") return;

      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        event.preventDefault();
        dispatch({ type: "move", dx: -1 });
      } else if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        event.preventDefault();
        dispatch({ type: "move", dx: 1 });
      } else if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
        event.preventDefault();
        dispatch({ type: "soft-drop", refill: createStackBag() });
      } else if (event.key === "ArrowUp" || event.key.toLowerCase() === "w" || event.key.toLowerCase() === "x") {
        event.preventDefault();
        dispatch({ type: "rotate" });
      } else if (event.code === "Space" && !event.repeat) {
        event.preventDefault();
        dispatch({ type: "hard-drop", refill: createStackBag() });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [game.phase, startGame]);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.visibilityState === "hidden") dispatch({ type: "pause" });
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, []);

  const status = game.phase === "ready"
    ? (de ? "Bereit für deinen Stack?" : "Ready to stack?")
    : game.phase === "playing"
      ? (de ? `Level ${level} · Weiter geht's` : `Level ${level} · Keep stacking`)
      : game.phase === "paused"
        ? (de ? "Spiel pausiert" : "Game paused")
        : (de ? "Spiel vorbei · Neuer Lauf?" : "Game over · One more run?");

  return (
    <section aria-label={de ? "VIBE Stack-Spiel" : "VIBE Stack game"} className="mt-2 rounded-[2rem] border border-fuchsia-200/70 bg-white/80 p-3 shadow-xl shadow-fuchsia-950/5 dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/20 sm:p-5 lg:mt-4 lg:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-fuchsia-800 dark:text-fuchsia-200"><Sparkles size={15} aria-hidden="true" /> {de ? "Einzelspiel" : "Solo mode"}</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => dispatch({ type: game.phase === "paused" ? "resume" : "pause" })} disabled={game.phase !== "playing" && game.phase !== "paused"} aria-label={game.phase === "paused" ? (de ? "Fortsetzen" : "Resume") : (de ? "Pausieren" : "Pause")} className="grid size-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-fuchsia-300 hover:text-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-fuchsia-300 dark:hover:text-fuchsia-200"><span className="sr-only">{game.phase === "paused" ? (de ? "Fortsetzen" : "Resume") : (de ? "Pausieren" : "Pause")}</span>{game.phase === "paused" ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}</button>
          <button type="button" onClick={startGame} aria-label={de ? "Neues Spiel starten" : "Start a new game"} className="grid size-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-fuchsia-300 hover:text-fuchsia-700 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-fuchsia-300 dark:hover:text-fuchsia-200"><RotateCcw size={16} aria-hidden="true" /></button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">{status}</p>

      <div className="mt-3 grid gap-3 lg:mt-4 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-4">
        <div className="min-w-0">
          <div className="rounded-[1.6rem] border border-fuchsia-100 bg-[#fff9fc] p-2 shadow-inner shadow-fuchsia-950/[0.035] dark:border-white/10 dark:bg-[#0d1224] dark:shadow-black/20 sm:p-3">
            <div className="relative mx-auto w-full max-w-[15rem] sm:max-w-[18rem]">
              <div role="img" aria-label={de ? `Spielfeld mit 10 Spalten, 20 Reihen. Punktzahl ${game.score}.` : `10-column, 20-row board. Score ${game.score}.`} className="grid aspect-[1/2] grid-cols-10 grid-rows-20 gap-[3px] overflow-hidden rounded-[1.15rem] border border-violet-200 bg-[#f6f2fb] p-2 dark:border-violet-300/20 dark:bg-[#090e1c]">
                {Array.from({ length: STACK_BOARD_WIDTH * STACK_BOARD_HEIGHT }, (_, index) => {
                  const x = index % STACK_BOARD_WIDTH;
                  const y = Math.floor(index / STACK_BOARD_WIDTH);
                  const key = `${x},${y}`;
                  const pieceType = currentCells.get(key) ?? game.board[y][x];
                  const isGhost = !pieceType && landingCells.has(key);
                  const ghostType = isGhost ? game.active?.type : undefined;
                  const fillType = pieceType ?? ghostType;
                  return <span key={key} aria-hidden="true" className={`aspect-square min-w-0 rounded-[3px] border ${fillType ? "border-white/70 shadow-inner shadow-white/20" : "border-slate-200/75 bg-white/70 dark:border-white/[0.045] dark:bg-white/[0.025]"} ${isGhost ? "opacity-25" : ""}`} style={fillType ? { backgroundColor: STACK_PIECE_COLORS[fillType], backgroundImage: pieceType ? "url('/logo.svg')" : undefined, backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "135% auto" } : undefined} />;
                })}
              </div>
              {game.phase !== "playing" && <div className="absolute inset-2 grid place-items-center rounded-[1rem] bg-white/80 p-4 text-center backdrop-blur-sm dark:bg-slate-950/80">
                <div className="max-w-[15rem]">
                  <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-linear-to-br from-fuchsia-500 to-violet-600 text-white shadow-lg shadow-fuchsia-900/20">{game.phase === "over" ? <Trophy size={20} aria-hidden="true" /> : <Sparkles size={20} aria-hidden="true" />}</span>
                  <h2 className="mt-3 text-xl font-black tracking-tight text-slate-950 dark:text-white">{status}</h2>
                  <p className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-300">{game.phase === "paused" ? (de ? "Dein Spielfeld wartet auf dich." : "Your board is waiting for you.") : game.phase === "over" ? (de ? `Du hast ${game.lines} Reihen geschafft.` : `You cleared ${game.lines} lines.`) : (de ? "Fülle Reihen mit VIBE-Logo-Steinen. Jede volle Reihe verschwindet." : "Fit VIBE-logo pieces into rows. Complete rows disappear.")}</p>
                  <button type="button" onClick={game.phase === "paused" ? () => dispatch({ type: "resume" }) : startGame} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#ec4899] to-[#7c4dff] px-4 text-sm font-black text-white shadow-lg shadow-fuchsia-950/15 transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-500">{game.phase === "paused" ? (de ? "Fortsetzen" : "Resume") : game.phase === "over" ? (de ? "Nochmal spielen" : "Play again") : (de ? "VIBE Stack starten" : "Start VIBE Stack")}<Play size={15} fill="currentColor" aria-hidden="true" /></button>
                </div>
              </div>}
            </div>
          </div>

          <div role="group" aria-label={de ? "Touch-Steuerung" : "Touch controls"} className="mx-auto mt-3 grid w-full max-w-[15rem] grid-cols-5 gap-2 sm:max-w-[18rem]">
            <button type="button" onClick={() => move(-1)} disabled={game.phase !== "playing"} aria-label={de ? "Nach links bewegen" : "Move left"} className="grid h-12 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-fuchsia-300 hover:text-fuchsia-700 active:translate-y-0 disabled:opacity-40 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-fuchsia-300"><ArrowLeft size={19} aria-hidden="true" /></button>
            <button type="button" onClick={softDrop} disabled={game.phase !== "playing"} aria-label={de ? "Schneller nach unten" : "Soft drop"} className="grid h-12 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-fuchsia-300 hover:text-fuchsia-700 active:translate-y-0 disabled:opacity-40 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-fuchsia-300"><ArrowDown size={19} aria-hidden="true" /></button>
            <button type="button" onClick={() => move(1)} disabled={game.phase !== "playing"} aria-label={de ? "Nach rechts bewegen" : "Move right"} className="grid h-12 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-fuchsia-300 hover:text-fuchsia-700 active:translate-y-0 disabled:opacity-40 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-fuchsia-300"><ArrowRight size={19} aria-hidden="true" /></button>
            <button type="button" onClick={rotate} disabled={game.phase !== "playing"} aria-label={de ? "Stein drehen" : "Rotate piece"} className="grid h-12 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-fuchsia-300 hover:text-fuchsia-700 active:translate-y-0 disabled:opacity-40 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-fuchsia-300"><RotateCw size={19} aria-hidden="true" /></button>
            <button type="button" onClick={hardDrop} disabled={game.phase !== "playing"} aria-label={de ? "Stein direkt ablegen" : "Hard drop"} className="grid h-12 place-items-center rounded-xl bg-linear-to-br from-fuchsia-500 to-violet-600 text-white shadow-md shadow-fuchsia-950/15 transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:opacity-40"><span className="text-[10px] font-black leading-none">DROP</span></button>
          </div>
          <p className="mt-2 text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400">{de ? "Tastatur: ← → bewegen · ↑ drehen · ↓ schneller · Leertaste ablegen" : "Keyboard: ← → move · ↑ rotate · ↓ soft drop · Space hard drop"}</p>
        </div>

        <aside className="grid grid-cols-2 gap-2.5 lg:grid-cols-1 lg:content-start" aria-label={de ? "Spielstand" : "Game stats"}>
          <div className="col-span-2 flex items-center justify-between rounded-2xl border border-fuchsia-100 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.035] lg:col-span-1">
            <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">{de ? "Als Nächstes" : "Next up"}</p><p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">{de ? "VIBE-Stein" : "VIBE piece"}</p></div>
            <PiecePreview type={game.next} />
          </div>
          {[
            { label: de ? "Punkte" : "Score", value: game.score },
            { label: de ? "Reihen" : "Lines", value: game.lines },
            { label: de ? "Level" : "Level", value: level },
            { label: de ? "Bestwert · Gerät" : "Best · device", value: game.bestScore },
          ].map((stat) => <div key={stat.label} className="rounded-2xl border border-fuchsia-100 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.035]">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className="mt-1 text-xl font-black tabular-nums tracking-tight text-slate-950 dark:text-white">{stat.value.toLocaleString(de ? "de-DE" : "en-US")}</p>
          </div>)}
          <div className="col-span-2 rounded-2xl border border-fuchsia-100 bg-fuchsia-50/80 p-3 text-xs leading-5 text-slate-600 dark:border-fuchsia-300/10 dark:bg-fuchsia-300/[0.045] dark:text-slate-300 lg:col-span-1">
            <p className="font-black text-fuchsia-900 dark:text-fuchsia-100">{de ? "Dein lokaler Lauf" : "Your local run"}</p>
            <p className="mt-1">{de ? "Spielstand und persönlicher Bestwert bleiben auf diesem Gerät. Es gibt keine Online-Rangliste oder Synchronisierung." : "Your run and personal best stay on this device. There is no online leaderboard or syncing."}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
