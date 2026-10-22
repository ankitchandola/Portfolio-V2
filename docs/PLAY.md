# Ricochet — spec and plan

A small grid puzzle on its own `/play` page: rotate mirrors so a beam from a fixed source reaches the target. It is a side project built for this site, so describe it as that. It makes no claims about professional work, and it adds nothing to Selected Work, Engineering Decisions or Evidence.

Status: proposal, revised after review. Nothing here is built yet. Once it ships, move the settled rules into `docs/DESIGN.md` and delete this file.

## Decisions

| Question | Decision |
| --- | --- |
| Homepage placement | An unnumbered invitation between Career (04) and Contact (05) |
| Name | Ricochet |
| Footer link | None at first; the homepage invitation is how visitors find the page |
| Level access | All five levels unlocked |
| Keyboard shortcuts | None in v1; the native buttons already support keyboard play |

## Scope

### Version 1

1. A fixed grid containing one source, rotatable mirrors, walls and one target.
2. Clicking or tapping a mirror rotates it.
3. **Fire** draws the beam's path.
4. Every shot ends in one of four outcomes: **hit**, **blocked** (wall), **escaped** (left the grid) or **loop**.
5. Five handcrafted levels, with **Reset** and **Undo**.
6. A short, quiet homepage invitation that links to `/play`.

### Later, not designed now

Movable mirrors, multiple targets, fixed mirrors, splitters, a level editor and levels shared through URLs. Version 1 commits only to keeping the level data separate from tracing and UI. Splitters and multiple targets change the single-beam model in a material way, so they will get their own design when wanted.

### Out of scope

Canvas or a `requestAnimationFrame` loop, because nothing moves continuously. Sound, timers, leaderboards, accounts and analytics are also out.

## Model

### Grid and cells

The grid is `w × h` cells, at most **6 columns** wide (see Responsive). The y axis points down. Directions are `N E S W`, with unit vectors N `(0,-1)`, E `(1,0)`, S `(0,1)` and W `(-1,0)`.

| Char | Cell | Beam entering it |
| --- | --- | --- |
| `.` | empty | continues in the same direction |
| `#` | wall | stops: **blocked** |
| `> < ^ v` | source, pointing E W N S | continues in the same direction (pass-through) |
| `T` | target | stops: **hit** |
| `/` | mirror | E→N, N→E, W→S, S→W |
| `\` | mirror | E→S, S→E, W→N, N→W |

Rotating a mirror toggles it between `/` and `\`, since a 90° turn of a diagonal mirror is exactly that toggle. The grid does not need a border of walls; a beam that leaves it has **escaped**.

### Tracing contract

- **The state is `(x, y, dir)`, where `dir` is the direction of travel as the beam *enters* cell `(x, y)`.** The same convention applies everywhere, including at the source.
- **Start:** the source emits in its own direction, so the first state is `(sx+dx, sy+dy, dir)`. The source cell itself is not part of the path. A beam that later re-enters the source cell is a normal state there and continues straight through.
- **Step:**
  1. If `(x, y)` is outside the grid, the outcome is **escaped**.
  2. Otherwise, read the cell and apply the table above. That either ends the trace or gives `dirOut`.
  3. Before recording a state, look it up in `visited: Map<stateKey, pathIndex>`. A repeated state ends the trace as **loop**, with `loopStart = visited.get(key)`.
  4. Otherwise record the state and move one cell in `dirOut`.
- **Bound:** there are at most `w·h·4` distinct states, so every trace terminates. A test asserts this as well.
- **Return value:**

```js
{
  outcome: 'hit' | 'blocked' | 'escaped' | 'loop',
  path: [{x, y, dirIn, dirOut}],   // ordered, one entry per cell entered; dirOut is null on a terminal cell
  end: {x, y, dir},                // terminal state: the target or wall cell, the first off-grid coordinate, or the repeated state
  loopStart: number | null         // index into path where the cycle begins
}
```

**Why loops need the pass-through source.** Every cell rule is reversible, so the step function is a bijection on states. A path from the source therefore cannot fall into a cycle that excludes its own first state. A loop has to return to the first state, so in v1 `loopStart` is always `0` and the whole path is the cycle. Without the pass-through rule, no level could ever loop. `loopStart` stays in the contract anyway: it is cheap, and it stays correct if a non-reversible piece is ever added.

### Level format

Levels live in `src/content/levels.json`, one level per object, with rows stored as strings so a level can be read at a glance. In JSON, a `\` mirror must be written `\\`. This sample uses `/`, which needs no escaping:

```json
{"id":"first-bounce","title":"First bounce","hint":"Mirrors turn the beam by 90°.",
 "rows":["######",
         "#>./.#",
         "#....#",
         "#..T.#",
         "######"]}
