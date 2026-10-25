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
  getStackLandingY,
  lockStackPiece,
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
  const after = stackGameReducer(game, { type: 'tick', refill: ['I', 'O', 'J'] });
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

test('VIBE Stack refills the seven-piece queue only when it runs out', () => {
  const game = {
    ...stackGameReducer(createInitialStackGame(), { type: 'start', bag: ['O', 'I'] }),
    queue: [],
  };
  const after = stackGameReducer(game, { type: 'hard-drop', refill: ['J', 'L', 'S', 'Z', 'T', 'I', 'O'] });
  assert.equal(after.next, 'J');
  assert.deepEqual(after.queue, ['L', 'S', 'Z', 'T', 'I', 'O']);
});

test('VIBE Stack pauses, resumes and ends after a blocked spawn', () => {
  const started = stackGameReducer(createInitialStackGame(), { type: 'start', bag: ['O', 'O', 'T', 'S', 'Z', 'J', 'L'] });
  const paused = stackGameReducer(started, { type: 'pause' });
  assert.equal(paused.phase, 'paused');
  assert.equal(stackGameReducer(paused, { type: 'resume' }).phase, 'playing');

  const board = createStackBoard();
  board[0][4] = 'J';
  const nearTopOut = { ...started, board, active: createStackPiece('O', 3, STACK_BOARD_HEIGHT - 2) };
  const over = stackGameReducer(nearTopOut, { type: 'tick', refill: ['I', 'T', 'S'] });
  assert.equal(over.phase, 'over');
  assert.equal(over.active, null);
});
