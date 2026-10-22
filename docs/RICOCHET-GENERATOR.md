# Ricochet level generator — spec and plan

This adds generated levels to `/play`. Visitors pick a difficulty and get a fresh puzzle that is guaranteed to be solvable. Generated puzzles can be shared as links, and there is one shared puzzle of the day. The five handcrafted levels stay as the main campaign.

**Status:** accepted, being implemented. A throwaway prototype has measured the approach (see Evidence). When this ships, move the settled rules into `docs/RICOCHET.md` and `docs/DESIGN.md`, then delete this file.

## Goals and non-goals

**Goals**

- Generate levels that meet the constraints given to the generator: size, number of turns, decoys, walls and a rotation range.
- Every generated level is valid, not already solved, solvable with exactly one beam route, and has no unreachable mirrors.
- The same seed and constraints always produce the same level.
- Visitors can share the exact puzzle they are looking at.
- Everything runs in the browser on static GitHub Pages, with no server.

**Non-goals for this version**

- Proving a level is _fun_. Heuristics make dull levels less likely, but the handcrafted levels remain the showcase.
- New cell types (fixed mirrors, portals and so on). The generator uses today's rules only.
- Leaderboards, streaks, accounts or analytics.
- Restoring a puzzle in progress after a reload. Only the daily-solved date and the last mode and difficulty are saved (see Saving).
- A level editor. The share-link format below is designed so an editor could reuse it later.

## Evidence from the prototype

The prototype ran 5,000 attempts per preset with seed 42, using the existing `model.js` and solver unchanged.

| Preset | Grid  | Turns | Decoys | Walls | Rotations | Accepted | Time per accepted level |
| ------ | ----- | ----- | ------ | ----- | --------- | -------- | ----------------------- |
| Easy   | 6 × 5 | 2     | 1      | 3     | exactly 2 | 97%      | < 0.1 ms                |
| Medium | 6 × 6 | 4     | 2      | 4     | exactly 3 | 84%      | ≈ 0.1 ms                |
| Hard   | 6 × 8 | 5     | 3      | 5     | ≥ 4       | 72%      | ≈ 0.4 ms                |

What the prototype taught:

- **Scattering cells at random does not work well.** Only 0.03% of levels passed, at about 0.5 s per good level. Building the solution first is the approach to use.
- **Unreachable decoys make solution counts meaningless.** A mirror the beam never touches can face either way, which doubles the number of solving layouts. Uniqueness has to be measured as distinct _beam routes_, not distinct layouts.
- **Valid is not the same as good.** The Hard sample left three rows empty. Coverage heuristics are needed (see Quality).

## Algorithm

`generateLevel(seed, constraints)` builds the answer first and then hides it.

1. **Lay the route.**
   - Choose a random source cell and direction.
   - Walk 1–3 cells in a straight line, without revisiting a cell or leaving the grid.
   - At each corner, place a mirror facing the way that makes the turn. This is the solved orientation.
   - After `turns` corners, end the route on the target.
   - If the walk gets stuck, start the attempt again.
2. **Place decoys where wrong turns lead.** Pick a route mirror and look along its _other_ exit direction. Place a decoy, facing a random way, 1–3 cells along that line. Decoys therefore catch the beam when a player turns a mirror the wrong way.
3. **Add walls** on empty cells that are not on the route.
4. **Hide the answer.** Flip exactly `scramble` of the route mirrors.
5. **Check the result** using the solver:
   - the level parses;
   - it has no more than 8 mirrors;
   - the starting layout does not already hit;
   - the minimum number of rotations is within `rotations`;
   - exactly one distinct beam route reaches the target;
   - the beam touches every mirror in at least one layout;
   - the quality checks pass.
6. **Retry if a check fails.** Use the next random draw from the same seeded stream, up to `maxAttempts` (200). If all attempts fail, return `null`. The caller then tries the derived seed `seed + '/1'`, and so on, so the result is still deterministic.

The worst case is about 200 attempts × 0.4 ms, which is under 100 ms. That is fast enough to run synchronously on a click, so no worker is needed.

### Constraints object

