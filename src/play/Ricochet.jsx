import React, { useEffect, useReducer, useRef, useState } from 'react';
import {
  Zap,
  Undo2,
  RotateCcw,
  Check,
  Repeat,
  Ban,
  LogOut,
  ArrowRight,
  ArrowUpRight,
  Link2,
  Shuffle,
} from 'lucide-react';
import raw from '../content/levels.json';
import {
  parseLevel,
  createReducer,
  initialState,
  canUndo,
  canReset,
  allSolved,
  trace,
  DIRS,
} from './model';
import { loadSolved, saveSolved, loadPrefs, savePrefs } from './progress';
import {
  PRESETS,
  generatePuzzle,
  dailySeed,
  encodeLevel,
  decodeLevel,
} from './generate';
import { randomSeed } from './random';
import './play.css';
const levels = raw.map(parseLevel);
const reducer = createReducer(levels);
const browserStorage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};
// The beam starts at the source arrow's tip and stops at the target's outer ring, in cell units from the centre.
const SOURCE_TIP = 0.2;
const TARGET_RADIUS = 0.34;
const PRESET_LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const MODES = [
  ['campaign', 'Levels'],
  ['random', 'Random'],
  ['daily', 'Today'],
];
const SEED = /^[0-9A-Z]{1,12}$/;
const displayDate = (iso) =>
  new Date(`${iso}T00:00:00Z`)
    .toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })
    .toUpperCase();

function randomPuzzle(preset, seed = randomSeed()) {
  const level = generatePuzzle(seed, PRESETS[preset]);
  return level && { type: 'load', mode: 'random', level, preset, seed };
}
function dailyPuzzle(now = new Date()) {
  const level = generatePuzzle(dailySeed(now), PRESETS.medium);
  const date = now.toISOString().slice(0, 10);
  return (
    level && {
      type: 'load',
      mode: 'daily',
      level,
      preset: 'medium',
      seed: date,
    }
  );
}
const shareQuery = (level, preset) =>
  `?l=${encodeLevel(level)}${preset ? `&d=${preset}` : ''}`;
function queryFor({ mode, level, preset, seed }) {
  if (mode === 'random') return `?seed=${seed}&d=${preset}`;
  if (mode === 'daily') return '?mode=today';
  if (mode === 'shared') return shareQuery(level, preset);
  return '';
}
// replaceState keeps reload and back sensible without adding routes for every puzzle.
function replaceQuery(query) {
  window.history.replaceState(null, '', window.location.pathname + query);
}
// URL parameters win over saved preferences: opening a link means wanting that puzzle.
function startingAction(search, prefs) {
  const params = new URLSearchParams(search);
  const preset = PRESETS[params.get('d')] ? params.get('d') : null;
  if (params.has('l')) {
    const level = decodeLevel(params.get('l'));
    return level
      ? { type: 'load', mode: 'shared', level, preset }
      : { invalidLink: true };
  }
  const seed = params.get('seed')?.toUpperCase();
  if (seed && SEED.test(seed)) return randomPuzzle(preset ?? 'medium', seed);
  if (params.get('mode') === 'today') return dailyPuzzle();
  if (prefs.mode === 'random') return randomPuzzle(prefs.preset ?? 'medium');
  if (prefs.mode === 'daily') return dailyPuzzle();
  return null;
}
const pointing = { N: 'up', E: 'right', S: 'down', W: 'left' };
const place = (x, y) => `row ${y + 1}, column ${x + 1}`;

