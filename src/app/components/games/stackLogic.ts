export const STACK_BOARD_WIDTH = 10;
export const STACK_BOARD_HEIGHT = 20;

export const STACK_PIECES = ["I", "O", "T", "S", "Z", "J", "L"] as const;
export type StackPieceType = (typeof STACK_PIECES)[number];
export type StackBoard = (StackPieceType | null)[][];
export type StackPhase = "ready" | "playing" | "paused" | "over";

export type StackPiece = {
  type: StackPieceType;
  x: number;
  y: number;
  rotation: number;
};

export type StackGameState = {
  board: StackBoard;
  phase: StackPhase;
  active: StackPiece | null;
  next: StackPieceType;
  queue: StackPieceType[];
  lines: number;
  score: number;
  bestScore: number;
};

type StackAction =
  | { type: "start"; bag: StackPieceType[] }
  | { type: "move"; dx: number }
  | { type: "rotate" }
  | { type: "tick"; refill: StackPieceType[] }
  | { type: "soft-drop"; refill: StackPieceType[] }
  | { type: "hard-drop"; refill: StackPieceType[] }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "restore-best"; score: number };

const SHAPES: Record<StackPieceType, readonly (readonly [number, number])[]> = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  O: [[1, 0], [2, 0], [1, 1], [2, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
};

export const STACK_PIECE_COLORS: Record<StackPieceType, string> = {
  I: "#36d5e8",
  O: "#ffbf4a",
  T: "#bb75ff",
  S: "#65e0b3",
  Z: "#ff668b",
  J: "#678cff",
  L: "#ff8e53",
};

export function createStackBoard(): StackBoard {
  return Array.from({ length: STACK_BOARD_HEIGHT }, () => Array<StackPieceType | null>(STACK_BOARD_WIDTH).fill(null));
}

export function createStackPiece(type: StackPieceType, x = 3, y = 0): StackPiece {
  return { type, x, y, rotation: 0 };
}

export function getStackPieceCells(piece: StackPiece): { x: number; y: number }[] {
  return SHAPES[piece.type].map(([startX, startY]) => {
    let x = startX;
    let y = startY;
    for (let turn = 0; turn < piece.rotation % 4; turn += 1) {
      [x, y] = [3 - y, x];
    }
    return { x: piece.x + x, y: piece.y + y };
  });
}

export function canPlaceStackPiece(board: StackBoard, piece: StackPiece): boolean {
  return getStackPieceCells(piece).every(({ x, y }) =>
    x >= 0 && x < STACK_BOARD_WIDTH && y < STACK_BOARD_HEIGHT && (y < 0 || board[y][x] === null),
  );
}

export function rotateStackPiece(board: StackBoard, piece: StackPiece): StackPiece {
  if (piece.type === "O") return piece;
  const rotated = { ...piece, rotation: (piece.rotation + 1) % 4 };
  for (const kick of [0, -1, 1, -2, 2]) {
    const candidate = { ...rotated, x: rotated.x + kick };
    if (canPlaceStackPiece(board, candidate)) return candidate;
  }
  return piece;
}

export function getStackLandingY(board: StackBoard, piece: StackPiece): number {
  let y = piece.y;
  while (canPlaceStackPiece(board, { ...piece, y: y + 1 })) y += 1;
  return y;
}

export function lockStackPiece(board: StackBoard, piece: StackPiece) {
  const cells = getStackPieceCells(piece);
  if (cells.some(({ y }) => y < 0)) return { board, cleared: 0, toppedOut: true };

  const placed = board.map((row) => [...row]);
  for (const { x, y } of cells) placed[y][x] = piece.type;
  const remaining = placed.filter((row) => !row.every(Boolean));
  const cleared = STACK_BOARD_HEIGHT - remaining.length;
  const emptyRows = Array.from({ length: cleared }, () => Array<StackPieceType | null>(STACK_BOARD_WIDTH).fill(null));
  return { board: [...emptyRows, ...remaining], cleared, toppedOut: false };
}

export function createStackBag(random: () => number = Math.random): StackPieceType[] {
  const bag = [...STACK_PIECES];
  for (let index = bag.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.min(index, Math.max(0, Math.floor(random() * (index + 1))));
    [bag[index], bag[swapIndex]] = [bag[swapIndex], bag[index]];
  }
  return bag;
}

export function getStackDropInterval(lines: number): number {
  const level = Math.floor(lines / 10);
  return Math.max(110, 760 - level * 65);
}

export function createInitialStackGame(): StackGameState {
  return {
    board: createStackBoard(),
    phase: "ready",
    active: null,
    next: "T",
    queue: [],
    lines: 0,
    score: 0,
    bestScore: 0,
  };
}

function settleStackPiece(state: StackGameState, piece: StackPiece, refill: StackPieceType[], dropBonus = 0): StackGameState {
  const locked = lockStackPiece(state.board, piece);
  if (locked.toppedOut) return { ...state, phase: "over", active: null };

  const linePoints = [0, 100, 300, 500, 800];
  const levelMultiplier = Math.floor(state.lines / 10) + 1;
  const score = state.score + dropBonus + (linePoints[locked.cleared] ?? 800 + (locked.cleared - 4) * 300) * levelMultiplier;
  const lines = state.lines + locked.cleared;
  const upcoming = [...state.queue];
  if (upcoming.length === 0) upcoming.push(...refill);
  const active = createStackPiece(state.next);
  const next = upcoming[0] ?? state.next;
  const queue = upcoming.length > 0 ? upcoming.slice(1) : [];
  const toppedOut = !canPlaceStackPiece(locked.board, active);

  return {
    ...state,
    board: locked.board,
    phase: toppedOut ? "over" : "playing",
    active: toppedOut ? null : active,
    next,
    queue,
    lines,
    score,
    bestScore: Math.max(state.bestScore, score),
  };
}

export function stackGameReducer(state: StackGameState, action: StackAction): StackGameState {
  if (action.type === "restore-best") return { ...state, bestScore: Math.max(state.bestScore, Math.max(0, action.score)) };
  if (action.type === "start") {
    if (action.bag.length < 2) return state;
    const [first, next, ...queue] = action.bag;
    const active = createStackPiece(first);
    return {
      ...state,
      board: createStackBoard(),
      phase: "playing",
      active,
      next,
      queue,
      lines: 0,
      score: 0,
    };
  }
  if (action.type === "pause") return state.phase === "playing" ? { ...state, phase: "paused" } : state;
  if (action.type === "resume") return state.phase === "paused" ? { ...state, phase: "playing" } : state;
  if (state.phase !== "playing" || !state.active) return state;

  if (action.type === "move") {
    const candidate = { ...state.active, x: state.active.x + action.dx };
    return canPlaceStackPiece(state.board, candidate) ? { ...state, active: candidate } : state;
  }
  if (action.type === "rotate") return { ...state, active: rotateStackPiece(state.board, state.active) };
  if (action.type === "tick" || action.type === "soft-drop") {
    const candidate = { ...state.active, y: state.active.y + 1 };
    if (canPlaceStackPiece(state.board, candidate)) {
      return { ...state, active: candidate, score: state.score + (action.type === "soft-drop" ? 1 : 0) };
    }
    return settleStackPiece(state, state.active, action.refill);
  }
  if (action.type === "hard-drop") {
    const landingY = getStackLandingY(state.board, state.active);
    return settleStackPiece(state, { ...state.active, y: landingY }, action.refill, (landingY - state.active.y) * 2);
  }
  return state;
}
