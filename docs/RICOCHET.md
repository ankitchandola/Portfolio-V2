# Ricochet: how the game works

This document explains the logic behind the `/play` puzzle: how the beam is traced, why loops behave as they do, how game state changes, and how levels are checked. Read it before you change the rules or add levels. The visual and accessibility rules are in the Ricochet section of [the design guide](DESIGN.md).

## Files

| File                      | Responsibility                                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `src/play/model.ts`       | The rules, with no React and no DOM: parsing levels, rotating mirrors, tracing the beam, and the state reducer |
| `src/play/solve.js`       | A brute-force solver: minimum rotations, distinct solution routes and mirror reachability                      |
| `src/play/generate.js`    | The seeded level generator, its presets, the daily seed and share-link encoding                                |
| `src/play/random.js`      | `mulberry32`, `hashSeed` and `randomSeed`                                                                      |
| `src/play/progress.ts`    | `localStorage`: solved campaign levels and saved preferences                                                   |
| `src/play/Ricochet.jsx`   | The page: modes, the board, URL handling, Copy link and saving                                                 |
| `src/play/play.css`       | Board and control styles, using the `--rc-*` colour tokens                                                     |
| `src/content/levels.json` | The five campaign levels                                                                                       |
| `tests/play.test.mjs`     | Tests for the rules, reducer, storage and every shipped level                                                  |
| `tests/generate.test.mjs` | Property, snapshot and share-link tests for the generator                                                      |

`model.ts` is the only file that knows the rules. The solver, the generator, the page and the tests all go through it.

## The grid

A level is a grid of cells, `w` columns by `h` rows. `x` counts columns from the left and `y` counts rows from the top, so `y` grows downwards. Each cell is one character:

| Char      | Cell                                        | What happens when the beam enters it                                         |
| --------- | ------------------------------------------- | ---------------------------------------------------------------------------- |
| `.`       | empty                                       | It carries on in the same direction                                          |
| `#`       | wall                                        | The shot ends: **blocked**                                                   |
| `T`       | target                                      | The shot ends: **hit**                                                       |
| `> < ^ v` | source, pointing east, west, north or south | It carries on in the same direction (the beam passes through its own source) |
| `/`       | mirror                                      | It turns: E→N, N→E, W→S, S→W                                                 |
| `\`       | mirror                                      | It turns: E→S, S→E, W→N, N→W                                                 |

A beam that leaves the grid has **escaped**. The grid does not need a border of walls.

Directions are stored as letters and turned into steps through `DIRS`: `N (0,-1)`, `E (1,0)`, `S (0,1)`, `W (-1,0)`.

Mirrors are double-sided. A mirror has only two useful positions, `/` and `\`, and a quarter turn swaps them, so "rotating" a mirror is the toggle `flip(m)`. Mirror positions never change. The only thing a player changes is which of the two states each mirror is in.

## Parsing a level

`parseLevel({id, title, hint, rows})` turns the JSON into the object every other function uses:

```js
{id, title, hint, rows, w, h,
 source: {x, y, dir},       // where the beam starts and which way it points
 target: {x, y},
 mirrors: {'3,1': '/', …}}  // starting state of every mirror, keyed "x,y"