function describe(level) {
  const { w, h, rows } = level,
    cells = rows.flatMap((row, y) => [...row].map((c, x) => ({ c, x, y })));
  const edge = ({ x, y }) => x === 0 || y === 0 || x === w - 1 || y === h - 1;
  const walled = cells.filter(edge).every(({ c }) => c === '#');
  const walls = cells
    .filter((cell) => cell.c === '#' && !(walled && edge(cell)))
    .map(({ x, y }) => place(x, y));
  const mirrors = Object.keys(level.mirrors).length;
  return `${w} columns by ${h} rows${walled ? ', surrounded by a wall' : ''}. The beam starts at ${place(level.source.x, level.source.y)}, pointing ${pointing[level.source.dir]}. The target is at ${place(level.target.x, level.target.y)}. ${mirrors} ${mirrors === 1 ? 'mirror' : 'mirrors'}. ${walls.length ? `Walls at ${walls.join('; ')}.` : walled ? 'No other walls.' : 'No walls.'}`;
}
function beamPoints(level, shot) {
  const centre = ({ x, y }) => [x + 0.5, y + 0.5];
  const [dx, dy] = DIRS[level.source.dir];
  const tip = [
    level.source.x + 0.5 + dx * SOURCE_TIP,
    level.source.y + 0.5 + dy * SOURCE_TIP,
  ];
  const points = [tip, ...shot.path.map(centre)];
  const { x, y, dir } = shot.end;
  const backFromCentre = (distance) => [
    x + 0.5 - DIRS[dir][0] * distance,
    y + 0.5 - DIRS[dir][1] * distance,
  ];
  if (shot.outcome === 'hit')
    points[points.length - 1] = backFromCentre(TARGET_RADIUS);
  if (shot.outcome === 'blocked')
    points[points.length - 1] = backFromCentre(0.5);
  if (shot.outcome === 'escaped') points.push(backFromCentre(0.5));
  if (shot.outcome === 'loop') points.push(centre(shot.end));
  return points;
}
const toPath = (points) =>
  points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');

function Board({ level, mirrors, shot, shotCount, onRotate, onFire }) {
  const cells = level.rows.flatMap((row, y) =>
    [...row].map((c, x) => ({ c, x, y })),
  );
  const points = shot && beamPoints(level, shot);
  const loop = shot?.outcome === 'loop' && points.slice(shot.loopStart + 1);
  const drawMs = points ? Math.min(600, points.length * 45) : 0;
  const { source, target } = level,
    [dx, dy] = DIRS[source.dir];
  return (
    <div
      className="ricochet-board"
      style={{ '--cols': level.w, '--rows': level.h }}
    >
      <svg
        viewBox={`0 0 ${level.w} ${level.h}`}
        aria-hidden="true"
        focusable="false"
      >
        {cells.map(({ x, y }) => (
          <rect
            key={`g${x}-${y}`}
            className="rc-cell"
            x={x}
            y={y}
            width="1"
            height="1"
          />
        ))}
        {cells
          .filter(({ c }) => c === '#')
          .map(({ x, y }) => (
            <rect
              key={`w${x}-${y}`}
              className="rc-wall"
              x={x + 0.06}
              y={y + 0.06}
              width=".88"
              height=".88"
              rx=".08"
            />
          ))}
        <g
          className={shot?.outcome === 'hit' ? 'rc-target is-hit' : 'rc-target'}
        >
          <circle cx={target.x + 0.5} cy={target.y + 0.5} r={TARGET_RADIUS} />
          <circle cx={target.x + 0.5} cy={target.y + 0.5} r=".14" />
        </g>
        <g className="rc-source">
          <circle cx={source.x + 0.5} cy={source.y + 0.5} r=".3" />
          <path
            d={`M${source.x + 0.5 + dx * SOURCE_TIP} ${source.y + 0.5 + dy * SOURCE_TIP} L${source.x + 0.5 - dx * 0.1 + dy * 0.13} ${source.y + 0.5 - dy * 0.1 + dx * 0.13} L${source.x + 0.5 - dx * 0.1 - dy * 0.13} ${source.y + 0.5 - dy * 0.1 - dx * 0.13}Z`}
          />
        </g>
        {Object.entries(mirrors).map(([key, m]) => {
          const [x, y] = key.split(',').map(Number);
          return (
            <g key={key}>
              <circle
                className="rc-mirror-ring"
                cx={x + 0.5}
                cy={y + 0.5}
                r=".4"
              />
              <line
                className={m === '/' ? 'rc-mirror' : 'rc-mirror is-back'}
                x1={x + 0.2}
                y1={y + 0.8}
                x2={x + 0.8}
                y2={y + 0.2}
              />
            </g>
          );
        })}
        {points && (
          <path
            key={'beam' + shotCount}
            className="rc-beam"
            d={toPath(points)}
            pathLength="1"
            style={{ '--draw': drawMs + 'ms' }}
          />
        )}
        {loop && (
          <path
            key={'loop' + shotCount}
            className="rc-loop"
            d={toPath([points[shot.loopStart], ...loop])}
            style={{ '--draw': drawMs + 'ms' }}
          />
        )}
      </svg>
      <div className="ricochet-cells">
        <button
          type="button"
          className="ricochet-source"
          style={{ gridColumn: source.x + 1, gridRow: source.y + 1 }}
          onClick={onFire}
          aria-label={`Fire the beam from ${place(source.x, source.y)}, pointing ${pointing[source.dir]}`}
        />
        {Object.entries(mirrors).map(([key, m]) => {
          const [x, y] = key.split(',').map(Number);
          return (
            <button
              key={key}
              type="button"
              className="ricochet-mirror"
              style={{ gridColumn: x + 1, gridRow: y + 1 }}
              onClick={() => onRotate(key)}
              aria-label={`Mirror, ${place(x, y)}, slanted ${m === '/' ? 'forward' : 'backward'}`}
            />
          );
        })}
      </div>
    </div>
  );
}

