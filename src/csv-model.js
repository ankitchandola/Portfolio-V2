// This is an intentionally small, deterministic illustration, not the product engine.
export const initialState = () => ({
  scenario: 'change',
  amount: '920',
  tolerance: 0,
});
export const original = Object.freeze([
  Object.freeze({ sku: '001', item: 'Desk lamp', cents: 125000 }),
  Object.freeze({ sku: '002', item: 'Notebook set', cents: 85000 }),
  Object.freeze({ sku: '003', item: 'Planter', cents: 64000 }),
]);
export function parseAmount(value) {
  const text = String(value).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ''] = text.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents >= 0 && cents <= 10000000
    ? cents
    : null;
}
export function compare(before, after, toleranceCents = 0) {
  const group = (rows) => {
    const map = new Map();
    for (const row of rows)
      map.set(row.sku, [...(map.get(row.sku) || []), row]);
    return map;
  };
  const left = group(before),
    right = group(after);
  const result = {
    changed: [],
    unchanged: [],
    problems: [],
    added: [],
    removed: [],
  };
  for (const sku of new Set([...left.keys(), ...right.keys()])) {
    const a = left.get(sku) || [],
      b = right.get(sku) || [];
    if (a.length > 1 || b.length > 1) {
      result.problems.push(sku);
      continue;
    }
    if (!a.length) {
      result.added.push(sku);
      continue;
    }
    if (!b.length) {
      result.removed.push(sku);
      continue;
    }
    if (
      Math.abs(a[0].cents - b[0].cents) > toleranceCents ||
      a[0].item !== b[0].item
    )
      result.changed.push(sku);
    else result.unchanged.push(sku);
  }
  return result;
}
export function evaluate(state) {
  const amount = parseAmount(state.amount);
  if (!['change', 'reorder', 'duplicate'].includes(state.scenario))
    throw new Error('Unknown demo scenario');
  if (
    !Number.isInteger(state.tolerance) ||
    state.tolerance < 0 ||
    state.tolerance > 100
  )
    throw new Error('Tolerance out of range');
  if (state.scenario === 'change' && amount === null)
    return {
      error:
        'Enter an amount from ₹0 to ₹100,000 with up to two decimal places.',
    };
  let after = original.map((row) => ({ ...row }));
  if (state.scenario === 'change') after[1].cents = amount;
  if (state.scenario === 'reorder') after = [after[2], after[0], after[1]];
  if (state.scenario === 'duplicate') after.push({ ...after[1] });
  return {
    after,
    difference: amount === null ? 0 : Math.abs(amount - original[1].cents),
    ...compare(original, after, state.tolerance * 100),
  };
}
export function money(cents) {
  const absolute = Math.abs(cents);
  return `${cents < 0 ? '-' : ''}${Math.floor(absolute / 100).toLocaleString('en-IN')}.${String(absolute % 100).padStart(2, '0')}`;
}
