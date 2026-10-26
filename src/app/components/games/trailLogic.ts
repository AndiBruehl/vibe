export const TRAIL_BOARD_SIZE = 15;
export const TRAIL_SCORE_PER_LOGO = 10;
export const TRAIL_BEST_SCORE_KEY = "vibe-trail-best-v1";

export type TrailDirection = "up" | "right" | "down" | "left";
export type TrailPhase = "ready" | "playing" | "paused" | "over" | "won";
export type TrailPosition = { x: number; y: number };
export type TrailScoreStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

export type TrailGameState = {
  phase: TrailPhase;
  snake: TrailPosition[];
  direction: TrailDirection;
  food: TrailPosition | null;
  score: number;
  bestScore: number;
  turnedThisTick: boolean;
};

export type TrailAction =
  | { type: "start"; random: number }
  | { type: "turn"; direction: TrailDirection }
  | { type: "tick"; random: number }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "restore-best"; score: number };

export function readTrailBestScore(storage: TrailScoreStorage): number {
  try {
    const saved = Number(storage.getItem(TRAIL_BEST_SCORE_KEY));
    return Number.isFinite(saved) && saved > 0 ? Math.floor(saved) : 0;
  } catch {
    return 0;
  }
}

export function writeTrailBestScore(storage: TrailScoreStorage, score: number): void {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
  try {
    storage.setItem(TRAIL_BEST_SCORE_KEY, String(safeScore));
  } catch { /* A device-local best score is optional. */ }
}

function initialSnake(): TrailPosition[] {
  const middle = Math.floor(TRAIL_BOARD_SIZE / 2);
  return [{ x: middle, y: middle }, { x: middle - 1, y: middle }, { x: middle - 2, y: middle }];
}

export function findTrailFood(snake: TrailPosition[], random: number): TrailPosition | null {
  const occupied = new Set(snake.map(({ x, y }) => `${x},${y}`));
  const free: TrailPosition[] = [];
  for (let y = 0; y < TRAIL_BOARD_SIZE; y += 1) {
    for (let x = 0; x < TRAIL_BOARD_SIZE; x += 1) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  const safeRandom = Number.isFinite(random) ? Math.min(0.999999999, Math.max(0, random)) : 0;
  return free[Math.floor(safeRandom * free.length)];
}

export function createInitialTrailGame(random = 0.5): TrailGameState {
  const snake = initialSnake();
  return {
    phase: "ready",
    snake,
    direction: "right",
    food: findTrailFood(snake, random),
    score: 0,
    bestScore: 0,
    turnedThisTick: false,
  };
}

export function getTrailTickInterval(score: number): number {
  return Math.max(70, 180 - Math.floor(Math.max(0, score) / TRAIL_SCORE_PER_LOGO) * 14);
}

function stepHead(head: TrailPosition, direction: TrailDirection): TrailPosition {
  if (direction === "up") return { x: head.x, y: head.y - 1 };
  if (direction === "right") return { x: head.x + 1, y: head.y };
  if (direction === "down") return { x: head.x, y: head.y + 1 };
  return { x: head.x - 1, y: head.y };
}

function samePosition(a: TrailPosition, b: TrailPosition): boolean {
  return a.x === b.x && a.y === b.y;
}

function isOpposite(a: TrailDirection, b: TrailDirection): boolean {
  return (a === "up" && b === "down") || (a === "down" && b === "up") || (a === "left" && b === "right") || (a === "right" && b === "left");
}

export function trailGameReducer(state: TrailGameState, action: TrailAction): TrailGameState {
  if (action.type === "restore-best") return { ...state, bestScore: Math.max(state.bestScore, Math.max(0, Math.floor(action.score))) };
  if (action.type === "start") return { ...createInitialTrailGame(action.random), phase: "playing", bestScore: state.bestScore };
  if (action.type === "pause") return state.phase === "playing" ? { ...state, phase: "paused" } : state;
  if (action.type === "resume") return state.phase === "paused" ? { ...state, phase: "playing" } : state;
  if (state.phase !== "playing") return state;

  if (action.type === "turn") {
    const changesAxis = (state.direction === "up" || state.direction === "down") !== (action.direction === "up" || action.direction === "down");
    if (state.turnedThisTick || isOpposite(state.direction, action.direction) || !changesAxis) return state;
    return { ...state, direction: action.direction, turnedThisTick: true };
  }

  if (action.type === "tick") {
    const head = stepHead(state.snake[0], state.direction);
    const eating = state.food !== null && samePosition(head, state.food);
    const blockingTrail = eating ? state.snake : state.snake.slice(0, -1);
    const hitWall = head.x < 0 || head.x >= TRAIL_BOARD_SIZE || head.y < 0 || head.y >= TRAIL_BOARD_SIZE;
    const hitTrail = blockingTrail.some((segment) => samePosition(head, segment));
    if (hitWall || hitTrail) return { ...state, phase: "over", turnedThisTick: false };

    const snake = [head, ...(eating ? state.snake : state.snake.slice(0, -1))];
    const score = state.score + (eating ? TRAIL_SCORE_PER_LOGO : 0);
    const food = eating ? findTrailFood(snake, action.random) : state.food;
    return {
      ...state,
      phase: eating && food === null ? "won" : "playing",
      snake,
      food,
      score,
      bestScore: Math.max(state.bestScore, score),
      turnedThisTick: false,
    };
  }

  return state;
}
