const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  STACK_BOARD_HEIGHT,
  STACK_BOARD_WIDTH,
  STACK_PIECES,
  canPlaceStackPiece,
  createInitialStackGame,
  createStackBag,
  createStackBoard,
  createStackPiece,
  getStackDropInterval,
  getStackLandingY,
  rotateStackPiece,
  stackGameReducer,
} = require('../src/app/components/games/stackLogic.ts');

test('VIBE Stack starts with a clean 10 by 20 board and a fair seven-piece bag', () => {
  const game = createInitialStackGame();
  assert.equal(game.board.length, STACK_BOARD_HEIGHT);
  assert.ok(game.board.every((row) => row.length === STACK_BOARD_WIDTH && row.every((cell) => cell === null)));
  assert.deepEqual([...createStackBag(() => 0.5)].sort(), [...STACK_PIECES].sort());
});

test('VIBE Stack prevents wall collisions and rotates with a wall kick', () => {
  const board = createStackBoard();
  const atRightEdge = createStackPiece('T', 7, 0);
  assert.equal(canPlaceStackPiece(board, atRightEdge), true);
  const rotated = rotateStackPiece(board, atRightEdge);
  assert.equal(rotated.rotation, 1);
  assert.equal(canPlaceStackPiece(board, rotated), true);
  assert.ok(rotated.x < atRightEdge.x);
  assert.equal(canPlaceStackPiece(board, createStackPiece('I', -1, 0)), false);
});

test('VIBE Stack keeps square logo pieces aligned when rotated', () => {
  const piece = createStackPiece('O', 3, 4);
  assert.deepEqual(rotateStackPiece(createStackBoard(), piece), piece);
});

test('VIBE Stack lets a piece slide off an overhang and fall into the open gap', () => {
  const board = createStackBoard();
  board[10][4] = 'J';
  const game = {
    ...createInitialStackGame(),
    phase: 'playing',
    board,
    active: createStackPiece('O', 2, 8),
  };

  const lockDelay = stackGameReducer(game, { type: 'tick', refill: ['I', 'T', 'S'] });
  assert.equal(lockDelay.active.x, 2);
  assert.equal(lockDelay.active.y, 8);
  assert.equal(lockDelay.groundedTicks, 1);

  const shiftedUnderOverhang = stackGameReducer(lockDelay, { type: 'move', dx: -1 });
  assert.equal(shiftedUnderOverhang.active.x, 1);
  assert.equal(shiftedUnderOverhang.groundedTicks, 0);
  assert.equal(canPlaceStackPiece(board, { ...shiftedUnderOverhang.active, y: 9 }), true);

  const descended = stackGameReducer(shiftedUnderOverhang, { type: 'tick', refill: ['I', 'T', 'S'] });
  assert.equal(descended.active.y, 9);
});

test('VIBE Stack lets the four-cell I piece dock below the three-cell-wide stack', () => {
  const board = createStackBoard();
  board[16][1] = 'T';
  for (let x = 0; x < 3; x += 1) board[17][x] = 'T';
  for (let y = 18; y < STACK_BOARD_HEIGHT; y += 1) {
    board[y][0] = 'O';
    board[y][1] = 'O';
  }
  const game = {
    ...createInitialStackGame(),
    phase: 'playing',
    board,
    active: createStackPiece('I', 2, 12),
  };

  assert.equal(getStackLandingY(board, game.active), 15, 'the stack blocks the I piece while it overlaps column 2');
  const movedRight = stackGameReducer(game, { type: 'move', dx: 1 });
  assert.equal(getStackLandingY(board, movedRight.active), 18, 'one clear move lets the I piece drop below the stack');
  const dropped = stackGameReducer(movedRight, { type: 'hard-drop', refill: ['T', 'S', 'Z'] });
  assert.deepEqual(dropped.board[STACK_BOARD_HEIGHT - 1].slice(3, 7), ['I', 'I', 'I', 'I']);
});

test('VIBE Stack can move the I piece under an overhang after it falls beside it', () => {
  const board = createStackBoard();
  for (let x = 3; x < 6; x += 1) board[15][x] = 'T';
  let game = {
    ...createInitialStackGame(),
    phase: 'playing',
    board,
    active: createStackPiece('I', 6, 8),
  };

  while (game.active.y < 15) game = stackGameReducer(game, { type: 'tick', refill: ['T', 'S', 'Z'] });
  assert.equal(game.active.y, 15, 'the I piece first falls beside the three-cell overhang');
  for (let step = 0; step < 3; step += 1) game = stackGameReducer(game, { type: 'move', dx: -1 });
  assert.equal(game.active.x, 3, 'after passing below the overhang, it can slide left underneath');

  const dropped = stackGameReducer(game, { type: 'hard-drop', refill: ['T', 'S', 'Z'] });
  assert.deepEqual(dropped.board[STACK_BOARD_HEIGHT - 1].slice(3, 7), ['I', 'I', 'I', 'I']);
});

