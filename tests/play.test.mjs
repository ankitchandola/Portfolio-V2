import test from 'node:test';
import assert from 'node:assert/strict';
import {parseLevel, reflect, rotate, trace, createReducer, initialState, canUndo, canReset, allSolved, nextUnsolved, MAX_WIDTH} from '../src/play/model.js';
import {loadSolved, saveSolved, STORAGE_KEY} from '../src/play/progress.js';
import {solve, hasLoop, MAX_SOLVER_MIRRORS} from './solve.mjs';
import raw from '../src/content/levels.json' with {type: 'json'};
const grid = (...rows) => parseLevel({id: 'test', rows});
const levels = raw.map(parseLevel);
const expectedMinRotations = {'first-bounce': 1, 'two-turns': 2, 'round-and-round': 2, 'corridors': 3, 'long-way-round': 4};

test('mirrors reflect all eight direction pairs', () => {
 assert.deepEqual(['E','N','W','S'].map(d => reflect('/', d)), ['N','E','S','W']);
 assert.deepEqual(['E','S','W','N'].map(d => reflect('\\', d)), ['S','E','N','W']);
});
test('trace reports each outcome with its terminal state', () => {
 const hit = trace(grid('>.T'), {});
 assert.equal(hit.outcome, 'hit'); assert.deepEqual(hit.end, {x: 2, y: 0, dir: 'E'});
 assert.deepEqual(hit.path.map(p => [p.x, p.dirIn, p.dirOut]), [[1,'E','E'], [2,'E',null]]);
 const blocked = trace(grid('>.#T'), {});
 assert.equal(blocked.outcome, 'blocked'); assert.deepEqual(blocked.end, {x: 2, y: 0, dir: 'E'});
 const escaped = trace(grid('>./', '...', 'T..'), grid('>./', '...', 'T..').mirrors);
 assert.equal(escaped.outcome, 'escaped'); assert.deepEqual(escaped.end, {x: 2, y: -1, dir: 'N'});
 assert.equal(hit.loopStart, null); assert.equal(blocked.loopStart, null); assert.equal(escaped.loopStart, null);
});
test('the source emits from its own cell and is not part of the path', () => {
 const level = grid('T..', '...', '.^.');
 const shot = trace(level, {});
 assert.deepEqual(shot.path[0], {x: 1, y: 1, dirIn: 'N', dirOut: 'N'});
 assert.equal(shot.outcome, 'escaped'); assert.deepEqual(shot.end, {x: 1, y: -1, dir: 'N'});
});
test('a beam re-entering the source passes through and loops from the first state', () => {
 const level = grid('/.\\', '\\>/', '..T');
 const shot = trace(level, level.mirrors);
 assert.equal(shot.outcome, 'loop'); assert.equal(shot.loopStart, 0);
 assert.ok(shot.path.some(p => p.x === 1 && p.y === 1), 'beam crosses the source cell');
 assert.deepEqual(shot.end, {x: shot.path[0].x, y: shot.path[0].y, dir: shot.path[0].dirIn});
});
test('trace terminates on a grid made entirely of mirrors', () => {
 const rows = ['>/\\/\\/', ...Array.from({length: 5}, (_, y) => (y % 2 ? '\\/\\/\\/' : '/\\/\\/\\'))];
 const level = parseLevel({id: 'mirrors', rows: [rows[0].slice(0, 5) + 'T', ...rows.slice(1)]});
 const shot = trace(level, level.mirrors);
 assert.ok(['hit','blocked','escaped','loop'].includes(shot.outcome));
 assert.ok(shot.path.length <= level.w * level.h * 4);
});
test('rotate returns a new map and leaves its input unchanged', () => {
 const before = {'1,0': '/'};
 const after = rotate(before, '1,0');
 assert.deepEqual(after, {'1,0': '\\'}); assert.deepEqual(before, {'1,0': '/'});
 assert.equal(rotate(before, '9,9'), before);
});
test('parseLevel rejects malformed levels', () => {
 const bad = {
  'no source': ['..T'], 'two sources': ['>>T'], 'no target': ['>..'], 'two targets': ['>TT'],
  'ragged rows': ['>.T', '..'], 'too wide': ['>' + '.'.repeat(MAX_WIDTH - 1) + 'T'], 'unknown char': ['>xT'],
 };
 for (const [reason, rows] of Object.entries(bad)) assert.throws(() => parseLevel({id: reason, rows}), Error, reason);
 assert.throws(() => parseLevel({id: 'empty', rows: []}));
});