```

As shipped, the `/` sends the beam north into the wall (**blocked**). One rotation to `\` sends it south into the target. The starting orientations come from the rows themselves.

`parseLevel` throws a descriptive error unless all of the following hold:

- exactly one source and one target;
- all rows have the same length;
- the width is ≤ 6;
- every character is in the table above.

### Planned levels

The concrete grids are written and **played by hand** during commit 1. Whether the levels are enjoyable is the biggest open risk, and the solver supports judging that but cannot replace it.

| # | Teaches | Shape |
| --- | --- | --- |
| 1 | Rotating a mirror | One mirror, one rotation from solved (the sample above) |
| 2 | Chaining reflections | Two or three mirrors and a wall |
| 3 | Loops exist | A tempting arrangement sends the beam back through the source |
| 4 | Walls as constraints | Corridors force one route |
| 5 | Putting it together | Up to eight mirrors, including decoys |

## Architecture

The design follows the existing CSV demo split: a pure, tested model and a thin UI.

| File | Role |
| --- | --- |
| `src/play/model.js` | Pure functions: `parseLevel`, `rotate(mirrors, cellKey)`, `trace(level, mirrors)` and the `reducer` (exported so it can be tested). No React, no DOM, no solver. |
| `src/play/progress.js` | `loadSolved(storage, knownIds)` and `saveSolved(storage, ids)`. Storage is injected so tests can pass a fake. |
| `src/content/levels.json` | The five levels |
| `src/play/Ricochet.jsx` | The page component: the SVG board and controls around the reducer |
| `src/play/play.css` | Board styles using existing tokens, imported by the component |
| `src/App.jsx` | Add `<Route path="/play">` |
| `scripts/prerender.mjs` | Add `['/play','Ricochet']` to `titles`. This also creates the page and its canonical URL and adds it to the sitemap. |
| `src/home/PlayInvite.jsx` | The static homepage invitation |
| `tests/play.test.mjs` | Model, progress and level tests |
| `tests/solve.mjs` | The solver, used only by tests. The `tests/*.test.mjs` glob does not pick it up as a test, and the page bundle never imports it. |

### Verified against the repository

- `vite.config.js` (`devPages`) already rewrites extensionless dev paths to `case.html`, so `/play` needs no config change.
- `scripts/prerender.mjs` renders every route in `titles` through `render(route)` with `StaticRouter`, then `src/main.jsx` hydrates it, because the prerendered markup contains `<main>`.
- Pages that use `case.html` load `src/style.css` and `src/case-theme.css` from `main.jsx`. Prerender appends `public/assets/theme.css` after them in `<head>`, so `theme.css` is the final layer. A component-imported `play.css` is bundled into the same Vite CSS, so it sits before `theme.css`. Board rules need class names that `theme.css` does not target, which must be checked before writing styles.
- `tests/check-site.py` walks every `dist/**/index.html`. It already requires `/play` to have one H1, unique ids, links that resolve, safe `target=_blank` links, and the name and email in the shared footer. Its script-free check applies only to `lite/`.

### State

The reducer state is `{levelIndex, mirrors, history, shot}`.

- **Rotate:** push the previous `mirrors` onto `history`, toggle the mirror and clear `shot`, because a drawn beam is out of date once a mirror moves.
- **Fire:** `shot = trace(...)`. A shot does not enter the undo history. On a hit, the level is marked solved.
- **Undo:** pop `history` and clear `shot`. Disabled when `history` is empty.
- **Reset:** restore the level's initial mirrors and clear `history` and `shot`. Enabled when `history` is non-empty **or** a shot is visible, so it also clears a stale beam.
- **Select level:** buttons 1–5. Solved levels show a check icon as well as a colour change. Selecting a level resets its state.
- **After a hit:** a **Next level** action goes to the next unsolved level, wrapping around. When all five are solved, the result line becomes "All five levels solved." with a link back to `/#work`, and the level buttons stay usable for replay.