test('VIBE Stack lets the I piece move left through empty rows above a three-cell stack', () => {
  const board = createStackBoard();
  for (let x = 3; x < 6; x += 1) board[15][x] = 'T';
  const game = {
    ...createInitialStackGame(),
    phase: 'playing',
    board,
    active: createStackPiece('I', 6, 8),
  };

  let moved = game;
  for (let step = 0; step < 3; step += 1) moved = stackGameReducer(moved, { type: 'move', dx: -1 });
  assert.equal(moved.active.x, 3);
  assert.equal(getStackLandingY(board, moved.active), 13, 'the stack affects landing height, not movement through empty rows above');
});

test('VIBE Stack never tunnels through occupied cells while moving toward a gap', () => {
  const board = createStackBoard();
  board[8][7] = 'S';
  board[9][7] = 'S';
  const game = {
    ...createInitialStackGame(),
    phase: 'playing',
    board,
    active: createStackPiece('Z', 4, 6),
  };
  const horizontalMove = { ...game.active, x: game.active.x + 1 };
  assert.equal(canPlaceStackPiece(board, horizontalMove), true);
  assert.equal(canPlaceStackPiece(board, { ...horizontalMove, y: horizontalMove.y + 1 }), false);

  const tucked = stackGameReducer(game, { type: 'move', dx: 1 });
  assert.equal(tucked.active.x, 5);
  assert.equal(tucked.active.y, 6);
  assert.ok(canPlaceStackPiece(board, tucked.active));
  assert.equal(canPlaceStackPiece(board, { ...tucked.active, y: tucked.active.y + 1 }), false);
});

test('VIBE Stack supports clockwise, counter-clockwise and floor-kick rotations', () => {
  const board = createStackBoard();
  const piece = createStackPiece('T', 3, 18);
  const clockwise = rotateStackPiece(board, piece, 1);
  assert.equal(clockwise.rotation, 1);
  assert.equal(clockwise.y, 17, 'the third SRS kick moves the piece one cell up from the floor');
  const wallKick = rotateStackPiece(board, createStackPiece('T', 7, 5), 1);
  assert.equal(wallKick.rotation, 1);
  assert.equal(wallKick.x, 6, 'the SRS wall kick moves the rotated piece one cell left');
  const counterClockwise = rotateStackPiece(board, createStackPiece('T', 3, 0), -1);
  assert.equal(counterClockwise.rotation, 3);
  assert.ok(canPlaceStackPiece(board, counterClockwise));
});

test('VIBE Stack fall speed increases with the level and has a playable minimum', () => {
  assert.ok(getStackDropInterval(10) < getStackDropInterval(0));
  assert.equal(getStackDropInterval(100), 110);
});

test('VIBE Stack clears a completed row and awards line points', () => {
  const board = createStackBoard();
  for (let x = 0; x < STACK_BOARD_WIDTH; x += 1) if (x < 3 || x > 6) board[STACK_BOARD_HEIGHT - 1][x] = 'J';
  const game = {
    ...createInitialStackGame(),
    phase: 'playing',
    board,
    active: createStackPiece('I', 3, STACK_BOARD_HEIGHT - 2),
    next: 'T',
    queue: ['S', 'Z', 'L'],
  };
  const waitingToLock = stackGameReducer(game, { type: 'tick', refill: ['I', 'O', 'J'] });
  const after = stackGameReducer(waitingToLock, { type: 'tick', refill: ['I', 'O', 'J'] });
  assert.equal(after.lines, 1);
  assert.equal(after.score, 100);
  assert.ok(after.board[0].every((cell) => cell === null));
  assert.equal(after.phase, 'playing');
});

test('VIBE Stack hard-drops, scores locally, and advances its next piece', () => {
  const game = stackGameReducer(createInitialStackGame(), { type: 'start', bag: ['O', 'I', 'T', 'S', 'Z', 'J', 'L'] });
  const after = stackGameReducer(game, { type: 'hard-drop', refill: ['J', 'L', 'S'] });
  assert.equal(after.phase, 'playing');
  assert.equal(after.active.type, 'I');
  assert.equal(after.queue.length, 4);
  assert.ok(after.score > 0);
  assert.ok(after.bestScore >= after.score);
  assert.ok(after.board[STACK_BOARD_HEIGHT - 1].some((cell) => cell === 'O'));
  assert.ok(canPlaceStackPiece(after.board, after.active));
  assert.equal(getStackLandingY(after.board, after.active) >= after.active.y, true);
});