```

It throws an error that names the level and the problem unless all of these hold:

- there is exactly one source and one target;
- all rows are the same length;
- the width is between 1 and `MAX_WIDTH` (6);
- every character is from the table above.

The mirror characters stay in `rows`. While tracing, `mirrors[key] ?? rows[y][x]` reads the cell, so a mirror's current state always wins over its starting character.

## Tracing the beam

`trace(level, mirrors)` follows the beam from the source until something ends it.

### State

The beam's state is `(x, y, dir)`: the cell it is entering and the direction it is travelling **as it enters**. The same convention holds everywhere, including the source.

### Algorithm

1. Start one step in front of the source: `(source.x + dx, source.y + dy, source.dir)`. The source cell is not part of the path.
2. Repeat:
   1. If `(x, y)` is off the grid, return **escaped**.
   2. If this state has been seen before, return **loop**.
   3. If the cell is a wall or the target, add it to the path and return **blocked** or **hit**.
   4. Otherwise work out the outgoing direction (a mirror turns it, anything else keeps it), record the state, add `{x, y, dirIn, dirOut}` to the path, and step one cell in the new direction.

`visited` is a `Map` from state key to path index, so finding a repeat also tells us where the cycle starts.

### Result

```js
{
  outcome: 'hit' | 'blocked' | 'escaped' | 'loop',
  path: [{x, y, dirIn, dirOut}],  // every cell entered, in order; dirOut is null on the final wall/target cell
  end: {x, y, dir},               // target or wall cell, first off-grid coordinate, or the repeated state
  loopStart: number | null        // path index where the cycle begins (loops only)
}
```

| Outcome | Last entry in `path`            | `end`                                             |
| ------- | ------------------------------- | ------------------------------------------------- |
| hit     | the target cell                 | the target cell                                   |
| blocked | the wall cell                   | the wall cell                                     |
| escaped | the last cell inside the grid   | the first coordinate outside it                   |
| loop    | the cell just before the repeat | the repeated state, the same as `path[loopStart]` |

### It always finishes

There are `w · h · 4` possible states. A run that never hits a wall, the target or an edge must eventually repeat one, and the `visited` check catches that. No step limit is needed.

### Example: level 1, "First bounce"

```
######
#>./.#      source (1,1) pointing E, mirror at (3,1), target (3,3)
#....#
#..T.#
######
```

- **As shipped**, the mirror is `/`. The path is `(2,1) E→E`, `(3,1) E→N`, `(3,0) wall`, so the outcome is **blocked**.
- **After one rotation** the mirror is `\`. The path is `(2,1) E→E`, `(3,1) E→S`, `(3,2) S→S`, `(3,3) target`, so the outcome is **hit**. The page reports this as "Hit the target in 4 cells", which is the length of `path`.

## Why loops always go through the source

Every rule is reversible. Suppose you know the beam is entering cell `c` heading `d`. Then it must have come from the neighbouring cell behind it, `c − d`. That cell's type fixes the direction the beam had when it entered: a mirror swaps directions one-to-one, and an empty or source cell does not change them. So each state has at most one state before it.

On a finite set of states, a step function with that property cannot lead into a cycle from outside the cycle. If the trace ever repeats, the first state it repeats is the very first state, `path[0]`. Two things follow:

1. **`loopStart` is always `0` in this version.** The whole path is the cycle. The field is kept because a one-way piece would break this property, and then a beam could enter a loop part-way along.
2. **A loop must pass through the source.** To return to `path[0]`, the beam has to enter the cell in front of the source while moving in the source's direction. It can only arrive that way from the source cell itself. If the source blocked the beam, no level could ever loop. That is why the source lets the beam through.

Level 3, "Round and round", relies on this. Its starting layout sends the beam round four mirrors and back through the emitter.

## Drawing the beam

`beamPoints(level, shot)` in `Ricochet.jsx` turns a trace into the corner points of an SVG path. Points sit at cell centres, except that the line starts at the tip of the source arrow (`SOURCE_TIP`). The end of the line depends on the outcome:

- **hit:** the target's outer ring (`TARGET_RADIUS`), so the line never covers the target;
- **blocked:** the edge of the wall cell. The wall's centre is moved half a cell back towards the beam.
- **escaped:** the grid boundary, half a cell back from the first coordinate outside the grid;
- **loop:** the line closes back on the centre of `path[loopStart]`.

A loop also gets a second, dashed path drawn over the cycle. Each Fire increments `shotCount`, which is used as the path's React key, so firing again redraws the beam and replays its animation.

## Game state

`createReducer(levels)` returns a pure reducer. The state is:

```text
mode        'campaign' | 'random' | 'daily' | 'shared'
level       the level being played (a campaign level or a generated/shared one)
levelIndex  the current or most recent campaign level, so Learn reopens it
preset      'easy' | 'medium' | 'hard' for generated puzzles, otherwise null
seed        the random seed, or the UTC date for the daily puzzle
mirrors     current mirror states
history     earlier mirror maps, for Undo
shot        the last trace result, or null
solved      ids of solved campaign levels
```

| Action                             | Effect                                                                                                                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rotate {key}`                     | Pushes the current `mirrors` onto `history`, toggles the mirror and clears `shot`, because a mirror moved and the old beam is no longer accurate. Unknown keys are ignored.                                                                     |
| `fire`                             | `shot = trace(...)`. In campaign mode a hit adds the level id to `solved`; generated and shared hits never do. Firing never adds to `history`.                                                                                                  |
| `undo`                             | Pops `history` and clears `shot`. Does nothing when `history` is empty.                                                                                                                                                                         |
| `reset`                            | Restores the current level's starting mirrors (the campaign level, or the generated puzzle) and clears `history` and `shot`. `solved` is kept.                                                                                                  |
| `select {index}`                   | Opens that campaign level from its starting layout and returns to campaign mode.                                                                                                                                                                |
| `next`                             | Campaign only: opens the next unsolved level, wrapping round. When every level is solved, or outside the campaign, it does nothing. The page then offers Random and Today's puzzle after the last lesson, or New puzzle in the generated modes. |
| `load {level, mode, preset, seed}` | Opens a generated or shared level with a clean `history` and `shot`. The page builds the level, so the reducer stays pure.                                                                                                                      |
| `loaded {ids}`                     | Merges ids loaded from storage into `solved`.                                                                                                                                                                                                   |