### Progress loading and saving

- **Render:** the first render always shows zero levels solved, matching the prerendered HTML, so hydration cannot mismatch.
- **Load, once on mount:** `loadSolved` reads the key `ricochet-solved` and validates it. The value must be a JSON array of strings, and unknown ids are dropped. Missing, malformed or wrongly typed data, or a storage accessor that throws, gives an empty set with no error.
- **Save:** happens only inside the Fire handler, when a hit adds a new id, and is wrapped in `try/catch`. There is no general "save on change" effect, so an early empty state can never overwrite stored progress. The save call merges the new id into the already-loaded set.

## UI

### Page layout (`/play`)

The page uses the shared header and the contact/footer from `App.jsx`, unchanged.

1. **Heading block** in the case-page style. The kicker is `SIDE PROJECT / PUZZLE`, the h1 is "Ricochet", and a single sentence introduces the puzzle.
2. **Guide panel.** DESIGN.md requires demonstrations to invite before the first click, so the panel states what to try ("Tap a mirror to turn it, then fire") and explains Reset and Undo.
3. **Board and controls.** On wide screens they sit side by side; below 1000px they stack, board first.
4. **Result line.** A `role="status"` live region with an icon **and** text, such as:
   - "Hit the target in 9 cells."
   - "Blocked by a wall at row 3, column 5."
   - "The beam left the grid."
   - "Loop: the beam would bounce forever."
   
   Meaning is never carried by colour alone.
5. **Without JavaScript:** the prerendered page shows level 1 with no beam, plus the guide. A `<noscript>` note says the puzzle needs JavaScript.

### Board (SVG)

- **Scaling:** the `viewBox` is in cell units (`0 0 w h`), so the board scales to its container.
- **Mirrors:** real `<button>` elements laid over the SVG on a CSS grid, rather than clickable SVG shapes. Each button covers its whole cell and has an accessible name such as "Mirror, row 2 column 4, slanted forward". The buttons need no ids, which keeps the check-site duplicate-id check trivially satisfied.
- **Other cells:** decorative SVG with `aria-hidden`. A visually hidden text description of the board sits next to it.
- **Beam:** one path drawn from the source centre through each cell centre in `path`. It ends at the target centre, at the edge of the wall cell, or at the grid boundary.
- **Loop overlay:** a second path, from `path[loopStart]` back to the repeated state, with a dashed stroke and the loop icon. In v1 this covers the whole beam, and it is still drawn as a separate overlay.
- **Colours,** using existing tokens:
  - beam: `--teal` / `--accent`;
  - target: apricot;
  - walls: the divider and main-ink tones;
  - board surface: the raised surface;
  - no purple.
  
  Check graphic contrast of at least 3:1 against the board in both themes, and add the beam and target pairs to the contrast list in `check-site.py`.
- **Fonts:** display for the h1, label for the control labels and level numbers, body for the guide and results. No monospace.
- **Icons:** from `lucide-react`, as `App.jsx` already does: `Zap` (Fire), `Undo2`, `RotateCcw`, `Check`, `Repeat`, `Ban`, `LogOut` (escaped) and `ArrowRight` (next level).

### Motion

- **Fire:** the beam is drawn with a `stroke-dashoffset` transition scaled by path length and capped at 600ms.
- **Rotate:** the mirror turns with a 120ms transform.
- **Reduced motion:** under `prefers-reduced-motion`, both changes appear instantly. Pressable controls reuse the site's existing press feedback.
- **Results:** the result text never waits for an animation to finish.

### Keyboard

- Tab moves through the mirrors, then the controls. Enter and Space rotate the focused mirror.
- There are no single-character shortcuts. WCAG 2.1.4 would require them to be remappable, or active only while the puzzle has focus, and native buttons already give full keyboard play.

### Responsive and target size