test('VIBE Stack supports one hold per piece and resets hold after locking', () => {
  const started = stackGameReducer(createInitialStackGame(), { type: 'start', bag: ['O', 'I', 'T', 'S', 'Z', 'J', 'L'] });
  const held = stackGameReducer(started, { type: 'hold', refill: ['L', 'J', 'Z'] });
  assert.equal(held.hold, 'O');
  assert.equal(held.active.type, 'I');
  assert.equal(held.next, 'T');
  assert.equal(held.canHold, false);
  assert.deepEqual(stackGameReducer(held, { type: 'hold', refill: ['L', 'J', 'Z'] }), held);

  const locked = stackGameReducer(held, { type: 'hard-drop', refill: ['L', 'J', 'Z'] });
  assert.equal(locked.canHold, true);
  const swapped = stackGameReducer(locked, { type: 'hold', refill: ['L', 'J', 'Z'] });
  assert.equal(swapped.hold, 'T');
  assert.equal(swapped.active.type, 'O');
  assert.equal(swapped.canHold, false);
});

test('VIBE Stack awards T-spin and back-to-back Tetris scoring', () => {
  const spinBoard = createStackBoard();
  spinBoard[17][3] = 'J';
  spinBoard[17][5] = 'J';
  spinBoard[19][3] = 'J';
  const spinGame = {
    ...createInitialStackGame(),
    phase: 'playing',
    board: spinBoard,
    active: createStackPiece('T', 3, 17),
    next: 'I',
    queue: ['O', 'Z'],
    lastActionWasRotation: true,
  };
  const spinWaiting = stackGameReducer(spinGame, { type: 'tick', refill: ['S', 'L'] });
  const spinScored = stackGameReducer(spinWaiting, { type: 'tick', refill: ['S', 'L'] });
  assert.equal(spinScored.score, 400);

  const tetrisBoard = createStackBoard();
  for (let y = STACK_BOARD_HEIGHT - 4; y < STACK_BOARD_HEIGHT; y += 1) {
    for (let x = 0; x < STACK_BOARD_WIDTH; x += 1) if (x !== 3) tetrisBoard[y][x] = 'J';
  }
  const tetrisGame = {
    ...createInitialStackGame(),
    phase: 'playing',
    board: tetrisBoard,
    active: { ...createStackPiece('I', 1, STACK_BOARD_HEIGHT - 4), rotation: 1 },
    next: 'T',
    queue: ['O', 'Z'],
    backToBack: true,
  };
  const scored = stackGameReducer(tetrisGame, { type: 'hard-drop', refill: ['S', 'L'] });
  assert.equal(scored.lines, 4);
  assert.equal(scored.score, 1200);
  assert.equal(scored.backToBack, true);
});

test('VIBE Stack refills the seven-piece queue only when it runs out', () => {
  const game = {
    ...stackGameReducer(createInitialStackGame(), { type: 'start', bag: ['O', 'I'] }),
    queue: [],
  };
  const after = stackGameReducer(game, { type: 'hard-drop', refill: ['J', 'L', 'S', 'Z', 'T', 'I', 'O'] });
  assert.equal(after.next, 'J');
  assert.deepEqual(after.queue, ['L', 'S', 'Z', 'T', 'I', 'O']);
});

test('VIBE Stack recovers with a complete piece bag if an empty queue has no refill', () => {
  const game = {
    ...stackGameReducer(createInitialStackGame(), { type: 'start', bag: ['O', 'I'] }),
    queue: [],
  };
  const after = stackGameReducer(game, { type: 'hard-drop', refill: [] });
  assert.equal(after.active.type, 'I');
  assert.equal(after.next, STACK_PIECES[1]);
  assert.deepEqual(after.queue, STACK_PIECES.slice(2));
});

test('VIBE Stack pauses, resumes and ends after a blocked spawn', () => {
  const started = stackGameReducer(createInitialStackGame(), { type: 'start', bag: ['O', 'O', 'T', 'S', 'Z', 'J', 'L'] });
  const paused = stackGameReducer(started, { type: 'pause' });
  assert.equal(paused.phase, 'paused');
  assert.equal(stackGameReducer(paused, { type: 'resume' }).phase, 'playing');

  const board = createStackBoard();
  board[0][4] = 'J';
  const nearTopOut = { ...started, board, active: createStackPiece('O', 3, STACK_BOARD_HEIGHT - 2) };
  const waitingToLock = stackGameReducer(nearTopOut, { type: 'tick', refill: ['I', 'T', 'S'] });
  const over = stackGameReducer(waitingToLock, { type: 'tick', refill: ['I', 'T', 'S'] });
  assert.equal(over.phase, 'over');
  assert.equal(over.active, null);
});