function Result({ shot, mode, solvedAll, onNext, onNew }) {
  if (!shot)
    return <p className="ricochet-result">Turn the mirrors, then fire.</p>;
  const { x, y } = shot.end;
  const [Icon, text] = {
    hit: [Check, `Hit the target in ${shot.path.length} cells.`],
    blocked: [Ban, `Blocked by a wall at ${place(x, y)}.`],
    escaped: [LogOut, 'The beam left the grid.'],
    loop: [Repeat, 'Loop: the beam would bounce forever.'],
  }[shot.outcome];
  let after = null;
  if (shot.outcome === 'hit' && mode !== 'campaign')
    after = (
      <button type="button" className="solid-button" onClick={onNew}>
        New puzzle
        <Shuffle size={22} />
      </button>
    );
  else if (shot.outcome === 'hit')
    after = solvedAll ? (
      <p className="ricochet-done">
        All five levels solved.{' '}
        <a href="/#work">
          Back to the work
          <ArrowUpRight size={20} />
        </a>
      </p>
    ) : (
      <button type="button" className="solid-button" onClick={onNext}>
        Next level
        <ArrowRight size={22} />
      </button>
    );
  return (
    <div className={'ricochet-result is-' + shot.outcome}>
      <p>
        <Icon size={24} aria-hidden="true" />
        <span>{text}</span>
      </p>
      {after}
    </div>
  );
}

function Heading({ state, solvedToday, headingRef }) {
  const { mode, level, preset, seed } = state;
  const kicker = {
    campaign: `LEVEL ${state.levelIndex + 1} OF ${levels.length}`,
    random: `RANDOM · ${PRESET_LABELS[preset]?.toUpperCase()} · SEED ${seed}`,
    daily: `PUZZLE OF THE DAY · ${seed && displayDate(seed)}`,
    shared: `SHARED PUZZLE${preset ? ` · ${PRESET_LABELS[preset].toUpperCase()}` : ''}`,
  }[mode];
  return (
    <div className="ricochet-level-heading">
      <span className="kicker">{kicker}</span>
      <h2 ref={headingRef} tabIndex={-1}>
        {mode === 'campaign'
          ? level.title
          : mode === 'shared'
            ? 'Shared puzzle'
            : 'Generated puzzle'}
      </h2>
      <p>{level.hint}</p>
      {mode === 'daily' && solvedToday && (
        <p className="ricochet-solved-today">
          <Check size={20} aria-hidden="true" />
          Solved today
        </p>
      )}
    </div>
  );
}

