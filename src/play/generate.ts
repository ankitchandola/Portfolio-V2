import { parseLevel, trace, flip, DIRS, MAX_WIDTH } from './model.ts';
import type {
  BeamStep,
  Direction,
  Level,
  Mirror,
  Position,
  PresetName,
} from './model.ts';
import { layouts, MAX_SOLVER_MIRRORS } from './solve.ts';
import { mulberry32, hashSeed } from './random.ts';

export interface GeneratorConstraints {
  readonly w: number;
  readonly h: number;
  readonly turns: number;
  readonly decoys: number;
  readonly walls: number;
  readonly scramble: number;
  readonly rotations: { readonly min: number; readonly max: number };
  readonly loopTrap?: boolean | 'prefer';
  readonly maxAttempts?: number;
}

// Part of every hashed seed: bump it whenever a change would alter the level a seed produces.
export const GENERATOR_VERSION = 1;
export const MAX_HEIGHT = 8;
const PREFER_LOOP_ATTEMPTS = 40;
export const PRESETS: Readonly<Record<PresetName, GeneratorConstraints>> =
  Object.freeze({
    easy: Object.freeze({
      w: 6,
      h: 5,
      turns: 2,
      decoys: 1,
      walls: 3,
      scramble: 2,
      rotations: { min: 2, max: 2 },
    }),
    medium: Object.freeze({
      w: 6,
      h: 6,
      turns: 4,
      decoys: 2,
      walls: 4,
      scramble: 3,
      rotations: { min: 3, max: 3 },
    }),
    hard: Object.freeze({
      w: 6,
      h: 8,
      turns: 5,
      decoys: 3,
      walls: 5,
      scramble: 5,
      rotations: { min: 4, max: 8 },
      loopTrap: 'prefer',
    }),
  });

const SOURCE_FOR: Readonly<Record<Direction, string>> = {
  E: '>',
  W: '<',
  N: '^',
  S: 'v',
};
const TURN: Readonly<Partial<Record<string, Mirror>>> = {
  EN: '/',
  NE: '/',
  WS: '/',
  SW: '/',
  ES: '\\',
  SE: '\\',
  WN: '\\',
  NW: '\\',
};
const perpendicular = (dir: Direction): readonly [Direction, Direction] =>
  dir === 'E' || dir === 'W' ? ['N', 'S'] : ['E', 'W'];
const NUMBER_WORDS = [
  'No',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
];

export function validateConstraints(c: GeneratorConstraints): void {
  function fail(reason: string): never {
    throw new Error(`Invalid generator constraints: ${reason}`);
  }
  const whole = (value: unknown, min: number, max: number): value is number =>
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max;
  if (!whole(c.w, 3, MAX_WIDTH)) fail(`w must be 3–${MAX_WIDTH}`);
  if (!whole(c.h, 3, MAX_HEIGHT)) fail(`h must be 3–${MAX_HEIGHT}`);
  if (!whole(c.turns, 1, MAX_SOLVER_MIRRORS)) fail('turns must be at least 1');
  if (!whole(c.decoys, 0, MAX_SOLVER_MIRRORS)) fail('decoys must be 0 or more');
  if (!whole(c.walls, 0, c.w * c.h)) fail('walls out of range');
  if (c.turns + c.decoys > MAX_SOLVER_MIRRORS)
    fail(`turns + decoys must be at most ${MAX_SOLVER_MIRRORS}`);
  if (!whole(c.scramble, 1, c.turns)) fail('scramble must be 1–turns');
  const { min, max } = c.rotations ?? {};
  if (
    !whole(min, 1, MAX_SOLVER_MIRRORS) ||
    !whole(max, min, MAX_SOLVER_MIRRORS)
  )
    fail('rotations must be {min, max} with 1 ≤ min ≤ max');
  if (min > c.scramble) fail('rotations.min cannot exceed scramble');
  if (![undefined, false, true, 'prefer'].includes(c.loopTrap))
    fail("loopTrap must be true, false or 'prefer'");
}

