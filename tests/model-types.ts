import type { Evaluation } from '../src/csv-model.ts';
import type { GameAction, GameState, Level, Shot } from '../src/play/model.ts';
import type { Preferences } from '../src/play/progress.ts';

// Compile-only checks: invalid public model combinations must stay unrepresentable.
export function checkModelContracts(
  level: Level,
  acceptAction: (action: GameAction) => void,
  acceptShot: (shot: Shot) => void,
  acceptState: (state: GameState) => void,
  acceptEvaluation: (result: Evaluation) => void,
  acceptPreferences: (prefs: Preferences) => void,
) {
  acceptAction({ type: 'rotate', key: '1,0' });
  acceptAction({ type: 'load', mode: 'shared', level });
  // @ts-expect-error A rotation must identify its mirror.
  acceptAction({ type: 'rotate' });
  // @ts-expect-error Campaign levels are selected, not loaded as generated puzzles.
  acceptAction({ type: 'load', mode: 'campaign', level });

  const end = { x: 0, y: 0, dir: 'E' } as const;
  acceptShot({ outcome: 'loop', loopStart: 0, path: [], end });
  acceptShot({ outcome: 'hit', loopStart: null, path: [], end });
  // @ts-expect-error Loops must identify where they start.
  acceptShot({ outcome: 'loop', loopStart: null, path: [], end });
  // @ts-expect-error Only loops have a loop index.
  acceptShot({ outcome: 'hit', loopStart: 0, path: [], end });

  const state = {
    level,
    levelIndex: 0,
    mirrors: level.mirrors,
    history: [],
    shot: null,
    solved: [],
  };
  acceptState({ ...state, mode: 'campaign', preset: null, seed: null });
  // @ts-expect-error Campaign state cannot carry generated-puzzle metadata.
  acceptState({ ...state, mode: 'campaign', preset: 'easy', seed: 'ABC123' });

  acceptEvaluation({ error: 'Invalid amount' });
  // @ts-expect-error Failed evaluations cannot expose successful comparison data.
  acceptEvaluation({ error: 'Invalid amount', after: [], difference: 0 });

  acceptPreferences({ mode: 'daily', preset: 'medium' });
  // @ts-expect-error Shared puzzles are not persisted as a startup mode.
  acceptPreferences({ mode: 'shared' });
}
