const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  createInitialGlideGame,
  getGlideGapHeight,
  getGlidePipeSpeed,
  glideGameReducer,
  GLIDE_BEST_SCORE_KEY,
  GLIDE_BIRD_X,
  GLIDE_PIPE_WIDTH,
  readGlideBestScore,
  writeGlideBestScore,
} = require('../src/app/components/games/glideLogic.ts');

test('VIBE Glide starts ready with the VIBE bird and a safe first obstacle', () => {
  const game = createInitialGlideGame(12.9);
  assert.equal(game.phase, 'ready');
  assert.equal(game.bestScore, 12);
  assert.equal(game.obstacles.length, 1);
  assert.ok(game.obstacles[0].x > GLIDE_BIRD_X + GLIDE_PIPE_WIDTH);
});

test('a new run flaps upward, and subsequent taps reset upward velocity', () => {
  const started = glideGameReducer(createInitialGlideGame(8), { type: 'start' });
  assert.equal(started.phase, 'playing');
  assert.ok(started.birdVelocity < 0);
  const falling = glideGameReducer(started, { type: 'tick', deltaSeconds: 0.1, random: 0.5 });
  assert.ok(falling.birdVelocity > started.birdVelocity);
  const flapped = glideGameReducer(falling, { type: 'flap' });
  assert.ok(flapped.birdVelocity < 0);
  assert.equal(flapped.bestScore, 8);
});

test('passing an obstacle scores once and updates the device best', () => {
  const game = {
    ...createInitialGlideGame(),
    phase: 'playing',
    birdY: 280,
    birdVelocity: 0,
    obstacles: [{ id: 1, x: 29, gapCenter: 280, gapHeight: 200, passed: false }],
  };
  const passed = glideGameReducer(game, { type: 'tick', deltaSeconds: 0.01, random: 0.5 });
  assert.equal(passed.score, 1);
  assert.equal(passed.bestScore, 1);
  const again = glideGameReducer(passed, { type: 'tick', deltaSeconds: 0.01, random: 0.5 });
  assert.equal(again.score, 1);
});

test('VIBE Glide ends on pipe, ceiling, or floor collisions', () => {
  const base = { ...createInitialGlideGame(), phase: 'playing', birdY: 300, birdVelocity: 0 };
  const pipeHit = glideGameReducer({
    ...base,
    obstacles: [{ id: 1, x: 80, gapCenter: 190, gapHeight: 130, passed: false }],
  }, { type: 'tick', deltaSeconds: 0.01, random: 0.5 });
  assert.equal(pipeHit.phase, 'over');

  const ceilingHit = glideGameReducer({ ...base, birdY: 17, obstacles: [] }, { type: 'tick', deltaSeconds: 0.01, random: 0.5 });
  assert.equal(ceilingHit.phase, 'over');

  const floorHit = glideGameReducer({ ...base, birdY: 520, obstacles: [] }, { type: 'tick', deltaSeconds: 0.01, random: 0.5 });
  assert.equal(floorHit.phase, 'over');
});

test('pause/resume works and paused flight does not advance', () => {
  const playing = glideGameReducer(createInitialGlideGame(), { type: 'start' });
  const paused = glideGameReducer(playing, { type: 'pause' });
  assert.equal(paused.phase, 'paused');
  assert.equal(glideGameReducer(paused, { type: 'tick', deltaSeconds: 0.05, random: 0.2 }), paused);
  assert.equal(glideGameReducer(paused, { type: 'resume' }).phase, 'playing');
});

test('speed and gap difficulty increase safely with score', () => {
  assert.equal(getGlidePipeSpeed(-1), 190);
  assert.ok(getGlidePipeSpeed(10) > getGlidePipeSpeed(0));
  assert.equal(getGlideGapHeight(0), 166);
  assert.equal(getGlideGapHeight(100), 132);
  assert.ok(getGlideGapHeight(100) >= 132);
});

test('best-score storage is optional and safely handles invalid or blocked storage', () => {
  let key = '';
  let value = '';
  const storage = {
    getItem: (requestedKey) => requestedKey === GLIDE_BEST_SCORE_KEY ? '42.8' : null,
    setItem: (nextKey, nextValue) => { key = nextKey; value = nextValue; },
  };
  assert.equal(readGlideBestScore(storage), 42);
  writeGlideBestScore(storage, 51.9);
  assert.equal(key, GLIDE_BEST_SCORE_KEY);
  assert.equal(value, '51');
  for (const invalid of [null, '', 'bad', 'Infinity', '-3']) {
    assert.equal(readGlideBestScore({ ...storage, getItem: () => invalid }), 0);
  }
  const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('full'); } };
  assert.equal(readGlideBestScore(blocked), 0);
  assert.doesNotThrow(() => writeGlideBestScore(blocked, 7));
});
