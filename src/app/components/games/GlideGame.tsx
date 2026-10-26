"use client";

import { useEffect, useReducer, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { Pause, Play, RotateCcw, Sparkles, Trophy } from "lucide-react";
import useVibeLanguage from "@/app/components/useVibeLanguage";
import {
  createInitialGlideGame,
  glideGameReducer,
  GLIDE_BIRD_RADIUS,
  GLIDE_BIRD_X,
  GLIDE_GROUND_HEIGHT,
  GLIDE_PIPE_WIDTH,
  GLIDE_WORLD_HEIGHT,
  GLIDE_WORLD_WIDTH,
  getGlidePipeSpeed,
  readGlideBestScore,
  writeGlideBestScore,
} from "@/app/components/games/glideLogic";
import type { GlideGameState } from "@/app/components/games/glideLogic";

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawGlideFrame(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, game: GlideGameState, logo: HTMLImageElement | null) {
  if (!canvas.width || !canvas.height) return;
  const dark = document.documentElement.classList.contains("dark");
  ctx.setTransform(canvas.width / GLIDE_WORLD_WIDTH, 0, 0, canvas.height / GLIDE_WORLD_HEIGHT, 0, 0);

  const background = ctx.createLinearGradient(0, 0, GLIDE_WORLD_WIDTH, GLIDE_WORLD_HEIGHT);
  background.addColorStop(0, dark ? "#111126" : "#fff8f5");
  background.addColorStop(0.58, dark ? "#16172c" : "#fff1f0");
  background.addColorStop(1, dark ? "#21142d" : "#f5f1ff");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, GLIDE_WORLD_WIDTH, GLIDE_WORLD_HEIGHT);

  const glow = ctx.createRadialGradient(88, game.birdY, 4, 88, game.birdY, 250);
  glow.addColorStop(0, dark ? "rgba(255,73,136,.25)" : "rgba(255,88,130,.17)");
  glow.addColorStop(1, "rgba(255,88,130,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, GLIDE_WORLD_WIDTH, GLIDE_WORLD_HEIGHT - GLIDE_GROUND_HEIGHT);

  ctx.strokeStyle = dark ? "rgba(255,255,255,.055)" : "rgba(89,55,89,.055)";
  ctx.lineWidth = 1;
  for (let x = 20; x < GLIDE_WORLD_WIDTH; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GLIDE_WORLD_HEIGHT - GLIDE_GROUND_HEIGHT); ctx.stroke();
  }
  for (let y = 18; y < GLIDE_WORLD_HEIGHT - GLIDE_GROUND_HEIGHT; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(GLIDE_WORLD_WIDTH, y); ctx.stroke();
  }

  for (const obstacle of game.obstacles) {
    const gapTop = obstacle.gapCenter - obstacle.gapHeight / 2;
    const gapBottom = obstacle.gapCenter + obstacle.gapHeight / 2;
    const pipe = ctx.createLinearGradient(obstacle.x, 0, obstacle.x + GLIDE_PIPE_WIDTH, 0);
    pipe.addColorStop(0, dark ? "#21b9b4" : "#189e9b");
    pipe.addColorStop(0.5, dark ? "#72e4d2" : "#64cec0");
    pipe.addColorStop(1, dark ? "#4e8bdb" : "#6f7fd0");
    const border = dark ? "rgba(224,255,250,.5)" : "rgba(38,111,122,.45)";
    ctx.save();
    ctx.shadowColor = dark ? "rgba(44,213,205,.23)" : "rgba(34,151,159,.16)";
    ctx.shadowBlur = 17;
    ctx.fillStyle = pipe;
    ctx.strokeStyle = border;
    ctx.lineWidth = 2;
    roundedRect(ctx, obstacle.x + 8, -12, GLIDE_PIPE_WIDTH - 16, gapTop - 5, 12); ctx.fill(); ctx.stroke();
    roundedRect(ctx, obstacle.x, gapTop - 21, GLIDE_PIPE_WIDTH, 23, 10); ctx.fill(); ctx.stroke();
    roundedRect(ctx, obstacle.x + 8, gapBottom + 4, GLIDE_PIPE_WIDTH - 16, GLIDE_WORLD_HEIGHT - GLIDE_GROUND_HEIGHT - gapBottom, 12); ctx.fill(); ctx.stroke();
    roundedRect(ctx, obstacle.x, gapBottom - 2, GLIDE_PIPE_WIDTH, 23, 10); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = dark ? "rgba(255,255,255,.24)" : "rgba(255,255,255,.5)";
    roundedRect(ctx, obstacle.x + 7, gapTop - 17, 4, 14, 3); ctx.fill();
    roundedRect(ctx, obstacle.x + 7, gapBottom + 3, 4, 14, 3); ctx.fill();
  }

  const groundY = GLIDE_WORLD_HEIGHT - GLIDE_GROUND_HEIGHT;
  ctx.fillStyle = dark ? "#17192b" : "#f1e8ef";
  ctx.fillRect(0, groundY, GLIDE_WORLD_WIDTH, GLIDE_GROUND_HEIGHT);
  ctx.fillStyle = dark ? "#ff6a91" : "#e84978";
  ctx.fillRect(0, groundY, GLIDE_WORLD_WIDTH, 4);
  ctx.strokeStyle = dark ? "rgba(255,255,255,.11)" : "rgba(94,53,78,.12)";
  ctx.lineWidth = 1;
  for (let x = -10; x < GLIDE_WORLD_WIDTH + 20; x += 24) {
    ctx.beginPath(); ctx.moveTo(x, groundY + 13); ctx.lineTo(x + 12, groundY + GLIDE_GROUND_HEIGHT); ctx.stroke();
  }

  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "900 30px ui-sans-serif, system-ui, sans-serif";
  ctx.lineJoin = "round";
  ctx.lineWidth = 5;
  ctx.strokeStyle = dark ? "rgba(13,12,29,.75)" : "rgba(255,255,255,.8)";
  ctx.fillStyle = dark ? "#ffffff" : "#282039";
  ctx.strokeText(String(game.score), GLIDE_WORLD_WIDTH / 2, 52);
  ctx.fillText(String(game.score), GLIDE_WORLD_WIDTH / 2, 52);
  ctx.restore();

  ctx.save();
  const tilt = Math.max(-0.42, Math.min(0.58, game.birdVelocity / 700));
  ctx.translate(GLIDE_BIRD_X, game.birdY);
  ctx.rotate(tilt);
  ctx.shadowColor = "rgba(255,71,136,.85)";
  ctx.shadowBlur = 24;
  ctx.fillStyle = dark ? "rgba(255,83,148,.25)" : "rgba(255,83,148,.2)";
  ctx.beginPath(); ctx.ellipse(0, 0, GLIDE_BIRD_RADIUS + 7, GLIDE_BIRD_RADIUS + 5, 0, 0, Math.PI * 2); ctx.fill();
  if (logo?.complete && logo.naturalWidth > 0) ctx.drawImage(logo, -32, -22, 64, 44);
  else {
    ctx.fillStyle = "#ff4c89";
    ctx.beginPath(); ctx.arc(0, 0, GLIDE_BIRD_RADIUS, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export default function GlideGame() {
  const de = useVibeLanguage() === "de";
  const [game, dispatch] = useReducer(glideGameReducer, undefined, () => createInitialGlideGame());
  const gameRef = useRef(game);
  const gameAreaRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef<() => void>(() => {});

  useEffect(() => {
    try {
      dispatch({ type: "restore-best", score: readGlideBestScore(window.localStorage) });
    } catch { /* Local records are optional; the game remains playable without them. */ }
  }, []);

  useEffect(() => {
    if (game.bestScore <= 0) return;
    try { writeGlideBestScore(window.localStorage, game.bestScore); }
    catch { /* Storage access itself can be blocked; gameplay and the current score remain available. */ }
  }, [game.bestScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const logo = new window.Image();
    logo.src = "/logo.svg";
    drawRef.current = () => drawGlideFrame(ctx, canvas, gameRef.current, logo);

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.round(bounds.width * dpr));
      const height = Math.max(1, Math.round(bounds.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      drawRef.current();
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(canvas);
    window.addEventListener("resize", resize, { passive: true });
    const themeObserver = new MutationObserver(() => drawRef.current());
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    logo.onload = () => drawRef.current();
    resize();
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      themeObserver.disconnect();
      drawRef.current = () => {};
    };
  }, []);

  useEffect(() => {
    gameRef.current = game;
    drawRef.current();
  }, [game]);

  useEffect(() => {
    if (game.phase !== "playing") return;
    let previous = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const deltaSeconds = Math.min(0.05, Math.max(0, (now - previous) / 1000));
      previous = now;
      dispatch({ type: "tick", deltaSeconds, random: Math.random() });
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [game.phase]);

  useEffect(() => {
    const pauseWhenHidden = () => { if (document.hidden) dispatch({ type: "pause" }); };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, []);

  const status = game.phase === "ready"
    ? (de ? "Bereit zum Abheben?" : "Ready to take off?")
    : game.phase === "paused"
      ? (de ? "Pause" : "Paused")
      : game.phase === "over"
        ? (de ? "Lauf beendet" : "Flight over")
        : (de ? "Du fliegst" : "Flying");
  const subtitle = game.phase === "ready"
    ? (de ? "Tippe, um abzuheben. Halte das VIBE-Logo zwischen den Hindernissen." : "Tap to take off. Keep the VIBE logo between the obstacles.")
    : game.phase === "paused"
      ? (de ? "Dein Flug wartet auf dich." : "Your flight is waiting for you.")
      : (de ? `Du hast ${game.score} ${game.score === 1 ? "Punkt" : "Punkte"} geschafft.` : `You scored ${game.score} ${game.score === 1 ? "point" : "points"}.`);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest("button, input, textarea, select, [contenteditable='true']")) return;
    const key = event.key.toLowerCase();
    if (event.code === "Space" || event.key === "ArrowUp") {
      event.preventDefault();
      if (game.phase === "ready" || game.phase === "over") dispatch({ type: "start" });
      else if (game.phase === "paused") dispatch({ type: "resume" });
      else if (!event.repeat) dispatch({ type: "flap" });
    } else if (event.key === "Escape" || key === "p") {
      if (game.phase === "playing") dispatch({ type: "pause" });
      else if (game.phase === "paused") dispatch({ type: "resume" });
    }
  };

  const focusGameArea = () => window.requestAnimationFrame(() => gameAreaRef.current?.focus({ preventScroll: true }));
  const startOrResume = () => {
    dispatch({ type: game.phase === "paused" ? "resume" : "start" });
    focusGameArea();
  };
  const startNewFlight = () => {
    dispatch({ type: "start" });
    focusGameArea();
  };
  const statCards = [
    { label: de ? "Punkte" : "Score", value: game.score },
    { label: de ? "Bestwert · Gerät" : "Best · device", value: game.bestScore },
  ];

  return (
    <section aria-label={de ? "VIBE Glide-Spiel" : "VIBE Glide game"} className="mt-2 rounded-[2rem] border border-orange-200/70 bg-white/80 p-3 shadow-xl shadow-orange-950/5 dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/20 sm:p-5 lg:mt-4 lg:p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-orange-800 dark:text-orange-200"><Sparkles size={15} aria-hidden="true" /> VIBE ARCADE</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => dispatch({ type: game.phase === "paused" ? "resume" : "pause" })} disabled={game.phase !== "playing" && game.phase !== "paused"} aria-label={game.phase === "paused" ? (de ? "Fortsetzen" : "Resume") : (de ? "Pausieren" : "Pause")} className="grid size-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-orange-300 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-orange-300 dark:hover:text-orange-200"><span className="sr-only">{game.phase === "paused" ? (de ? "Fortsetzen" : "Resume") : (de ? "Pausieren" : "Pause")}</span>{game.phase === "paused" ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}</button>
          <button type="button" onClick={startNewFlight} aria-label={de ? "Neuen Flug starten" : "Start a new flight"} className="grid size-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-orange-300 hover:text-orange-700 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-orange-300 dark:hover:text-orange-200"><RotateCcw size={16} aria-hidden="true" /></button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">{status}. {de ? `Punkte: ${game.score}. Bestwert: ${game.bestScore}.` : `Score: ${game.score}. Best: ${game.bestScore}.`}</p>

      <div className="mt-3 grid gap-3 sm:mt-4 lg:grid-cols-[minmax(0,1fr)_14rem] lg:gap-5">
        <div className="min-w-0 rounded-[1.6rem] border border-orange-100 bg-[#fff9f8] p-2 shadow-inner shadow-orange-950/[0.035] dark:border-white/10 dark:bg-[#0c1222] dark:shadow-black/20 sm:p-3">
          <div ref={gameAreaRef} className="relative mx-auto w-full max-w-[24rem] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400" style={{ width: "min(100%, 24rem, calc(min(68svh, 36rem) * 0.64286))" }} onKeyDown={handleKeyDown} tabIndex={0} role="group" aria-label={de ? "Flugfeld. Tippe, klicke oder drücke Leertaste zum Flattern." : "Flight field. Tap, click, or press Space to flap."}>
            <canvas ref={canvasRef} aria-hidden="true" className="block aspect-[9/14] w-full overflow-hidden rounded-[1.15rem] border border-orange-200/70 shadow-[0_12px_45px_rgba(133,53,93,.12)] touch-none focus:outline-none dark:border-white/10 dark:shadow-[0_16px_50px_rgba(0,0,0,.35)]" onPointerDown={(event) => {
              if (game.phase === "playing") {
                event.preventDefault();
                event.currentTarget.parentElement?.focus({ preventScroll: true });
                dispatch({ type: "flap" });
              }
            }} />
            {game.phase !== "playing" && <div className="absolute inset-2 grid place-items-center rounded-[1rem] bg-white/78 p-4 text-center backdrop-blur-sm dark:bg-slate-950/72">
              <div className="max-w-[17rem]">
                <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-linear-to-br from-[#ff3881] to-[#ff9b23] text-white shadow-lg shadow-orange-900/20">{game.phase === "over" ? <Trophy size={20} aria-hidden="true" /> : <Sparkles size={20} aria-hidden="true" />}</span>
                <h2 className="mt-3 text-xl font-black tracking-tight text-slate-950 dark:text-white">{status}</h2>
                <p className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-300">{subtitle}</p>
                {game.phase === "over" && <p className="mt-2 text-xs font-black text-orange-800 dark:text-orange-200">{de ? `Punkte: ${game.score} · Bestwert: ${game.bestScore}` : `Score: ${game.score} · Best: ${game.bestScore}`}</p>}
                <button type="button" onClick={startOrResume} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#ff3881] via-[#ff4f52] to-[#ff9b23] px-4 text-sm font-black text-white shadow-lg shadow-orange-950/15 transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500">{game.phase === "paused" ? (de ? "Fortsetzen" : "Resume") : game.phase === "over" ? (de ? "Nochmal fliegen" : "Fly again") : (de ? "VIBE Glide starten" : "Start VIBE Glide")}<Play size={15} fill="currentColor" aria-hidden="true" /></button>
              </div>
            </div>}
          </div>
        </div>

        <aside className="grid grid-cols-2 content-start gap-2.5 lg:grid-cols-1" aria-label={de ? "Spielstand und Steuerung" : "Score and controls"}>
          {statCards.map((stat) => <div key={stat.label} className="rounded-2xl border border-orange-100 bg-white/80 p-2.5 dark:border-white/10 dark:bg-white/[0.035] sm:p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 sm:text-[10px] sm:tracking-[0.12em]">{stat.label}</p>
            <p className="mt-1 text-lg font-black tabular-nums tracking-tight text-slate-950 dark:text-white sm:text-xl">{stat.value.toLocaleString(de ? "de-DE" : "en-US")}</p>
          </div>)}

          <div className="col-span-2 rounded-2xl border border-orange-100 bg-orange-50/80 p-2.5 text-[11px] leading-4 text-slate-600 dark:border-orange-300/10 dark:bg-orange-300/[0.045] dark:text-slate-300 sm:p-3 sm:text-xs sm:leading-5 lg:col-span-1">
            <p className="font-black text-orange-900 dark:text-orange-100">{de ? "Steuerung" : "Controls"}</p>
            <p className="mt-1">{de ? "Tippen oder klicken zum Flattern. Mit Leertaste oder ↑ geht es ebenfalls nach oben; P oder Esc pausiert." : "Tap or click to flap. Space or ↑ also lifts you; P or Esc pauses."}</p>
          </div>

          <p className="col-span-2 rounded-2xl border border-orange-100 bg-orange-50/80 p-2.5 text-[11px] leading-4 text-slate-600 dark:border-orange-300/10 dark:bg-orange-300/[0.045] dark:text-slate-300 sm:p-3 sm:text-xs sm:leading-5 lg:col-span-1">
            <span className="font-black text-orange-900 dark:text-orange-100">{de ? "Dein lokaler Lauf" : "Your local run"}</span><br />
            {de ? "Dein Bestwert bleibt auf diesem Gerät. Es gibt keine Online-Rangliste oder Synchronisierung." : "Your best stays on this device. There is no online leaderboard or syncing."}
          </p>

          <p className="col-span-2 text-center text-[10px] font-semibold text-slate-500 dark:text-slate-400 lg:col-span-1">{de ? `Tempo ${(getGlidePipeSpeed(game.score) / 190).toFixed(1)}× · Lücken werden mit deinem Punktestand enger` : `Speed ${(getGlidePipeSpeed(game.score) / 190).toFixed(1)}× · gaps tighten as your score grows`}</p>
        </aside>
      </div>
    </section>
  );
}
