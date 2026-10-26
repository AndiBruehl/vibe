export const STACK_BOARD_WIDTH = 10;
export const STACK_BOARD_HEIGHT = 20;
export const STACK_LOCK_DELAY_MS = 480;

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
  hold: StackPieceType | null;
  canHold: boolean;
  lines: number;
  score: number;
  bestScore: number;
  groundedTicks: number;
  lastActionWasRotation: boolean;
  backToBack: boolean;
};

type StackAction =
  | { type: "start"; bag: StackPieceType[] }
  | { type: "move"; dx: number }
  | { type: "rotate"; direction?: 1 | -1 }
  | { type: "hold"; refill: StackPieceType[] }
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

type KickOffset = readonly [number, number];

// SRS tables converted to board coordinates (positive Y points down).
const JLSTZ_KICKS: Record<string, readonly KickOffset[]> = {
  "0>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "1>2": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "2>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "3>0": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "0>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "3>2": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "2>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "1>0": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

const I_KICKS: Record<string, readonly KickOffset[]> = {
  "0>1": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "1>2": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  "2>3": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  "3>0": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "0>3": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  "3>2": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  "2>1": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  "1>0": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
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

export function rotateStackPiece(board: StackBoard, piece: StackPiece, direction: 1 | -1 = 1): StackPiece {
  if (piece.type === "O") return piece;
  const from = piece.rotation;
  const to = (from + direction + 4) % 4;
  const kicks = (piece.type === "I" ? I_KICKS : JLSTZ_KICKS)[`${from}>${to}`];
  for (const [dx, dy] of kicks) {
    const candidate = { ...piece, rotation: to, x: piece.x + dx, y: piece.y + dy };
    if (canPlaceStackPiece(board, candidate)) return candidate;
  }
  return piece;
}

export function isStackTSpin(board: StackBoard, piece: StackPiece, lastActionWasRotation: boolean): boolean {
  if (piece.type !== "T" || !lastActionWasRotation) return false;
  const pivotX = piece.x + 1;
  const pivotY = piece.y + 1;
  const corners: KickOffset[] = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  const occupiedCorners = corners.filter(([dx, dy]) => {
    const x = pivotX + dx;
    const y = pivotY + dy;
    return x < 0 || x >= STACK_BOARD_WIDTH || y < 0 || y >= STACK_BOARD_HEIGHT || board[y]?.[x] !== null;
  });
  return occupiedCorners.length >= 3;
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
    hold: null,
    canHold: true,
    lines: 0,
    score: 0,
    bestScore: 0,
    groundedTicks: 0,
    lastActionWasRotation: false,
    backToBack: false,
  };
}

function takeNextPiece(state: StackGameState, refill: StackPieceType[]) {
  const safeFallback = STACK_PIECES.filter((piece) => piece !== state.next);
  const upcoming = state.queue.length > 0
    ? [...state.queue]
    : refill.length > 0
      ? [...refill]
      : safeFallback;
  return {
    active: createStackPiece(state.next),
    next: upcoming.shift() ?? state.next,
    queue: upcoming,
  };
}

function settleStackPiece(state: StackGameState, piece: StackPiece, refill: StackPieceType[], dropBonus = 0): StackGameState {
  const locked = lockStackPiece(state.board, piece);
  if (locked.toppedOut) return { ...state, phase: "over", active: null, groundedTicks: 0, lastActionWasRotation: false };

  const spun = isStackTSpin(state.board, piece, state.lastActionWasRotation);
  const linePoints = [0, 100, 300, 500, 800];
  const spinPoints = [400, 800, 1200, 1600];
  const levelMultiplier = Math.floor(state.lines / 10) + 1;
  const basePoints = spun ? (spinPoints[locked.cleared] ?? 1600) : (linePoints[locked.cleared] ?? 800 + (locked.cleared - 4) * 300);
  const difficultClear = locked.cleared === 4 || (spun && locked.cleared > 0);
  const backToBackBonus = state.backToBack && difficultClear ? Math.floor(basePoints * 0.5) : 0;
  const score = state.score + (dropBonus + basePoints + backToBackBonus) * levelMultiplier;
  const lines = state.lines + locked.cleared;
  const upcoming = takeNextPiece(state, refill);
  const active = upcoming.active;
  const toppedOut = !canPlaceStackPiece(locked.board, active);

  return {
    ...state,
    board: locked.board,
    phase: toppedOut ? "over" : "playing",
    active: toppedOut ? null : active,
    next: upcoming.next,
    queue: upcoming.queue,
    canHold: true,
    lines,
    score,
    bestScore: Math.max(state.bestScore, score),
    groundedTicks: 0,
    lastActionWasRotation: false,
    backToBack: difficultClear ? true : locked.cleared > 0 ? false : state.backToBack,
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
      hold: null,
      canHold: true,
      lines: 0,
      score: 0,
      groundedTicks: 0,
      lastActionWasRotation: false,
      backToBack: false,
    };
  }
  if (action.type === "pause") return state.phase === "playing" ? { ...state, phase: "paused" } : state;
  if (action.type === "resume") return state.phase === "paused" ? { ...state, phase: "playing" } : state;
  if (state.phase !== "playing" || !state.active) return state;

  if (action.type === "hold") {
    if (!state.canHold) return state;
    let incoming: StackPiece;
    let next = state.next;
    let queue = state.queue;
    if (state.hold) {
      incoming = createStackPiece(state.hold);
    } else {
      const drawn = takeNextPiece(state, action.refill);
      incoming = drawn.active;
      next = drawn.next;
      queue = drawn.queue;
    }
    const toppedOut = !canPlaceStackPiece(state.board, incoming);
    return {
      ...state,
      active: toppedOut ? null : incoming,
      phase: toppedOut ? "over" : "playing",
      next,
      queue,
      hold: state.active.type,
      canHold: false,
      groundedTicks: 0,
      lastActionWasRotation: false,
    };
  }

  if (action.type === "move") {
    const candidate = { ...state.active, x: state.active.x + action.dx };
    if (!canPlaceStackPiece(state.board, candidate)) return state;
    const grounded = !canPlaceStackPiece(state.board, { ...candidate, y: candidate.y + 1 });
    return { ...state, active: candidate, groundedTicks: grounded ? 1 : 0, lastActionWasRotation: false };
  }
  if (action.type === "rotate") {
    const candidate = rotateStackPiece(state.board, state.active, action.direction ?? 1);
    if (candidate === state.active) return state;
    const grounded = !canPlaceStackPiece(state.board, { ...candidate, y: candidate.y + 1 });
    return { ...state, active: candidate, groundedTicks: grounded ? 1 : 0, lastActionWasRotation: true };
  }
  if (action.type === "tick" || action.type === "soft-drop") {
    const candidate = { ...state.active, y: state.active.y + 1 };
    if (canPlaceStackPiece(state.board, candidate)) {
      const grounded = !canPlaceStackPiece(state.board, { ...candidate, y: candidate.y + 1 });
      const levelMultiplier = Math.floor(state.lines / 10) + 1;
      return { ...state, active: candidate, groundedTicks: grounded ? 1 : 0, score: state.score + (action.type === "soft-drop" ? levelMultiplier : 0), lastActionWasRotation: false };
    }
    if (state.groundedTicks === 0) return { ...state, groundedTicks: 1 };
    if (action.type === "soft-drop") return state;
    return settleStackPiece(state, state.active, action.refill);
  }
  if (action.type === "hard-drop") {
    const landingY = getStackLandingY(state.board, state.active);
    return settleStackPiece(state, { ...state.active, y: landingY }, action.refill, (landingY - state.active.y) * 2);
  }
  return state;
}
