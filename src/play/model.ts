export type Direction = 'N' | 'E' | 'S' | 'W';
export type Mirror = '/' | '\\';
export type Mirrors = Readonly<Record<string, Mirror>>;
export type PresetName = 'easy' | 'medium' | 'hard';
export type GameMode = 'campaign' | 'random' | 'daily' | 'shared';
export type SavedMode = Exclude<GameMode, 'shared'>;
export function isPresetName(value: unknown): value is PresetName {
  return value === 'easy' || value === 'medium' || value === 'hard';
}
export interface Position {
  x: number;
  y: number;
}
export interface BeamState extends Position {
  dir: Direction;
}
export interface BeamStep extends Position {
  dirIn: Direction;
  dirOut: Direction | null;
}
export interface LevelInput {
  id: string;
  title?: string;
  hint?: string;
  rows: unknown;
}
export interface Level {
  readonly id: string;
  readonly title: string | undefined;
  readonly hint: string | undefined;
  readonly rows: readonly string[];
  readonly w: number;
  readonly h: number;
  readonly source: BeamState;
  readonly target: Position;
  readonly mirrors: Mirrors;
}
interface ShotBase {
  path: BeamStep[];
  end: BeamState;
}
export type Shot = ShotBase &
  (
    | { outcome: 'loop'; loopStart: number }
    | { outcome: 'hit' | 'blocked' | 'escaped'; loopStart: null }
  );
interface SharedState {
  level: Level;
  levelIndex: number;
  mirrors: Mirrors;
  history: Mirrors[];
  shot: Shot | null;
  solved: string[];
}
export type GameState = SharedState &
  (
    | { mode: 'campaign'; preset: null; seed: null }
    | {
        mode: Exclude<GameMode, 'campaign'>;
        preset: PresetName | null;
        seed: string | null;
      }
  );
export type GameAction =
  | { type: 'rotate'; key: string }
  | { type: 'fire' }
  | { type: 'undo' }
  | { type: 'reset' }
  | { type: 'select'; index: number }
  | { type: 'next' }
  | {
      type: 'load';
      mode: Exclude<GameMode, 'campaign'>;
      level: Level;
      preset?: PresetName | null;
      seed?: string | null;
    }
  | { type: 'loaded'; ids: readonly string[] };

export const MAX_WIDTH = 6;
export const DIRS: Readonly<Record<Direction, readonly [number, number]>> = {
  N: [0, -1],
  E: [1, 0],
  S: [0, 1],
  W: [-1, 0],
};
const SOURCES: Readonly<Partial<Record<string, Direction>>> = {
  '>': 'E',
  '<': 'W',
  '^': 'N',
  v: 'S',
};
const REFLECT: Record<Mirror, Record<Direction, Direction>> = {
  '/': { E: 'N', N: 'E', W: 'S', S: 'W' },
  '\\': { E: 'S', S: 'E', W: 'N', N: 'W' },
};
const CELLS = new Set(['.', '#', 'T', '/', '\\', ...Object.keys(SOURCES)]);
export const cellKey = (x: number, y: number): string => `${x},${y}`;
export const flip = (mirror: Mirror): Mirror => (mirror === '/' ? '\\' : '/');
const isMirror = (cell: string): cell is Mirror =>
  cell === '/' || cell === '\\';
export function reflect(mirror: Mirror, dir: Direction): Direction {
  return REFLECT[mirror][dir];
}

export function parseLevel({ id, title, hint, rows }: LevelInput): Level {
  function fail(reason: string): never {
    throw new Error(`Level ${id ?? '?'}: ${reason}`);
  }
  if (!Array.isArray(rows) || !rows.length)
    fail('rows must be a non-empty array');
  const inputRows: unknown[] = rows;
  const firstRow = inputRows[0];
  if (typeof firstRow !== 'string') fail('row 0 must be a string');
  const w = firstRow.length;
  if (!w || w > MAX_WIDTH) fail(`width must be 1–${MAX_WIDTH}, got ${w}`);
  const sources: BeamState[] = [],
    targets: Position[] = [],
    mirrors: Record<string, Mirror> = {},
    validRows: string[] = [];
  for (const [y, row] of inputRows.entries()) {
    if (typeof row !== 'string' || row.length !== w)
      fail(`row ${y} must be ${w} characters`);
    [...row].forEach((c, x) => {
      if (!CELLS.has(c))
        fail(`unknown character "${c}" at row ${y}, column ${x}`);
      const dir = SOURCES[c];
      if (dir) sources.push({ x, y, dir });
      if (c === 'T') targets.push({ x, y });
      if (isMirror(c)) mirrors[cellKey(x, y)] = c;
    });
    validRows.push(row);
  }
  const source = sources[0],
    target = targets[0];
  if (sources.length !== 1 || !source)
    fail(`needs exactly one source, found ${sources.length}`);
  if (targets.length !== 1 || !target)
    fail(`needs exactly one target, found ${targets.length}`);
  return Object.freeze({
    id,
    title,
    hint,
    rows: Object.freeze(validRows),
    w,
    h: validRows.length,
    source,
    target,
    mirrors: Object.freeze(mirrors),
  });
}

