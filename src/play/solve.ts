import { trace, flip } from './model.ts';
import type { Level } from './model.ts';
export const MAX_SOLVER_MIRRORS = 8;
// Rotations are toggles and commute, so the fewest rotations is the fewest mirrors that differ from the start.
export function layouts(level: Level) {
  const keys = Object.keys(level.mirrors);
  if (keys.length > MAX_SOLVER_MIRRORS)
    throw new Error(`${level.id}: ${keys.length} mirrors exceeds solver limit`);
  return Array.from({ length: 2 ** keys.length }, (_, mask) => {
    const mirrors = { ...level.mirrors };
    keys.forEach((key, i) => {
      const mirror = mirrors[key];
      if (mirror === undefined) throw new Error(`Missing mirror ${key}`);
      if (mask & (1 << i)) mirrors[key] = flip(mirror);
    });
    return {
      mirrors,
      rotations: keys.filter((_, i) => mask & (1 << i)).length,
    };
  });
}
export function solve(level: Level) {
  const solutions = layouts(level).filter(
    ({ mirrors }) => trace(level, mirrors).outcome === 'hit',
  );
  if (!solutions.length) return null;
  const best = solutions.reduce((a, b) => (b.rotations < a.rotations ? b : a));
  return {
    rotations: best.rotations,
    mirrors: best.mirrors,
    solutions: solutions.length,
  };
}
export const hasLoop = (level: Level) =>
  layouts(level).some(
    ({ mirrors }) => trace(level, mirrors).outcome === 'loop',
  );
// Counts distinct beam routes, not layouts: a mirror the beam never touches can face either way without changing the route.
export function routes(level: Level) {
  const seen = new Set();
  for (const { mirrors } of layouts(level)) {
    const shot = trace(level, mirrors);
    if (shot.outcome === 'hit')
      seen.add(shot.path.map(({ x, y }) => `${x},${y}`).join(' '));
  }
  return seen.size;
}
export function reachable(level: Level) {
  const touched = new Set();
  for (const { mirrors } of layouts(level))
    for (const { x, y } of trace(level, mirrors).path) touched.add(`${x},${y}`);
  return Object.keys(level.mirrors).every((key) => touched.has(key));
}
