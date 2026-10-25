export const REFLEX_ROUND_COUNT = 5;

export function getReflexSummary(timesMs: number[]) {
  if (timesMs.length === 0) return null;
  return {
    averageMs: Math.round(timesMs.reduce((total, time) => total + time, 0) / timesMs.length),
    fastestMs: Math.min(...timesMs),
  };
}