// Builds the solution route first, then hides it by flipping `scramble` of its mirrors.
function build(random: () => number, c: GeneratorConstraints): string[] | null {
  const int = (n: number) => Math.floor(random() * n);
  const pick = <T>(items: readonly T[]): T => {
    const item = items[int(items.length)];
    if (item === undefined)
      throw new Error('Cannot pick from an empty generator list');
    return item;
  };
  const grid = Array.from({ length: c.h }, () =>
    Array.from({ length: c.w }, () => '.'),
  );
  const setCell = (x: number, y: number, value: string) => {
    const row = grid[y];
    if (!row || row[x] === undefined)
      throw new RangeError(`Generator cell ${x},${y} is outside the grid`);
    row[x] = value;
  };
  const used = new Set<string>();
  type Turn = Position & { wrong: Direction };
  const route: Turn[] = [];
  const inside = (fx: number, fy: number) =>
    fx >= 0 && fy >= 0 && fx < c.w && fy < c.h;
  const room = (fx: number, fy: number, d: Direction) => {
    let n = 0;
    for (
      let cx = fx + DIRS[d][0], cy = fy + DIRS[d][1];
      inside(cx, cy) && !used.has(`${cx},${cy}`);
      cx += DIRS[d][0], cy += DIRS[d][1]
    )
      n++;
    return n;
  };
  let x = int(c.w),
    y = int(c.h);
  used.add(`${x},${y}`);
  const directions: readonly Direction[] = ['N', 'E', 'S', 'W'];
  const starts = directions.filter((d) => room(x, y, d) >= 2);
  if (!starts.length) return null;
  let dir = pick(starts);
  setCell(x, y, SOURCE_FOR[dir]);
  for (let made = 0; ; made++) {
    const run = 1 + int(room(x, y, dir));
    for (let step = 0; step < run; step++) {
      x += DIRS[dir][0];
      y += DIRS[dir][1];
      used.add(`${x},${y}`);
    }
    if (made === c.turns) {
      setCell(x, y, 'T');
      break;
    }
    const [a, b] = perpendicular(dir);
    const open = [a, b].filter((d) => room(x, y, d) > 0);
    if (!open.length) return null;
    const next = pick(open);
    const mirror = TURN[dir + next];
    if (!mirror) throw new Error(`Invalid generator turn ${dir}${next}`);
    setCell(x, y, mirror);
    route.push({ x, y, wrong: next === a ? b : a });
    dir = next;
  }
  const empty = (fx: number, fy: number) =>
    fx >= 0 &&
    fy >= 0 &&
    fx < c.w &&
    fy < c.h &&
    grid[fy]?.[fx] === '.' &&
    !used.has(`${fx},${fy}`);
  for (let i = 0, placed = 0; i < c.decoys * 6 && placed < c.decoys; i++) {
    const turn = pick(route);
    const distance = 1 + int(3);
    const fx = turn.x + DIRS[turn.wrong][0] * distance,
      fy = turn.y + DIRS[turn.wrong][1] * distance;
    if (empty(fx, fy)) {
      setCell(fx, fy, random() < 0.5 ? '/' : '\\');
      placed++;
    }
  }
  for (let i = 0, placed = 0; i < c.walls * 4 && placed < c.walls; i++) {
    const fx = int(c.w),
      fy = int(c.h);
    if (empty(fx, fy)) {
      setCell(fx, fy, '#');
      placed++;
    }
  }
  const shuffled = route
    .map((turn): [number, Turn] => [random(), turn])
    .sort((p, q) => p[0] - q[0]);
  for (const [, turn] of shuffled.slice(0, c.scramble)) {
    const mirror = grid[turn.y]?.[turn.x];
    if (mirror !== '/' && mirror !== '\\')
      throw new Error(`Missing generator mirror ${turn.x},${turn.y}`);
    setCell(turn.x, turn.y, flip(mirror));
  }
  return grid.map((row) => row.join(''));
}

// One pass over every layout: minimum rotations, distinct solution routes, reachability and loops.
export function analyse(level: Level) {
  const touched = new Set<string>(),
    solutionRoutes = new Map<string, readonly BeamStep[]>();
  let min: number | null = null,
    loops = false;
  for (const { mirrors, rotations } of layouts(level)) {
    const shot = trace(level, mirrors);
    for (const { x, y } of shot.path) touched.add(`${x},${y}`);
    if (shot.outcome === 'loop') loops = true;
    if (shot.outcome === 'hit') {
      solutionRoutes.set(
        shot.path.map(({ x, y }) => `${x},${y}`).join(' '),
        shot.path,
      );
      if (min === null || rotations < min) min = rotations;
    }
  }
  const firstRoute = solutionRoutes.values().next();
  return {
    min,
    routes: solutionRoutes.size,
    route:
      solutionRoutes.size === 1 && !firstRoute.done ? firstRoute.value : null,
    reachable: Object.keys(level.mirrors).every((key) => touched.has(key)),
    loops,
    startsSolved: trace(level, level.mirrors).outcome === 'hit',
  };
}

