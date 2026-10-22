export const MAX_WIDTH = 6;
export const DIRS = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const SOURCES = { '>': 'E', '<': 'W', '^': 'N', v: 'S' };
const REFLECT = {
  '/': { E: 'N', N: 'E', W: 'S', S: 'W' },
  '\\': { E: 'S', S: 'E', W: 'N', N: 'W' },
};
const CELLS = new Set(['.', '#', 'T', '/', '\\', ...Object.keys(SOURCES)]);
export const cellKey = (x, y) => `${x},${y}`;
export const flip = (mirror) => (mirror === '/' ? '\\' : '/');
export function reflect(mirror, dir) {
  return REFLECT[mirror][dir];
}

export function parseLevel({ id, title, hint, rows }) {
  const fail = (reason) => {
    throw new Error(`Level ${id ?? '?'}: ${reason}`);
  };
  if (!Array.isArray(rows) || !rows.length)
    fail('rows must be a non-empty array');
  const w = rows[0].length;
  if (!w || w > MAX_WIDTH) fail(`width must be 1–${MAX_WIDTH}, got ${w}`);
  const sources = [],
    targets = [],
    mirrors = {};
  rows.forEach((row, y) => {
    if (typeof row !== 'string' || row.length !== w)
      fail(`row ${y} must be ${w} characters`);
    [...row].forEach((c, x) => {
      if (!CELLS.has(c))
        fail(`unknown character "${c}" at row ${y}, column ${x}`);
      if (c in SOURCES) sources.push({ x, y, dir: SOURCES[c] });
      if (c === 'T') targets.push({ x, y });
      if (c in REFLECT) mirrors[cellKey(x, y)] = c;
    });
  });
  if (sources.length !== 1)
    fail(`needs exactly one source, found ${sources.length}`);
  if (targets.length !== 1)
    fail(`needs exactly one target, found ${targets.length}`);
  return Object.freeze({
    id,
    title,
    hint,
    rows: Object.freeze([...rows]),
    w,
    h: rows.length,
    source: sources[0],
    target: targets[0],
    mirrors: Object.freeze(mirrors),
  });
}

export function rotate(mirrors, key) {
  if (!(key in mirrors)) return mirrors;
  return { ...mirrors, [key]: flip(mirrors[key]) };
}

// State (x, y, dir): dir is the direction of travel as the beam enters (x, y).
// Every cell rule is reversible, so a loop always returns to the first state (loopStart 0).
export function trace(level, mirrors) {
  const { w, h, rows, source } = level;
  const path = [],
    visited = new Map();
  let dir = source.dir,
    x = source.x + DIRS[dir][0],
    y = source.y + DIRS[dir][1];
  const finish = (outcome, loopStart = null) => ({
    outcome,
    path,
    end: { x, y, dir },
    loopStart,
  });
  for (;;) {
    if (x < 0 || y < 0 || x >= w || y >= h) return finish('escaped');
    const state = `${x},${y},${dir}`;
    if (visited.has(state)) return finish('loop', visited.get(state));
    const cell = mirrors[cellKey(x, y)] ?? rows[y][x];
    if (cell === '#' || cell === 'T') {
      path.push({ x, y, dirIn: dir, dirOut: null });
      return finish(cell === 'T' ? 'hit' : 'blocked');
    }
    const out = cell in REFLECT ? REFLECT[cell][dir] : dir;
    visited.set(state, path.length);
    path.push({ x, y, dirIn: dir, dirOut: out });
    dir = out;
    x += DIRS[dir][0];
    y += DIRS[dir][1];
  }
}

export const initialState = (levels, levelIndex = 0, solved = []) => ({
  levelIndex,
  mirrors: levels[levelIndex].mirrors,
  history: [],
  shot: null,
  solved,
});
export const canUndo = (state) => state.history.length > 0;
export const canReset = (state) =>
  state.history.length > 0 || state.shot !== null;
export const allSolved = (levels, solved) =>
  levels.every((level) => solved.includes(level.id));
export function nextUnsolved(levels, solved, from) {
  for (let step = 1; step <= levels.length; step++) {
    const index = (from + step) % levels.length;
    if (!solved.includes(levels[index].id)) return index;
  }
  return null;
}

export function createReducer(levels) {
  return function reducer(state, action) {
    const level = levels[state.levelIndex];
    switch (action.type) {
      case 'rotate': {
        if (!(action.key in state.mirrors)) return state;
        return {
          ...state,
          mirrors: rotate(state.mirrors, action.key),
          history: [...state.history, state.mirrors],
          shot: null,
        };
      }
      case 'fire': {
        const shot = trace(level, state.mirrors);
        const solved =
          shot.outcome === 'hit' && !state.solved.includes(level.id)
            ? [...state.solved, level.id]
            : state.solved;
        return { ...state, shot, solved };
      }
      case 'undo':
        return canUndo(state)
          ? {
              ...state,
              mirrors: state.history.at(-1),
              history: state.history.slice(0, -1),
              shot: null,
            }
          : state;
      case 'reset':
        return initialState(levels, state.levelIndex, state.solved);
      case 'select':
        return levels[action.index]
          ? initialState(levels, action.index, state.solved)
          : state;
      case 'next': {
        const index = nextUnsolved(levels, state.solved, state.levelIndex);
        return index === null
          ? state
          : initialState(levels, index, state.solved);
      }
      case 'loaded':
        return {
          ...state,
          solved: [...new Set([...state.solved, ...action.ids])],
        };
      default:
        throw new Error(`Unknown action ${action.type}`);
    }
  };
}
