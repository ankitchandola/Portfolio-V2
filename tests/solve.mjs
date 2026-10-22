import {trace, flip} from '../src/play/model.js';
export const MAX_SOLVER_MIRRORS = 8;
// Rotations are toggles and commute, so the fewest rotations is the fewest mirrors that differ from the start.
export function layouts(level) {
  const keys = Object.keys(level.mirrors);
  if (keys.length > MAX_SOLVER_MIRRORS) throw new Error(`${level.id}: ${keys.length} mirrors exceeds solver limit`);
  return Array.from({length: 2 ** keys.length}, (_, mask) => {
    const mirrors = {...level.mirrors};
    keys.forEach((key, i) => { if (mask & (1 << i)) mirrors[key] = flip(mirrors[key]); });
    return {mirrors, rotations: keys.filter((_, i) => mask & (1 << i)).length};
  });
}
export function solve(level) {
  const solutions = layouts(level).filter(({mirrors}) => trace(level, mirrors).outcome === 'hit');
  if (!solutions.length) return null;
  const best = solutions.reduce((a, b) => b.rotations < a.rotations ? b : a);
  return {rotations: best.rotations, mirrors: best.mirrors, solutions: solutions.length};
}
export const hasLoop = level => layouts(level).some(({mirrors}) => trace(level, mirrors).outcome === 'loop');
