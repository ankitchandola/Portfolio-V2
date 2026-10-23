// This is an intentionally small, deterministic illustration, not the product engine.
export type Scenario = 'change' | 'reorder' | 'duplicate';
export interface ComparisonState {
  scenario: Scenario;
  amount: string;
  tolerance: number;
}
export interface ComparisonRow {
  sku: string;
  item: string;
  cents: number;
}
export interface Comparison {
  changed: string[];
  unchanged: string[];
  problems: string[];
  added: string[];
  removed: string[];
}
export interface EvaluationSuccess extends Comparison {
  after: ComparisonRow[];
  difference: number;
  error?: never;
}
export type EvaluationError = {
  error: string;
} & Partial<Record<keyof Omit<EvaluationSuccess, 'error'>, never>>;
export type Evaluation = EvaluationSuccess | EvaluationError;

export const initialState = (): ComparisonState => ({
  scenario: 'change',
  amount: '920',
  tolerance: 0,
});
export const original: readonly [
  Readonly<ComparisonRow>,
  Readonly<ComparisonRow>,
  Readonly<ComparisonRow>,
] = Object.freeze([
  Object.freeze({ sku: '001', item: 'Desk lamp', cents: 125000 }),
  Object.freeze({ sku: '002', item: 'Notebook set', cents: 85000 }),
  Object.freeze({ sku: '003', item: 'Planter', cents: 64000 }),
]);
export function parseAmount(value: unknown): number | null {
  const text = String(value).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ''] = text.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents >= 0 && cents <= 10000000
    ? cents
    : null;
}
export function compare(
  before: readonly Readonly<ComparisonRow>[],
  after: readonly Readonly<ComparisonRow>[],
  toleranceCents = 0,
): Comparison {
  const group = (rows: readonly Readonly<ComparisonRow>[]) => {
    const map = new Map<string, Readonly<ComparisonRow>[]>();
    for (const row of rows)
      map.set(row.sku, [...(map.get(row.sku) || []), row]);
    return map;
  };
  const left = group(before),
    right = group(after);
  const result: Comparison = {
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
    const first = a[0],
      second = b[0];
    if (!first) {
      result.added.push(sku);
      continue;
    }
    if (!second) {
      result.removed.push(sku);
      continue;
    }
    if (
      Math.abs(first.cents - second.cents) > toleranceCents ||
      first.item !== second.item
    )
      result.changed.push(sku);
    else result.unchanged.push(sku);
  }
  return result;
}
export function evaluate(state: ComparisonState): Evaluation {
  const amount = parseAmount(state.amount);
  if (!['change', 'reorder', 'duplicate'].includes(state.scenario))
    throw new Error('Unknown demo scenario');
  if (
    !Number.isInteger(state.tolerance) ||
    state.tolerance < 0 ||
    state.tolerance > 100
  )
    throw new Error('Tolerance out of range');
  let after: [ComparisonRow, ComparisonRow, ComparisonRow, ...ComparisonRow[]] =
    [{ ...original[0] }, { ...original[1] }, { ...original[2] }];
  if (state.scenario === 'change') {
    if (amount === null)
      return {
        error:
          'Enter an amount from ₹0 to ₹100,000 with up to two decimal places.',
      };
    after[1].cents = amount;
  }
  if (state.scenario === 'reorder') after = [after[2], after[0], after[1]];
  if (state.scenario === 'duplicate') after.push({ ...after[1] });
  return {
    after,
    difference: amount === null ? 0 : Math.abs(amount - original[1].cents),
    ...compare(original, after, state.tolerance * 100),
  };
}
export function money(cents: number): string {
  const absolute = Math.abs(cents);
  return `${cents < 0 ? '-' : ''}${Math.floor(absolute / 100).toLocaleString('en-IN')}.${String(absolute % 100).padStart(2, '0')}`;
}
