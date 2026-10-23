import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLevel, trace } from '../src/play/model.ts';
import { MAX_SOLVER_MIRRORS } from '../src/play/solve.ts';
import { mulberry32, hashSeed, randomSeed } from '../src/play/random.ts';
import {
  PRESETS,
  analyse,
  meetsQuality,
  generateLevel,
  generatePuzzle,
  dailySeed,
  encodeLevel,
  decodeLevel,
  hintFor,
} from '../src/play/generate.ts';
import raw from '../src/content/levels.json' with { type: 'json' };

const SEEDS_PER_PRESET = { easy: 200, medium: 200, hard: 30 };

test('mulberry32 and FNV-1a match their reference values', () => {
  const random = mulberry32(1);
  assert.deepEqual(
    [random(), random(), random()],
    [0.6270739405881613, 0.002735721180215478, 0.5274470399599522],
  );
  assert.equal(hashSeed(''), 0x811c9dc5);
  assert.equal(hashSeed('a'), 0xe40c292c);
});
test('randomSeed is six upper-case base-36 characters', () => {
  const fixed = {
    getRandomValues: (v) => {
      v[0] = 123456789;
      return v;
    },
  };
  assert.equal(randomSeed(fixed), '21I3V9');
  for (let i = 0; i < 50; i++) assert.match(randomSeed(), /^[0-9A-Z]{6}$/);
});

for (const [name, constraints] of Object.entries(PRESETS)) {
  test(`${name}: every generated level meets its constraints`, () => {
    for (let i = 0; i < SEEDS_PER_PRESET[name]; i++) {
      const level = generatePuzzle(`${name}-${i}`, constraints);
      assert.ok(level, `${name}-${i} generated`);
      const result = analyse(level);
      const label = `${name}-${i}: ${level.rows.join('|')}`;
      assert.equal(level.w, constraints.w, label);
      assert.equal(level.h, constraints.h, label);
      const mirrors = Object.keys(level.mirrors).length;
      assert.ok(mirrors <= MAX_SOLVER_MIRRORS, label);
      assert.ok(mirrors > constraints.turns, `${label} has a decoy`);
      assert.ok(!result.startsSolved, label);
      assert.ok(
        result.min >= constraints.rotations.min &&
          result.min <= constraints.rotations.max,
        label,
      );
      assert.equal(result.routes, 1, label);
      assert.ok(result.reachable, label);
      assert.ok(meetsQuality(level, result.route), label);
      assert.equal(level.hint, hintFor(result.min), label);
    }
  });
}
test('hard prefers a loop trap without requiring one', () => {
  const levels = Array.from({ length: 30 }, (_, i) =>
    generatePuzzle(`loop-${i}`, PRESETS.hard),
  );
  const withLoop = levels.filter((level) => analyse(level).loops).length;
  assert.ok(withLoop > 3, `${withLoop}/30 hard levels can loop`);
  assert.ok(levels.every(Boolean), 'no level is lost to the loop preference');
});