```js
{
  w: 6, h: 6,                    // w ≤ 6 (cells stay ≥ 44px at 320px); h ≤ 8
  turns: 4,                      // corner mirrors on the solution route
  decoys: 2,                     // a target count; placement can fail, so the actual count may be lower
  walls: 4,
  scramble: 3,                   // route mirrors flipped before play
  rotations: {min: 3, max: 3},   // accepted minimum-rotation range
  loopTrap: false,               // optional: require at least one layout that loops
  maxAttempts: 200
}
```

`generateLevel` checks this object before starting:

- `w ≤ 6` and `h ≤ 8`;
- `turns + decoys ≤ 8`, which is the solver's mirror cap;
- `scramble ≤ turns`;
- `rotations.min ≤ rotations.max`.

An impossible configuration throws an error. It does not return `null`.

### Presets

| Preset | Constraints                                                                                   |
| ------ | --------------------------------------------------------------------------------------------- |
| Easy   | `{w:6, h:5, turns:2, decoys:1, walls:3, scramble:2, rotations:{min:2, max:2}}`                |
| Medium | `{w:6, h:6, turns:4, decoys:2, walls:4, scramble:3, rotations:{min:3, max:3}}`                |
| Hard   | `{w:6, h:8, turns:5, decoys:3, walls:5, scramble:5, rotations:{min:4, max:8}, loopTrap:true}` |

The `loopTrap` acceptance rate has not been measured yet. If Hard drops below 20% acceptance with it on, make it a preference instead of a requirement: try with it, and fall back without it.

### Quality heuristics

All of these are checked in step 5:

- **Coverage.** The route spans at least 4 columns and at least `h − 2` rows. No more than 2 consecutive rows or columns may be completely empty.
- **Route length.** The route enters at least `w + h − 2` cells.
- **Tempting decoy.** At least one decoy sits on the line a wrong turn sends the beam along. Step 2 does this by construction; the check confirms that placement succeeded.
- **Not already solved.** The starting layout does not hit.

These numbers are starting points. Tune them while play-testing, and record the final values in the tests.

## Randomness and seeds

- **Generator:** `mulberry32`, a small seedable generator with good enough quality for this use.
- **String seeds** are turned into numbers with FNV-1a 32-bit hashing.
- `generateLevel` uses only that generator. It never calls `Math.random`, so the same input always gives the same level.
- **Random puzzle:** the seed comes from `crypto.getRandomValues` and is shown as 6 base-36 characters.
- **Puzzle of the day:** the seed is `daily:YYYY-MM-DD` using the **UTC** date, with the Medium preset, so everyone gets the same puzzle on the same day.
- **Generator version:** a `GENERATOR_VERSION` constant (starting at `1`) is part of every hashed seed. Changing the algorithm later changes which level each seed gives. Daily puzzles are then different on purpose, and share links are unaffected because they carry the level itself (see Share links).

## Share links

A share link carries the **level itself**, not its seed. A link stays valid even if the generator changes later, and the same format can carry levels from a future editor.

