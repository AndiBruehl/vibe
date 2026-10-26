export const GLIDE_WORLD_WIDTH = 360;
export const GLIDE_WORLD_HEIGHT = 560;
export const GLIDE_GROUND_HEIGHT = 34;
export const GLIDE_BIRD_X = 94;
export const GLIDE_BIRD_RADIUS = 18;
export const GLIDE_PIPE_WIDTH = 62;
export const GLIDE_BEST_SCORE_KEY = "vibe-glide-best-v1";

const GRAVITY = 1180;
const FLAP_VELOCITY = -365;
const MIN_GAP_HEIGHT = 132;
const INITIAL_GAP_HEIGHT = 166;
const PIPE_SPAWN_DISTANCE = 270;

export type GlidePhase = "ready" | "playing" | "paused" | "over";
export type GlideObstacle = {
  id: number;
  x: number;
  gapCenter: number;
  gapHeight: number;
  passed: boolean;
};
export type GlideGameState = {
  phase: GlidePhase;
  birdY: number;
  birdVelocity: number;
  obstacles: GlideObstacle[];
  score: number;
  bestScore: number;
};
export type GlideStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};
export type GlideAction =
  | { type: "start" }
  | { type: "flap" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "restore-best"; score: number }
  | { type: "tick"; deltaSeconds: number; random: number };

function clampRandom(random: number): number {
  return Number.isFinite(random) ? Math.min(0.999999, Math.max(0, random)) : 0;
}

export function getGlidePipeSpeed(score: number): number {
  return Math.min(330, 190 + Math.max(0, Math.floor(score)) * 5);
}

export function getGlideGapHeight(score: number): number {
  return Math.max(MIN_GAP_HEIGHT, INITIAL_GAP_HEIGHT - Math.floor(Math.max(0, score) / 5) * 5);
}

export function createInitialGlideGame(bestScore = 0): GlideGameState {
  return {
    phase: "ready",
    birdY: GLIDE_WORLD_HEIGHT * 0.48,
    birdVelocity: 0,
    obstacles: [{ id: 0, x: GLIDE_WORLD_WIDTH + 34, gapCenter: 286, gapHeight: INITIAL_GAP_HEIGHT, passed: false }],
    score: 0,
    bestScore: Number.isFinite(bestScore) ? Math.max(0, Math.floor(bestScore)) : 0,
  };
}

export function readGlideBestScore(storage: GlideStorage): number {
  try {
    const score = Number(storage.getItem(GLIDE_BEST_SCORE_KEY));
    return Number.isFinite(score) && score > 0 ? Math.floor(score) : 0;
  } catch {
    return 0;
  }
}

export function writeGlideBestScore(storage: GlideStorage, score: number): void {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
  try {
    storage.setItem(GLIDE_BEST_SCORE_KEY, String(safeScore));
  } catch { /* A device-local best score is optional. */ }
}

function makeObstacle(id: number, x: number, score: number, random: number): GlideObstacle {
  const gapHeight = getGlideGapHeight(score);
  const minCenter = gapHeight / 2 + 44;
  const maxCenter = GLIDE_WORLD_HEIGHT - GLIDE_GROUND_HEIGHT - gapHeight / 2 - 44;
  return {
    id,
    x,
    gapCenter: minCenter + clampRandom(random) * (maxCenter - minCenter),
    gapHeight,
    passed: false,
  };
}

export function glideGameReducer(state: GlideGameState, action: GlideAction): GlideGameState {
  if (action.type === "restore-best") {
    const score = Number.isFinite(action.score) ? Math.max(0, Math.floor(action.score)) : 0;
    return { ...state, bestScore: Math.max(state.bestScore, score) };
  }
  if (action.type === "start") return { ...createInitialGlideGame(state.bestScore), phase: "playing", birdVelocity: FLAP_VELOCITY };
  if (action.type === "pause") return state.phase === "playing" ? { ...state, phase: "paused" } : state;
  if (action.type === "resume") return state.phase === "paused" ? { ...state, phase: "playing" } : state;
  if (action.type === "flap") return state.phase === "playing" ? { ...state, birdVelocity: FLAP_VELOCITY } : state;
  if (state.phase !== "playing") return state;

  const delta = Number.isFinite(action.deltaSeconds) ? Math.min(0.05, Math.max(0, action.deltaSeconds)) : 0;
  if (delta === 0) return state;

  const birdVelocity = state.birdVelocity + GRAVITY * delta;
  const birdY = state.birdY + state.birdVelocity * delta + 0.5 * GRAVITY * delta * delta;
  const speed = getGlidePipeSpeed(state.score);
  let score = state.score;
  const obstacles = state.obstacles.map((obstacle) => {
    const x = obstacle.x - speed * delta;
    const passed = obstacle.passed || x + GLIDE_PIPE_WIDTH < GLIDE_BIRD_X;
    if (!obstacle.passed && passed) score += 1;
    return { ...obstacle, x, passed };
  }).filter((obstacle) => obstacle.x + GLIDE_PIPE_WIDTH >= -8);

  let nextId = Math.max(0, ...obstacles.map((obstacle) => obstacle.id)) + 1;
  while (obstacles.length === 0 || obstacles[obstacles.length - 1].x < GLIDE_WORLD_WIDTH - PIPE_SPAWN_DISTANCE) {
    const last = obstacles[obstacles.length - 1];
    obstacles.push(makeObstacle(nextId, last ? last.x + PIPE_SPAWN_DISTANCE : GLIDE_WORLD_WIDTH + 34, score, action.random));
    nextId += 1;
  }

  const hitBounds = birdY - GLIDE_BIRD_RADIUS <= 0 || birdY + GLIDE_BIRD_RADIUS >= GLIDE_WORLD_HEIGHT - GLIDE_GROUND_HEIGHT;
  const hitObstacle = obstacles.some((obstacle) => {
    const overlapsBird = obstacle.x < GLIDE_BIRD_X + GLIDE_BIRD_RADIUS && obstacle.x + GLIDE_PIPE_WIDTH > GLIDE_BIRD_X - GLIDE_BIRD_RADIUS;
    if (!overlapsBird) return false;
    const gapTop = obstacle.gapCenter - obstacle.gapHeight / 2;
    const gapBottom = obstacle.gapCenter + obstacle.gapHeight / 2;
    return birdY - GLIDE_BIRD_RADIUS < gapTop || birdY + GLIDE_BIRD_RADIUS > gapBottom;
  });

  return {
    ...state,
    phase: hitBounds || hitObstacle ? "over" : "playing",
    birdY,
    birdVelocity,
    obstacles,
    score,
    bestScore: Math.max(state.bestScore, score),
  };
}
