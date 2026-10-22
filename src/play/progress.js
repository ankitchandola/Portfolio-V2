export const STORAGE_KEY = 'ricochet-solved';
function read(storage) {
  try {
    const value = JSON.parse(storage.getItem(STORAGE_KEY));
    return Array.isArray(value)
      ? value.filter((id) => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}
export function loadSolved(storage, knownIds) {
  const known = new Set(knownIds);
  return [...new Set(read(storage))].filter((id) => known.has(id));
}
// Merges with what is already stored, so a save from an unloaded state never erases progress.
export function saveSolved(storage, ids) {
  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify([...new Set([...read(storage), ...ids])]),
    );
    return true;
  } catch {
    return false;
  }
}

export const PREFS_KEY = 'ricochet-prefs';
const SAVED_MODES = ['campaign', 'random', 'daily'];
const PRESET_NAMES = ['easy', 'medium', 'hard'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
function readPrefs(storage) {
  try {
    const value = JSON.parse(storage.getItem(PREFS_KEY));
    if (value?.v !== 1) return {};
    const prefs = {};
    if (SAVED_MODES.includes(value.mode)) prefs.mode = value.mode;
    if (PRESET_NAMES.includes(value.preset)) prefs.preset = value.preset;
    if (typeof value.dailySolved === 'string' && DATE.test(value.dailySolved))
      prefs.dailySolved = value.dailySolved;
    return prefs;
  } catch {
    return {};
  }
}
// Saved data is untrusted: each field is kept only if valid, and nothing here is needed to play.
export const loadPrefs = (storage) => readPrefs(storage);
export function savePrefs(storage, patch) {
  try {
    storage.setItem(
      PREFS_KEY,
      JSON.stringify({ ...readPrefs(storage), ...patch, v: 1 }),
    );
    return true;
  } catch {
    return false;
  }
}