- **Format:** `/play?l=<rows>&d=<preset>`. Rows are joined with `-`, and each cell becomes a URL-safe letter:

  | Cell   | `.` | `#` | `T` | `/` | `\` | `>` | `<` | `^` | `v` |
  | ------ | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | Letter | `.` | `x` | `t` | `f` | `b` | `e` | `w` | `n` | `s` |

  A 6 × 8 level becomes 55 characters.

- **Decoding** goes through `parseLevel`, then the mirror cap, then the solver, which must find a solution. Anything invalid or unsolvable shows the message "That puzzle link isn't valid." and opens level 1. A visitor's link never throws.
- **Sharing:** "Copy link" uses `navigator.clipboard.writeText`. Where that is unavailable or refused, show the link in a read-only, pre-selected text field.
- **Scope:** the link holds the puzzle's starting layout, not the player's progress.

## Model and state changes

- **Solver:** move `tests/solve.mjs` to `src/play/solve.js`, because the page now needs it. Add `routes(level)` (the number of distinct hit routes) and `reachable(level)`. The tests import from the new location. It costs at most 256 traces per level, so it is cheap enough to ship.
- **New files:**
  - `src/play/random.js` holds `mulberry32`, `hashSeed` and `randomSeed`.
  - `src/play/generate.js` holds `generateLevel`, `PRESETS`, `encodeLevel`, `decodeLevel` and `GENERATOR_VERSION`.
- **Reducer:** today the state holds `levelIndex` into a fixed array. Change it to hold the level itself:

  ```js
  {
    mode: ('campaign' | 'random' | 'daily' | 'shared',
      level,
      levelIndex,
      preset,
      seed,
      mirrors,
      history,
      shot,
      solved);
  }
  ```

  - A new action, `load {level, mode, preset?, seed?}`, opens any level in its starting layout.
  - `select` and `next` keep their current behaviour in campaign mode.
  - In random mode, `next` means "new puzzle at the same difficulty". The page generates the level and dispatches `load`, so the reducer stays pure.
  - `fire` adds to `solved` only for campaign levels.

- **Progress:** generated puzzles do not touch the `ricochet-solved` key. What else is saved is described in Saving.

## Saving

Two small conveniences are stored in the browser. Neither is needed to play.

- **Daily solved.** The UTC date of the last solved puzzle of the day. When it matches today, the Today heading shows "Solved today" with a check icon, and the hit result offers **New puzzle**. The puzzle stays replayable.
- **Last mode and difficulty.** `/play` reopens in the mode the visitor last used. Random also reopens at the last difficulty. Random always generates a fresh puzzle, because the puzzle itself is not saved.

**Storage key.** `ricochet-prefs` holds versioned JSON, `{v: 1, mode, preset, dailySolved}`. The existing `ricochet-solved` key does not change, so current visitors keep their campaign progress without any migration.

**Rules**, which match the existing progress storage:

- **Saved data is untrusted.** `loadPrefs` keeps a field only if it is valid:
  - `v` must be `1`;
  - `mode` must be one of the known modes;
  - `preset` must be one of the known presets;
  - `dailySolved` must be a `YYYY-MM-DD` string.

  Invalid fields are dropped individually. Missing data, malformed data or storage that throws gives defaults.

- **Load after hydration.** Read the key in the same mount effect that loads campaign progress, so the first render still matches the prerendered HTML.
- **Save from handlers.** Save when the mode changes, when the difficulty changes, and on a daily hit. Never save from a general "on state change" effect. `savePrefs` merges with what is stored, so a partial save never erases other fields.
- **The URL wins.** If the URL has `?l=`, `?seed=` or `?mode=today`, it decides what opens. Saved preferences apply only when the URL has none of these.
- **Blocked storage is a no-op.** The game then behaves as if nothing were saved.

**Not saved:** the puzzle in progress and its mirror positions. Puzzles need only 1–5 rotations, so restoring them is not worth the extra state and validation. A share link covers deliberately keeping a puzzle. Streaks, statistics and a history of generated puzzles are non-goals.

**Code.** `src/play/progress.js` gains `loadPrefs(storage)` and `savePrefs(storage, patch)` beside the existing functions.

## UI

- **Mode switch.** Above the board, add a segmented control with three options: **Levels**, **Random** and **Today**. It is built from real buttons with `aria-pressed`, in the same style as the level buttons.
  - **Levels** is the current campaign, unchanged.
  - **Random** shows Easy, Medium and Hard, plus **New puzzle**.
  - **Today** shows the puzzle of the day. Its heading includes the UTC date.
- **Heading for generated puzzles.** The kicker reads `RANDOM · MEDIUM · SEED K3F9QZ` or `PUZZLE OF THE DAY · 22 OCT 2026`. The title is "Generated puzzle". The hint is fixed per difficulty, such as "Three mirrors are wrong. One route works." It never makes claims that are not true of the level.
- **Generated puzzles are labelled as generated.** They are never presented as handcrafted.
- **Copy link** appears beside Undo and Reset in the Random and Today modes. It is announced through the existing status region as "Link copied".
- **After a hit:** in the Random and Today modes, the Next action reads **New puzzle**. In Today mode, it switches to Random at Medium.
- **Prerendering and hydration.**
  - The prerendered page still shows campaign level 1.
  - URL parameters (`?l=`, `?seed=`, `?mode=today`) are read in an effect after mount, so the first render matches the static HTML.
  - Changing mode updates the URL with `history.replaceState`, so reload and back behave sensibly without new routes.
- **Everything else stays the same:** accessibility, motion and colours follow the existing Ricochet rules in DESIGN.md.

## Tests

`tests/generate.test.mjs` covers the following.

- **Properties, for 500 seeds per preset:**
  - every level parses and is within its size and mirror caps;
  - it is not already solved;
  - its minimum rotations are inside `rotations`;
  - it has exactly one route;
  - every mirror is reachable;
  - the coverage and route-length heuristics hold;
  - Hard levels meet `loopTrap` (or its fallback).
- **Determinism:** the same seed and constraints give the same rows, and different seeds give different rows in more than 95% of 200 pairs.
- **Snapshots:** fixed rows for `daily:2026-10-22` and one seed per preset. These catch unintended algorithm changes, and a change must bump `GENERATOR_VERSION`.
- **Validation:** impossible constraints throw, and exhausting `maxAttempts` returns `null`.
- **Encoding:** `encodeLevel` and `decodeLevel` round-trip all five campaign levels and 100 generated ones. Unknown letters, ragged rows, too-wide grids, unsolvable levels and over-long input all decode to `null`.
- **Random helpers:** `mulberry32` gives a known sequence for a known seed, and `hashSeed` is stable.
- **Reducer:**
  - `load` resets `history` and `shot`;
  - generated hits do not add to `solved`;
  - campaign behaviour is unchanged (the existing tests keep passing).
- **Preferences** (in `tests/play.test.mjs`):
  - a valid round trip;
  - each invalid field (wrong version, unknown mode or preset, malformed date) is dropped while valid fields are kept;
  - malformed JSON and storage that throws give defaults;
  - `savePrefs` merges with stored fields instead of replacing them;
  - the existing `ricochet-solved` data is untouched.

`tests/play.test.mjs` updates its import to `src/play/solve.js`. The test runtime should stay under about 2 s. If the property tests run slower, lower the seed count.

## Implementation steps

Each step is one commit.

1. `refactor: move ricochet solver into the play module`. Move the solver, add `routes` and `reachable`, and update the imports. Behaviour does not change.
2. `feat: add seeded ricochet level generator`. Add `random.js`, `generate.js` with presets and encoding, and the property, snapshot and encoding tests. Play about 10 levels per preset in a throwaway runner and tune the heuristics.
3. `feat: add random and daily modes to /play`. Add the reducer `load` action, the mode switch, the URL handling, Copy link, the generated headings and saved preferences (`loadPrefs`/`savePrefs`, Solved today, reopening the last mode and difficulty).
4. `docs: record the ricochet generator`. Update `docs/RICOCHET.md` (algorithm, seeds, link format) and the Ricochet section of DESIGN.md, then delete this file.

Verification for each UI step:

- run `npm run build`, `python tests/check-site.py` and `npm test`;
- render-check `/play`, `/play?mode=today` and a `?l=` link at 320–1440px in both themes;
- check keyboard-only use of the mode switch and Copy link;
- check how an invalid link is handled.

## Decisions

| Question                                       | Decision                                                                                              |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Include puzzle of the day in this version?     | Yes. It is one preset plus a date seed, almost free once seeds exist.                                 |
| Share by seed or by level?                     | By level (`?l=`), so links survive generator changes. Seeds are still shown, for reference.           |
| Should generated solves count toward progress? | No. Only the campaign records progress.                                                               |
| Hard requires a loop trap?                     | Yes if acceptance stays at 20% or above; otherwise it is a preference.                                |
| Time zone for the daily puzzle                 | UTC, so everyone sees the same puzzle. The date is shown so the rollover is not a surprise.           |
| What to save                                   | Decided: the daily-solved date and the last mode and difficulty. The puzzle in progress is not saved. |
