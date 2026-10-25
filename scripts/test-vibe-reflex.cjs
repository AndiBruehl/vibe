const { test } = require("node:test");
const assert = require("node:assert/strict");
const { getReflexSummary, REFLEX_ROUND_COUNT } = require("../src/app/components/games/reflexLogic.ts");

test("VIBE Reflex is a five-round run and reports average and fastest response", () => {
  assert.equal(REFLEX_ROUND_COUNT, 5);
  assert.deepEqual(getReflexSummary([198, 230, 184, 202, 190]), {
    averageMs: 201,
    fastestMs: 184,
  });
});

test("VIBE Reflex has no result before the first round", () => {
  assert.equal(getReflexSummary([]), null);
});
