const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  TRAIL_BOARD_SIZE,
  createInitialTrailGame,
  findTrailFood,
  getTrailTickInterval,
  readTrailBestScore,
  TRAIL_BEST_SCORE_KEY,
  trailGameReducer,
  writeTrailBestScore,
} = require('../src/app/components/games/trailLogic.ts');

test('VIBE Trail starts with a three-logo trail and a collectible outside it', () => {
  const game = createInitialTrailGame(0.4);
  assert.equal(game.phase, 'ready');
  assert.equal(game.snake.length, 3);
  assert.equal(game.direction, 'right');
  assert.ok(game.food);
  assert.equal(game.snake.some((cell) => cell.x === game.food.x && cell.y === game.food.y), false);
});

test('VIBE Trail accepts one perpendicular turn per step and rejects U-turns', () => {
  const started = trailGameReducer(createInitialTrailGame(), { type: 'start', random: 0.5 });
  const reverse = trailGameReducer(started, { type: 'turn', direction: 'left' });
  assert.equal(reverse.direction, 'right');

  const turned = trailGameReducer(started, { type: 'turn', direction: 'up' });
  assert.equal(turned.direction, 'up');
  assert.equal(turned.turnedThisTick, true);
  assert.equal(trailGameReducer(turned, { type: 'turn', direction: 'left' }).direction, 'up');
  assert.equal(trailGameReducer(turned, { type: 'tick', random: 0.5 }).snake[0].y, started.snake[0].y - 1);
});

test('VIBE Trail moves the body and lets the tail leave its previous cell', () => {
  const started = { ...createInitialTrailGame(), phase: 'playing', food: { x: 0, y: 0 } };
  const moved = trailGameReducer(started, { type: 'tick', random: 0.5 });
  assert.deepEqual(moved.snake, [{ x: 8, y: 7 }, { x: 7, y: 7 }, { x: 6, y: 7 }]);
  assert.equal(moved.turnedThisTick, false);

  const loop = {
    ...started,
    direction: 'left',
    snake: [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 3, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  };
  const intoLeavingTail = trailGameReducer(loop, { type: 'tick', random: 0.5 });
  assert.equal(intoLeavingTail.phase, 'playing');
  assert.deepEqual(intoLeavingTail.snake[0], { x: 1, y: 2 });
  assert.equal(intoLeavingTail.snake.length, loop.snake.length);
});

test('collecting the VIBE logo grows the trail, scores, and places a new logo', () => {
  const started = {
    ...createInitialTrailGame(),
    phase: 'playing',
    food: { x: 8, y: 7 },
  };
  const collected = trailGameReducer(started, { type: 'tick', random: 0.7 });
  assert.equal(collected.score, 10);
  assert.equal(collected.snake.length, 4);
  assert.ok(collected.food);
  assert.equal(collected.snake.some((cell) => cell.x === collected.food.x && cell.y === collected.food.y), false);
  assert.ok(getTrailTickInterval(collected.score) < getTrailTickInterval(started.score));
});

test('VIBE Trail ends on a wall or trail collision', () => {
  const started = { ...createInitialTrailGame(), phase: 'playing', food: { x: 0, y: 0 } };
  const atWall = { ...started, snake: [{ x: TRAIL_BOARD_SIZE - 1, y: 4 }, { x: TRAIL_BOARD_SIZE - 2, y: 4 }, { x: TRAIL_BOARD_SIZE - 3, y: 4 }] };
  assert.equal(trailGameReducer(atWall, { type: 'tick', random: 0.5 }).phase, 'over');

  const atTrail = {
    ...started,
    direction: 'down',
    snake: [{ x: 2, y: 2 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }],
  };
  assert.equal(trailGameReducer(atTrail, { type: 'tick', random: 0.5 }).phase, 'over');
});

test('a logo on the tail cell is fatal because eating keeps the tail in place', () => {
  const game = {
    ...createInitialTrailGame(),
    phase: 'playing',
    direction: 'left',
    snake: [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 3, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
    food: { x: 1, y: 2 },
  };
  assert.equal(trailGameReducer(game, { type: 'tick', random: 0.5 }).phase, 'over');
});

test('VIBE Trail finds no collectible on a full board and handles invalid random input safely', () => {
  const fullBoard = Array.from({ length: TRAIL_BOARD_SIZE * TRAIL_BOARD_SIZE }, (_, index) => ({
    x: index % TRAIL_BOARD_SIZE,
    y: Math.floor(index / TRAIL_BOARD_SIZE),
  }));
  assert.equal(findTrailFood(fullBoard, 0.5), null);
  assert.deepEqual(findTrailFood([], Number.NaN), { x: 0, y: 0 });
});

test('VIBE Trail pause/resume and speed fallback remain safe', () => {
  const playing = trailGameReducer(createInitialTrailGame(), { type: 'start', random: 0.3 });
  assert.equal(trailGameReducer(playing, { type: 'pause' }).phase, 'paused');
  assert.equal(trailGameReducer({ ...playing, phase: 'paused' }, { type: 'resume' }).phase, 'playing');
  assert.equal(getTrailTickInterval(10_000), 70);
  assert.equal(getTrailTickInterval(-1), 180);
});

test('VIBE Trail best-score storage has safe read/write fallbacks', () => {
  let storedKey = '';
  let storedValue = '';
  const storage = {
    getItem: (key) => key === TRAIL_BEST_SCORE_KEY ? '145.8' : null,
    setItem: (key, value) => { storedKey = key; storedValue = value; },
  };
  assert.equal(readTrailBestScore(storage), 145);
  writeTrailBestScore(storage, 152.9);
  assert.equal(storedKey, TRAIL_BEST_SCORE_KEY);
  assert.equal(storedValue, '152');

  for (const value of [null, '', 'bad', 'Infinity', '-8']) {
    assert.equal(readTrailBestScore({ ...storage, getItem: () => value }), 0);
  }
  const unavailableStorage = {
    getItem: () => { throw new Error('storage blocked'); },
    setItem: () => { throw new Error('storage full'); },
  };
  assert.equal(readTrailBestScore(unavailableStorage), 0);
  assert.doesNotThrow(() => writeTrailBestScore(unavailableStorage, 20));
});