function longestEmptyRun(lines: readonly string[]): number {
  let longest = 0,
    run = 0;
  for (const line of lines) {
    run = /^\.+$/.test(line) ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  return longest;
}

export function meetsQuality(
  level: Level,
  route: readonly Position[],
): boolean {
  const columns = new Set(route.map(({ x }) => x)),
    rows = new Set(route.map(({ y }) => y));
  const transposed = Array.from({ length: level.w }, (_, x) =>
    level.rows.map((row) => row[x]).join(''),
  );
  return (
    columns.size >= Math.min(4, level.w) &&
    rows.size >= level.h - 2 &&
    route.length >= level.w + level.h - 2 &&
    longestEmptyRun(level.rows) <= 2 &&
    longestEmptyRun(transposed) <= 2
  );
}

export const hintFor = (rotations: number): string =>
  `${NUMBER_WORDS[rotations] ?? rotations} ${rotations === 1 ? 'turn' : 'turns'} will solve it.`;

export function generateLevel(
  seed: string,
  constraints: GeneratorConstraints,
): Level | null {
  validateConstraints(constraints);
  const random = mulberry32(hashSeed(`v${GENERATOR_VERSION}:${seed}`));
  const maxAttempts = constraints.maxAttempts ?? 200;
  // A required loop trap is rare (about 1% of Hard attempts), so 'prefer' only asks for one early on.
  const wantsLoop = (attempt: number) =>
    constraints.loopTrap === true ||
    (constraints.loopTrap === 'prefer' && attempt < PREFER_LOOP_ATTEMPTS);
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const rows = build(random, constraints);
    if (!rows) continue;
    const level = parseLevel({
      id: `generated:${seed}`,
      title: 'Generated puzzle',
      rows,
    });
    const result = analyse(level);
    const { min, max } = constraints.rotations;
    if (
      result.min === null ||
      result.min < min ||
      result.min > max ||
      result.startsSolved ||
      // Without a decoy every mirror on the board is wrong, and the puzzle is just 'flip them all'.
      (constraints.decoys > 0 &&
        Object.keys(level.mirrors).length === constraints.turns) ||
      result.routes !== 1 ||
      !result.route ||
      !result.reachable ||
      (wantsLoop(attempt) && !result.loops) ||
      !meetsQuality(level, result.route)
    )
      continue;
    return parseLevel({ ...level, hint: hintFor(result.min) });
  }
  return null;
}

// Retries with derived seeds so a seed always yields a level, deterministically.
export function generatePuzzle(
  seed: string,
  constraints: GeneratorConstraints,
  tries = 5,
): Level | null {
  for (let i = 0; i < tries; i++) {
    const level = generateLevel(i ? `${seed}/${i}` : seed, constraints);
    if (level) return level;
  }
  return null;
}

export const dailySeed = (date: Date): string =>
  `daily:${date.toISOString().slice(0, 10)}`;

const ENCODE: Readonly<Record<string, string>> = {
  '.': '.',
  '#': 'x',
  T: 't',
  '/': 'f',
  '\\': 'b',
  '>': 'e',
  '<': 'w',
  '^': 'n',
  v: 's',
};
const DECODE: Readonly<Partial<Record<string, string>>> = Object.fromEntries(
  Object.entries(ENCODE).map(([cell, letter]): [string, string] => [
    letter,
    cell,
  ]),
);
const MAX_ENCODED = MAX_HEIGHT * (MAX_WIDTH + 1);

export const encodeLevel = (level: Level): string =>
  level.rows
    .map((row) => [...row].map((cell) => ENCODE[cell]).join(''))
    .join('-');

// Share links are untrusted input: anything malformed, too large or unsolvable decodes to null.
export function decodeLevel(text: unknown): Level | null {
  if (typeof text !== 'string' || !text || text.length > MAX_ENCODED)
    return null;
  const rows = text.split('-');
  if (rows.length > MAX_HEIGHT) return null;
  const decoded = rows.map((row) =>
    [...row].map((letter) => DECODE[letter] ?? '?').join(''),
  );
  if (decoded.some((row) => row.includes('?'))) return null;
  try {
    const level = parseLevel({
      id: `shared:${text}`,
      title: 'Shared puzzle',
      rows: decoded,
    });
    if (Object.keys(level.mirrors).length > MAX_SOLVER_MIRRORS) return null;
    const { min, startsSolved } = analyse(level);
    if (min === null || startsSolved) return null;
    return parseLevel({ ...level, hint: hintFor(min) });
  } catch {
    return null;
  }
}