export function rotate(mirrors: Mirrors, key: string): Mirrors {
  const mirror = mirrors[key];
  if (mirror === undefined) return mirrors;
  return { ...mirrors, [key]: flip(mirror) };
}

// State (x, y, dir): dir is the direction of travel as the beam enters (x, y).
// Every cell rule is reversible, so a loop always returns to the first state (loopStart 0).
export function trace(level: Level, mirrors: Mirrors): Shot {
  const { w, h, rows, source } = level;
  const path: BeamStep[] = [],
    visited = new Map<string, number>();
  let dir = source.dir,
    x = source.x + DIRS[dir][0],
    y = source.y + DIRS[dir][1];
  const finish = (outcome: 'hit' | 'blocked' | 'escaped'): Shot => ({
    outcome,
    path,
    end: { x, y, dir },
    loopStart: null,
  });
  for (;;) {
    if (x < 0 || y < 0 || x >= w || y >= h) return finish('escaped');
    const state = `${x},${y},${dir}`;
    const loopStart = visited.get(state);
    if (loopStart !== undefined)
      return { outcome: 'loop', path, end: { x, y, dir }, loopStart };
    const cell = mirrors[cellKey(x, y)] ?? rows[y]?.[x];
    if (cell === undefined)
      throw new Error(
        `Level ${level.id}: missing cell at row ${y}, column ${x}`,
      );
    if (cell === '#' || cell === 'T') {
      path.push({ x, y, dirIn: dir, dirOut: null });
      return finish(cell === 'T' ? 'hit' : 'blocked');
    }
    const out = isMirror(cell) ? reflect(cell, dir) : dir;
    visited.set(state, path.length);
    path.push({ x, y, dirIn: dir, dirOut: out });
    dir = out;
    x += DIRS[dir][0];
    y += DIRS[dir][1];
  }
}

function levelAt(levels: readonly Level[], index: number): Level {
  const level = levels[index];
  if (!level) throw new RangeError(`Unknown level index ${index}`);
  return level;
}

export function initialState(
  levels: readonly Level[],
  levelIndex = 0,
  solved: string[] = [],
): GameState {
  const level = levelAt(levels, levelIndex);
  return {
    mode: 'campaign',
    level,
    levelIndex,
    preset: null,
    seed: null,
    mirrors: level.mirrors,
    history: [],
    shot: null,
    solved,
  };
}
export const canUndo = (state: GameState): boolean => state.history.length > 0;
export const canReset = (state: GameState): boolean =>
  state.history.length > 0 || state.shot !== null;
export const allSolved = (
  levels: readonly Level[],
  solved: readonly string[],
): boolean => levels.every((level) => solved.includes(level.id));
export function nextUnsolved(
  levels: readonly Level[],
  solved: readonly string[],
  from: number,
): number | null {
  for (let step = 1; step <= levels.length; step++) {
    const index = (from + step) % levels.length;
    if (!solved.includes(levelAt(levels, index).id)) return index;
  }
  return null;
}

export function createReducer(levels: readonly Level[]) {
  return function reducer(state: GameState, action: GameAction): GameState {
    const { level } = state;
    const actionType = action.type;
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
          state.mode === 'campaign' &&
          shot.outcome === 'hit' &&
          !state.solved.includes(level.id)
            ? [...state.solved, level.id]
            : state.solved;
        return { ...state, shot, solved };
      }
      case 'undo': {
        const previous = state.history.at(-1);
        return previous
          ? {
              ...state,
              mirrors: previous,
              history: state.history.slice(0, -1),
              shot: null,
            }
          : state;
      }
      case 'reset':
        return state.mode === 'campaign'
          ? initialState(levels, state.levelIndex, state.solved)
          : { ...state, mirrors: level.mirrors, history: [], shot: null };
      case 'select':
        return levels[action.index]
          ? initialState(levels, action.index, state.solved)
          : state;
      case 'next': {
        if (state.mode !== 'campaign') return state;
        const index = nextUnsolved(levels, state.solved, state.levelIndex);
        return index === null
          ? state
          : initialState(levels, index, state.solved);
      }
      // Generated and shared puzzles; the page builds the level so the reducer stays pure.
      // levelIndex is kept so returning to the campaign reopens the same level.
      case 'load':
        return {
          ...state,
          mode: action.mode,
          level: action.level,
          preset: action.preset ?? null,
          seed: action.seed ?? null,
          mirrors: action.level.mirrors,
          history: [],
          shot: null,
        };
      case 'loaded':
        return {
          ...state,
          solved: [...new Set([...state.solved, ...action.ids])],
        };
      default:
        throw new Error(`Unknown action ${actionType}`);
    }
  };
}