test('reducer: rotate records history and clears the shot, undo restores', () => {
 const reducer = createReducer(levels);
 let state = reducer(initialState(levels), {type: 'fire'});
 assert.ok(state.shot); assert.ok(!canUndo(state));
 const key = Object.keys(levels[0].mirrors)[0];
 state = reducer(state, {type: 'rotate', key});
 assert.equal(state.shot, null); assert.ok(canUndo(state));
 assert.notEqual(state.mirrors[key], levels[0].mirrors[key]);
 state = reducer(state, {type: 'undo'});
 assert.deepEqual(state.mirrors, levels[0].mirrors); assert.ok(!canUndo(state));
 assert.equal(reducer(state, {type: 'rotate', key: 'not-a-mirror'}), state);
});
test('reducer: reset is available for a visible shot alone and clears it', () => {
 const reducer = createReducer(levels);
 let state = initialState(levels);
 assert.ok(!canReset(state));
 state = reducer(state, {type: 'fire'});
 assert.ok(canReset(state));
 state = reducer(state, {type: 'reset'});
 assert.equal(state.shot, null); assert.ok(!canReset(state));
});
test('reducer: a hit marks the level solved and next skips solved levels', () => {
 const reducer = createReducer(levels);
 let state = reducer(initialState(levels), {type: 'loaded', ids: [levels[1].id]});
 for (const [key, mirror] of Object.entries(solve(levels[0]).mirrors)) if (state.mirrors[key] !== mirror) state = reducer(state, {type: 'rotate', key});
 state = reducer(state, {type: 'fire'});
 assert.equal(state.shot.outcome, 'hit'); assert.deepEqual(state.solved, [levels[1].id, levels[0].id]);
 state = reducer(state, {type: 'next'});
 assert.equal(state.levelIndex, 2); assert.equal(state.shot, null);
});
test('next wraps to the first unsolved level and stops when all are solved', () => {
 const ids = levels.map(l => l.id);
 assert.equal(nextUnsolved(levels, ids.slice(1), 4), 0);
 assert.equal(nextUnsolved(levels, ids, 0), null); assert.ok(allSolved(levels, ids));
 const reducer = createReducer(levels);
 const done = initialState(levels, 4, ids);
 assert.equal(reducer(done, {type: 'next'}), done);
 assert.equal(reducer(done, {type: 'select', index: 0}).levelIndex, 0);
});

const memory = (initial = {}) => {
 const data = {...initial};
 return {data, getItem: k => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }};
};
test('progress round-trips and merges with stored ids', () => {
 const storage = memory();
 assert.deepEqual(loadSolved(storage, ['a', 'b']), []);
 assert.ok(saveSolved(storage, ['a']));
 assert.ok(saveSolved(storage, ['b']));
 assert.deepEqual(loadSolved(storage, ['a', 'b']), ['a', 'b']);
});
test('progress ignores malformed or unknown data', () => {
 for (const value of ['not json', '{"a":1}', '"a"', 'null']) assert.deepEqual(loadSolved(memory({[STORAGE_KEY]: value}), ['a']), [], value);
 assert.deepEqual(loadSolved(memory({[STORAGE_KEY]: '["a",1,null,"zzz","a"]'}), ['a']), ['a']);
});
test('progress survives storage that throws', () => {
 const broken = {getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }};
 assert.deepEqual(loadSolved(broken, ['a']), []);
 assert.equal(saveSolved(broken, ['a']), false);
 assert.deepEqual(loadSolved(undefined, ['a']), []);
});

test('every shipped level is valid, unsolved at start and solvable at its intended difficulty', () => {
 assert.equal(levels.length, 5);
 assert.equal(new Set(levels.map(l => l.id)).size, levels.length);
 for (const level of levels) {
  assert.ok(Object.keys(level.mirrors).length <= MAX_SOLVER_MIRRORS, level.id);
  assert.ok(level.title && level.hint, level.id);
  assert.notEqual(trace(level, level.mirrors).outcome, 'hit', `${level.id} starts solved`);
  assert.equal(solve(level)?.rotations, expectedMinRotations[level.id], level.id);
 }
});
test('the loop level can actually loop', () => {
 const level = levels.find(l => l.id === 'round-and-round');
 assert.ok(hasLoop(level));
 assert.equal(trace(level, level.mirrors).outcome, 'loop');
});