Three helpers decide what the page shows:

- `canUndo(state)` is true when `history` is not empty.
- `canReset(state)` is true when `history` is not empty **or** a shot is visible, so Reset can also clear a beam.
- `allSolved(levels, solved)` is true when every level is in `solved`.

## Saving progress

`progress.js` stores a JSON array of level ids under `ricochet-solved`.

- **`loadSolved(storage, knownIds)`** keeps only string entries that match a current level id. Missing, malformed or wrongly typed data, a missing `storage`, or a `getItem` that throws all give an empty list.
- **`saveSolved(storage, ids)`** merges `ids` with what is already stored, then writes. It returns `false` instead of throwing if storage is unavailable.

The order matters because the page is prerendered:

1. **First render:** shows nothing solved, so it matches the static HTML and hydration cannot mismatch.
2. **On mount:** an effect loads saved ids and dispatches `loaded`.
3. **On a new hit:** the Fire handler saves. It traces once more to find out whether the shot hits, because the reducer's result is not available inside the handler.

Nothing saves "whenever state changes", so the empty first render can never overwrite saved progress.

### Preferences

`ricochet-prefs` holds `{v: 1, mode, preset, dailySolved}`:

- **`mode`** is the last of Learn, Random or Today. `/play` reopens in it, and Random reopens at the saved `preset` with a fresh puzzle.
- **`dailySolved`** is the UTC date of the last solved puzzle of the day. When it matches today, the page shows "Solved today".

`loadPrefs` drops an unknown version entirely and drops invalid fields one by one. `savePrefs` merges with what is stored. Saves happen in handlers: changing mode, changing difficulty, and a daily hit. The puzzle in progress is deliberately not saved. A `?l=`, `?seed=` or `?mode=today` URL always wins over saved preferences.

## The solver and level checks

`src/play/solve.js` tries every mirror layout. With `n` mirrors that is `2ⁿ` layouts, and `MAX_SOLVER_MIRRORS` (8) caps this at 256 traces.

- `solve(level)` returns the fewest rotations needed, one solving layout, and how many layouts solve the level.
- `hasLoop(level)` reports whether any layout loops.
- `routes(level)` counts distinct beam routes that hit the target. It counts routes, not layouts, because a mirror the beam never touches can face either way without changing the route.
- `reachable(level)` is true when the beam touches every mirror in at least one layout.

Rotations are toggles and their order does not matter, so the fewest rotations equals the fewest mirrors that differ between the starting layout and any solving layout.

`tests/play.test.mjs` checks every shipped level:

- it parses;
- its ids are unique;
- it has at most 8 mirrors;
- it has a title and a hint;
- it is **not** already solved;
- its minimum rotation count matches `expectedMinRotations`.
- exactly one beam route reaches the target;
- the beam can touch every mirror.

Level 3 must also be able to loop. The current minimums are 1, 2, 2, 3 and 4.

## Generated levels

`generatePuzzle(seed, constraints)` in `src/play/generate.js` builds a fresh level that is guaranteed to be valid. It builds the answer first, then hides it:

1. **Route.** It walks from a random source, choosing directions that have room. Each straight run goes from 1 cell up to all the free room ahead. Each corner gets a mirror in its solved orientation, and the walk ends on the target after `turns` corners.
2. **Decoys** go 1–3 cells along the exit a _wrong_ turn would take, so they catch mistakes.
3. **Walls** go on empty cells that are not on the route.
4. **Hiding the answer.** It flips `scramble` of the route mirrors.
5. **Checks** run in a single `analyse(level)` pass over every layout. The level is accepted only if all of these hold:
   - it does not start solved;
   - its minimum rotations are within `rotations`;
   - exactly one beam route reaches the target;
   - the beam can touch every mirror;
   - at least one decoy was actually placed;
   - the route spans at least 4 columns and `h − 2` rows;
   - the route enters at least `w + h − 2` cells;
   - no more than 2 consecutive rows or columns are empty.
