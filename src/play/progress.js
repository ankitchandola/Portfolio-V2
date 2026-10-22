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