function ShareFallback({ url }) {
  const input = useRef(null);
  useEffect(() => input.current?.select(), [url]);
  return (
    <label className="ricochet-share">
      Copy this link
      <input
        ref={input}
        readOnly
        value={url}
        onFocus={(e) => e.target.select()}
      />
    </label>
  );
}

export default function Ricochet() {
  const [state, dispatch] = useReducer(reducer, levels, initialState);
  const [shotCount, setShotCount] = useState(0);
  const [ui, setUi] = useReducer(
    (current, patch) => ({
      ...current,
      ...(typeof patch === 'function' ? patch(current) : patch),
    }),
    { prefs: {}, notice: '', shareUrl: '' },
  );
  const { prefs, notice, shareUrl } = ui;
  const heading = useRef(null),
    focusHeading = useRef(false);
  const { level, mode } = state;

  useEffect(() => {
    const storage = browserStorage();
    const ids = loadSolved(
      storage,
      levels.map((l) => l.id),
    );
    if (ids.length) dispatch({ type: 'loaded', ids });
    const saved = loadPrefs(storage);
    const action = startingAction(window.location.search, saved);
    setUi({
      prefs: saved,
      notice: action?.invalidLink ? "That puzzle link isn't valid." : '',
    });
    if (action?.type) {
      dispatch(action);
      replaceQuery(queryFor(action));
    } else if (window.location.search) replaceQuery('');
  }, []);
  useEffect(() => {
    if (!focusHeading.current) return;
    focusHeading.current = false;
    heading.current?.focus();
  }, [level]);

  const remember = (patch) => {
    savePrefs(browserStorage(), patch);
    setUi((current) => ({ prefs: { ...current.prefs, ...patch } }));
  };
  const open = (action) => {
    if (!action) {
      setUi({
        notice: "Couldn't build a puzzle just now. Try again.",
        shareUrl: '',
      });
      return;
    }
    setUi({ notice: '', shareUrl: '' });
    focusHeading.current = true;
    dispatch(action);
    replaceQuery(queryFor(action));
  };
  const act = (action) => {
    setUi({ notice: '', shareUrl: '' });
    dispatch(action);
  };
  const chooseMode = (next) => {
    if (next === 'campaign')
      open({ type: 'select', index: state.levelIndex, mode: 'campaign' });
    if (next === 'random') open(randomPuzzle(prefs.preset ?? 'medium'));
    if (next === 'daily') open(dailyPuzzle());
    remember({ mode: next });
  };
  const chooseDifficulty = (preset) => {
    open(randomPuzzle(preset));
    remember({ mode: 'random', preset });
  };
  const newPuzzle = () => {
    open(
      randomPuzzle(
        mode === 'daily'
          ? 'medium'
          : (state.preset ?? prefs.preset ?? 'medium'),
      ),
    );
    remember({ mode: 'random' });
  };
  const fire = () => {
    act({ type: 'fire' });
    setShotCount((n) => n + 1);
    if (trace(level, state.mirrors).outcome !== 'hit') return;
    if (mode === 'campaign' && !state.solved.includes(level.id))
      saveSolved(browserStorage(), [level.id]);
    if (mode === 'daily') remember({ dailySolved: state.seed });
  };
  const copyLink = async () => {
    const url =
      window.location.origin +
      window.location.pathname +
      shareQuery(level, state.preset);
    try {
      await navigator.clipboard.writeText(url);
      setUi({ notice: 'Link copied.', shareUrl: '' });
    } catch {
      setUi({ notice: '', shareUrl: url });
    }
  };

  return (
    <section className="case-page shell ricochet">
      <div className="case-page-heading">
        <span className="kicker">SIDE PROJECT / PUZZLE</span>
        <h1>Ricochet</h1>
        <p>Turn the mirrors so the beam bounces into the target.</p>
      </div>
      <noscript>
        <p className="ricochet-noscript">
          The puzzle needs JavaScript. Level 1 is shown below as a preview.
        </p>
      </noscript>
      <div className="ricochet-layout">
        <div className="ricochet-stage">
          <div className="ricochet-modes" role="group" aria-label="Puzzle type">
            {MODES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => chooseMode(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <Heading
            state={state}
            solvedToday={mode === 'daily' && prefs.dailySolved === state.seed}
            headingRef={heading}
          />
          <p className="sr-only">{describe(level)}</p>
          <Board
            level={level}
            mirrors={state.mirrors}
            shot={state.shot}
            shotCount={shotCount}
            onRotate={(key) => act({ type: 'rotate', key })}
            onFire={fire}
          />
        </div>
        <div className="ricochet-panel">
          <div className="ricochet-controls">
            <button type="button" className="solid-button" onClick={fire}>
              <Zap size={22} />
              Fire
            </button>
            <button
              type="button"
              className="ricochet-button"
              onClick={() => act({ type: 'undo' })}
              disabled={!canUndo(state)}
            >
              <Undo2 size={22} />
              Undo
            </button>
            <button
              type="button"
              className="ricochet-button"
              onClick={() => act({ type: 'reset' })}
              disabled={!canReset(state)}
            >
              <RotateCcw size={22} />
              Reset
            </button>
            {mode !== 'campaign' && (
              <button
                type="button"
                className="ricochet-button"
                onClick={copyLink}
              >
                <Link2 size={22} />
                Copy link
              </button>
            )}
          </div>
          {shareUrl && <ShareFallback url={shareUrl} />}
          <div role="status" aria-live="polite" aria-atomic="true">
            {notice && <p className="ricochet-notice">{notice}</p>}
            <Result
              shot={state.shot}
              mode={mode}
              solvedAll={allSolved(levels, state.solved)}
              onNext={() => open({ type: 'next' })}
              onNew={newPuzzle}
            />
          </div>
          {mode === 'campaign' && (
            <div className="ricochet-levels">
              <span className="kicker" aria-hidden="true">
                LEVELS
              </span>
              <div role="group" aria-label="Choose a level">
                {levels.map((l, i) => {
                  const solved = state.solved.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      type="button"
                      aria-pressed={i === state.levelIndex}
                      aria-label={`Level ${i + 1}, ${l.title}${solved ? ', solved' : ''}`}
                      onClick={() =>
                        open({ type: 'select', index: i, mode: 'campaign' })
                      }
                    >
                      {i + 1}
                      {solved && <Check size={16} aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {mode === 'random' && (
            <div className="ricochet-levels">
              <span className="kicker" aria-hidden="true">
                DIFFICULTY
              </span>
              <div role="group" aria-label="Choose a difficulty">
                {Object.entries(PRESET_LABELS).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={state.preset === value}
                    onClick={() => chooseDifficulty(value)}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  className="ricochet-new"
                  onClick={newPuzzle}
                >
                  <Shuffle size={18} aria-hidden="true" />
                  New puzzle
                </button>
              </div>
            </div>
          )}
          <div className="ricochet-guide">
            <h2>How to play</h2>
            <ol>
              <li>Tap a mirror to turn it a quarter turn.</li>
              <li>
                Press Fire, or tap the beam’s starting arrow, to send the beam.
              </li>
              <li>
                Reach the target. Walls stop the beam, edges let it escape, and
                some layouts send it round in circles.
              </li>
              <li>
                Undo takes back your last turn. Reset starts the puzzle again.
              </li>
              <li>
                Random builds a fresh puzzle at the difficulty you choose. Today
                is the same puzzle for everyone, changing at midnight UTC.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