6. **Retries.** Up to `maxAttempts` (200), it draws again from the same seeded stream. `generatePuzzle` then tries the derived seeds `seed/1` to `seed/4`, so the result is still deterministic.

| Preset | Grid  | Turns | Decoys | Walls | Rotations | Average / worst time |
| ------ | ----- | ----- | ------ | ----- | --------- | -------------------- |
| Easy   | 6 × 5 | 2     | 1      | 3     | 2         | about 1 ms / 4 ms    |
| Medium | 6 × 6 | 4     | 2      | 4     | 3         | about 1 ms / 3 ms    |
| Hard   | 6 × 8 | 5     | 3      | 5     | 4–8       | about 20 ms / 50 ms  |

Hard uses `loopTrap: 'prefer'`. Its first 40 attempts must include a layout that loops; later attempts need not. Requiring a loop trap outright passed only 0.9% of attempts. About a third of Hard levels end up with one.

**Seeds.** `mulberry32` is seeded with FNV-1a of `v${GENERATOR_VERSION}:${seed}`, and nothing in the generator calls `Math.random`.

- Random seeds are 6 base-36 characters from `crypto.getRandomValues`.
- The daily seed is `daily:YYYY-MM-DD` in **UTC**, with the Medium preset.
- The snapshot tests pin the exact levels for fixed seeds. Any change that alters them must bump `GENERATOR_VERSION`.

**Share links** carry the level itself, not its seed, so they keep working after generator changes:

- The format is `?l=<rows>&d=<preset>`. Rows are joined with `-`, and cells become `.`, `x` (wall), `t` (target), `f` (`/`), `b` (`\`) and `e w n s` (sources).
- `decodeLevel` treats links as untrusted. Anything malformed, larger than 6 × 8, over 8 mirrors, unsolvable or already solved decodes to `null`. The page then says "That puzzle link isn't valid." and opens level 1.

**URLs.** The page keeps the address bar in step with `history.replaceState`:

| Mode   | URL           |
| ------ | ------------- |
| Learn  | `/play/`      |
| Random | `?seed=…&d=…` |
| Today  | `?mode=today` |
| Shared | `?l=…`        |

Reloading shows the same puzzle. Copy link always uses `?l=`, so a shared daily puzzle stays the same after midnight.

## Adding or changing a level

1. Edit `src/content/levels.json`. In JSON a `\` mirror is written `\\`. Keep the grid at most 6 columns wide (so cells stay at least 44px on a 320px phone) and use at most 8 mirrors.
2. Run `npm test`. The level test fails until you add the new id to `expectedMinRotations`. That is deliberate: the difficulty should be a decision, not an accident.
3. Make sure decoy mirrors can actually be reached. A mirror the beam can never touch is just clutter. A quick way to check is to trace the starting layout and the solved layout and draw both paths.
4. Play the level in the browser. Solvable is not the same as enjoyable.
5. Run `npm run build` and `python tests/check-site.py`.

## Extending the rules

Different kinds of change touch different parts of the model:

| Change                        | What it touches                                                                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fixed (non-rotatable) mirrors | A new character in `parseLevel`, kept out of `mirrors` but reflected by `trace`. The reducer, the solver and reversibility are unchanged.                                 |
| Par and move counter          | The reducer counts rotations. The par could come from running `solve` in the browser: at most 256 traces is cheap.                                                        |
| Hint                          | Move `solve` into `src/play/`, then compare the current layout with the nearest solution and point at one mirror.                                                         |
| Paired portals                | A new cell type in `trace`. Paired portals keep reversibility, so `loopStart` stays `0`.                                                                                  |
| One-way gates                 | Break reversibility, so `loopStart` can be above `0` and the loop overlay starts part-way along the path. The pass-through source stops being the only way to get a loop. |
| Multiple targets              | Targets must let the beam pass through and record a hit instead of ending the shot, and "hit" becomes "every target lit".                                                 |
| Beam splitters                | The path becomes a tree. Trace each branch with one shared `visited` set, and `shot` carries several paths.                                                               |
| Movable mirrors               | Mirror positions become state. The solver's search space grows from `2ⁿ` to placements × orientations, so it needs a breadth-first search with a cap.                     |