- **Standards:** WCAG 2.2 AA (2.5.8) requires targets of at least 24×24 CSS px; 44×44 is the AAA criterion (2.5.5). This repository's own rule is stricter: DESIGN.md asks for "comfortable controls of at least 44px".
- **Why 6 columns:** with 16px gutters at 320px, the content width is about 288px. Seven columns would give about 41px cells, which passes AA but breaks the house rule. Six columns give about 48px, which meets it. Hence the 6-column cap, which `parseLevel` enforces.
- **Height:** rows are not capped by width, but up to 8 rows keeps the board on one phone screen.
- **To confirm in render:** the actual gutter at 320px. If it is larger than 16px, recompute the cell size before the levels are finalised.
- **Widths to check:** 320, 375, 768, 1024 and 1440px, in both themes.

### Homepage invitation

- **Component:** `PlayInvite.jsx`, rendered by `Home.jsx` between Career and Contact. It is unnumbered, so the 01–05 section numbering stays the same, and it is not a section label.
- **Content:** one compact row with a short line ("Taking a break? Bounce a beam off some mirrors."), a small static SVG of a beam bending off a mirror, and an outlined secondary action, "Play Ricochet". The action uses the Lucide arrow icon, not a glyph.
- **Colours:** it must not reuse the contact section's teal block or the footer's `#E8E9DA` bar.
- **Markup:** the homepage is never hydrated, so the block is pure markup with a plain link and no client JS.
- **Lite:** does not link to `/play`. Lite stays script-free and free of demonstrations.

## Tests

`tests/play.test.mjs` covers the following.

- **Reflection table:** all 8 mirror and direction pairs.
- **`trace` on tiny inline grids:**
  - each of hit, blocked, escaped and loop;
  - the entry-direction convention at the source;
  - pass-through on re-entering the source;
  - `loopStart === 0` for a reversible loop;
  - `end` for each outcome;
  - termination on a grid that is entirely mirrors.
- **`rotate`:** returns a new map and leaves its input unchanged.
- **`reducer`:**
  - Undo restores the previous mirrors;
  - Reset is enabled when only a shot is visible, and clears it;
  - Rotate clears the shot;
  - Next level goes to the next unsolved level, then reaches the all-solved state.
- **`parseLevel` rejects:** a missing or duplicate source or target, ragged rows, width over 6, and unknown characters.
- **`progress`:**
  - a valid round trip;
  - malformed JSON;
  - a value that is not an array;
  - non-string entries;
  - unknown ids filtered out;
  - `getItem` and `setItem` that throw;
  - saving merges into existing ids instead of replacing them.
- **Every level in `levels.json`:**
  - it parses, with no more than 8 mirrors (asserted, because the solver enumerates 2ⁿ states);
  - it is **not** solved in its initial state;
  - `solve()` finds at least one solution and reports the **minimum number of rotations** from the initial layout;
  - the expected minimum for each level is written into the test, so later edits to a level cannot silently change its difficulty;
  - minimums should broadly rise from level 1 to level 5, and the intended route is checked by hand;
  - level 3 has a reachable layout whose shot loops.

`solve()` enumerates every mirror layout. Because each rotation is a toggle and rotations commute, the minimum number of rotations is the smallest count of mirrors that differ between the initial layout and any solving layout.

## Implementation steps

Each step is one commit.

1. **`feat: add ricochet puzzle model and levels`:** `model.js`, `progress.js`, `levels.json`, the solver and the tests. Play every level by hand (a throwaway text-mode runner is fine and stays uncommitted). Run `npm test`.
2. **`feat: add /play page for the ricochet puzzle`:** the component, route, prerender title, styles and the new contrast pairs. Read the `theme.css` cascade before writing styles.
3. **`feat: invite visitors to the puzzle from the homepage`:** `PlayInvite.jsx` and its placement in `Home.jsx`.
4. **`docs: record ricochet page rules in the design guide`:** fold the settled rules into `docs/DESIGN.md`, including the new homepage block in the section list. Delete this file and add a line to the README.

Verification for each UI step:

- `npm run build`, `python tests/check-site.py` and `npm test`.
- If browser access is available, a rendered check at the widths above in both themes, including keyboard-only play, touch, and reduced motion.
- Report any checks that could not be run.