test('the same seed always gives the same level', () => {
  for (const constraints of Object.values(PRESETS))
    assert.deepEqual(
      generateLevel('REPEAT', constraints).rows,
      generateLevel('REPEAT', constraints).rows,
    );
  let same = 0;
  for (let i = 0; i < 200; i++)
    if (
      encodeLevel(generatePuzzle(`a${i}`, PRESETS.medium)) ===
      encodeLevel(generatePuzzle(`b${i}`, PRESETS.medium))
    )
      same++;
  assert.ok(same < 10, `${same}/200 different seeds collided`);
});
test('snapshots: changing these levels requires bumping GENERATOR_VERSION', () => {
  assert.deepEqual(generatePuzzle('daily:2026-10-22', PRESETS.medium).rows, [
    '..#\\..',
    '......',
    '././..',
    '..T\\.\\',
    '#..#..',
    '#/...<',
  ]);
  assert.deepEqual(generatePuzzle('SNAP01', PRESETS.easy).rows, [
    '.##...',
    '\\....T',
    '......',
    '/.<...',
    '\\....#',
  ]);
  assert.deepEqual(generatePuzzle('SNAP01', PRESETS.medium).rows, [
    '..#...',
    '\\....T',
    '.#....',
    '//./..',
    '.\\.<..',
    './#..#',
  ]);
  assert.deepEqual(generatePuzzle('SNAP01', PRESETS.hard).rows, [
    '.\\/\\.#',
    '..///.',
    '#...#.',
    '../...',
    '..#^.#',
    '......',
    '......',
    'T\\....',
  ]);
});
test('the daily seed uses the UTC date', () => {
  assert.equal(
    dailySeed(new Date('2026-10-22T23:30:00-05:00')),
    'daily:2026-10-23',
  );
  assert.equal(
    dailySeed(new Date('2026-10-23T00:10:00+05:30')),
    'daily:2026-10-22',
  );
});

test('impossible constraints throw', () => {
  const base = PRESETS.medium;
  const bad = {
    'too wide': { ...base, w: 7 },
    'too tall': { ...base, h: 9 },
    'too many mirrors': { ...base, turns: 6, decoys: 3 },
    'scramble above turns': { ...base, scramble: 5 },
    'scramble zero': { ...base, scramble: 0 },
    'min above max': { ...base, rotations: { min: 3, max: 2 } },
    'min above scramble': { ...base, rotations: { min: 4, max: 4 } },
    'missing rotations': { ...base, rotations: undefined },
    'unknown loopTrap': { ...base, loopTrap: 'sometimes' },
  };
  for (const [reason, constraints] of Object.entries(bad))
    assert.throws(() => generateLevel('X', constraints), Error, reason);
});
test('unsatisfiable constraints return null after their attempts', () => {
  const noLoopPossible = {
    w: 6,
    h: 6,
    turns: 1,
    decoys: 0,
    walls: 0,
    scramble: 1,
    rotations: { min: 1, max: 1 },
    loopTrap: true,
    maxAttempts: 20,
  };
  assert.equal(generateLevel('X', noLoopPossible), null);
  assert.equal(generatePuzzle('X', noLoopPossible), null);
});

test('share encoding round-trips campaign and generated levels', () => {
  for (const level of raw.map(parseLevel)) {
    const decoded = decodeLevel(encodeLevel(level));
    assert.deepEqual(decoded.rows, level.rows, level.id);
  }
  for (let i = 0; i < 100; i++) {
    const level = generatePuzzle(`share-${i}`, PRESETS.medium);
    assert.deepEqual(decodeLevel(encodeLevel(level)).rows, level.rows);
  }
  assert.equal(
    encodeLevel(raw.map(parseLevel)[0]),
    'xxxxxx-xe.f.x-x....x-x..t.x-xxxxxx',
  );
});
test('share decoding rejects anything malformed, oversized or unplayable', () => {
  const bad = {
    'not a string': 42,
    empty: '',
    'unknown letter': 'e.z..t',
    'ragged rows': 'e.t-..',
    'too wide': 'e.....t',
    'too tall': Array(9).fill('e....t').join('-'),
    'too long': 'e'.repeat(80),
    unsolvable: 'ext',
    'already solved': 'e.t',
    'no source': '..t',
    'two targets': 'ett',
    'too many mirrors': ['e.fbfb', 'fbfbfb', '.....t'].join('-'),
  };
  for (const [reason, text] of Object.entries(bad))
    assert.equal(decodeLevel(text), null, reason);
});
test('decoded levels get an honest hint and play normally', () => {
  const level = decodeLevel('e.f.-....-..t.');
  assert.ok(level);
  assert.equal(level.hint, hintFor(analyse(level).min));
  assert.notEqual(trace(level, level.mirrors).outcome, 'hit');
});
