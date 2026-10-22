import { initialState, original, evaluate, money } from '../csv-model.js';
const $ = (id) => document.getElementById(id);
let state = initialState();
const amount = $('amount'),
  tolerance = $('tolerance');
const scenarios = [...document.querySelectorAll('[data-scenario]')];
function tableRows(rows, result) {
  const fragment = document.createDocumentFragment();
  for (const row of rows) {
    const tr = document.createElement('tr');
    let marker = '';
    if (result.problems.includes(row.sku)) {
      tr.className = 'row-problem';
      marker = ' !';
    } else if (result.changed.includes(row.sku)) {
      tr.className = 'row-changed';
      marker = ' ↗';
    } else if (state.scenario !== 'change' || state.amount !== '920')
      tr.className = 'row-matched';
    for (const [index, value] of [
      row.sku,
      row.item,
      money(row.cents) + marker,
    ].entries()) {
      const td = document.createElement('td');
      td.textContent = value;
      if (marker && index === 2)
        td.setAttribute(
          'aria-label',
          `${money(row.cents)} rupees, ${marker.includes('!') ? 'duplicate key' : 'changed'}`,
        );
      tr.append(td);
    }
    fragment.append(tr);
  }
  return fragment;
}
function render() {
  const result = evaluate(state);
  const isChange = state.scenario === 'change';
  amount.disabled = !isChange;
  tolerance.disabled = !isChange;
  $('tolerance-value').textContent = '₹' + state.tolerance;
  for (const button of scenarios) {
    const active = button.dataset.scenario === state.scenario;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  $('input-error').textContent = result.error || '';
  amount.setAttribute('aria-invalid', result.error ? 'true' : 'false');
  amount.setAttribute('aria-describedby', 'input-error');
  if (result.error) {
    $('result-title').textContent = 'Let’s check that amount';
    $('result-description').textContent =
      'The tables still show your last valid comparison. Enter a valid amount to update them.';
    $('result-icon').dataset.icon = 'problem';
    $('result-badge').textContent = 'Needs input';
    $('demo-result').className = 'demo-result problem';
    $('demo-tip').textContent =
      'For example, try 920 or 850.01. Negative values and more than two decimal places are outside this demo.';
    return;
  }
  $('after-rows').replaceChildren(tableRows(result.after, result));
  const problem = result.problems.length > 0,
    changed = result.changed.length > 0;
  $('demo-result').className =
    'demo-result ' + (problem ? 'problem' : changed ? '' : 'success');
  $('result-icon').dataset.icon = problem
    ? 'problem'
    : changed
      ? 'changed'
      : 'clear';
  $('result-badge').textContent = result.unchanged.length + ' unchanged';
  if (problem) {
    $('result-title').textContent = '1 ambiguous key. No guessing.';
    $('result-description').textContent =
      'SKU 002 appears twice in today’s file. Both rows are flagged for review, rather than matched arbitrarily.';
    $('demo-tip').textContent =
      'The detail that matters → A duplicate is a problem to resolve, not a new or changed record.';
  } else if (state.scenario === 'reorder') {
    $('result-title').textContent = 'Same records. Zero changes.';
    $('result-description').textContent =
      'The row order moved, but every SKU still matches. Identity matters more than position.';
    $('demo-tip').textContent =
      'Try this → Switch to “A price changed” to edit an amount and experiment with tolerance.';
  } else if (changed) {
    $('result-title').textContent = '1 changed record';
    $('result-description').textContent =
      `SKU 002 went from ₹850.00 to ₹${money(result.after[1].cents)}. That’s a ₹${money(result.difference)} difference.`;
    $('demo-tip').textContent =
      result.difference <= 10000
        ? `Try this → Move the tolerance to ₹${Math.ceil(result.difference / 100)}. The difference falls within your rule.`
        : 'Try this → Set the new amount to ₹920, then move tolerance to ₹70 to see a difference accepted.';
  } else {
    $('result-title').textContent =
      result.difference === 0
        ? 'An exact match. All clear.'
        : 'Within your rules. All clear.';
    $('result-description').textContent =
      result.difference === 0
        ? 'Both files have the same records and amounts. There’s nothing to review.'
        : `The ₹${money(result.difference)} difference is within your ₹${state.tolerance} tolerance. All 3 records are treated as unchanged.`;
    $('demo-tip').textContent =
      'Your rule, applied consistently → The full tool lets you save these choices as a reusable profile.';
  }
}
for (const button of scenarios)
  button.addEventListener('click', () => {
    state.scenario = button.dataset.scenario;
    render();
  });
amount.addEventListener('input', () => {
  state.amount = amount.value;
  render();
});
tolerance.addEventListener('input', () => {
  state.tolerance = Number(tolerance.value);
  render();
});
$('reset').addEventListener('click', () => {
  state = initialState();
  amount.value = state.amount;
  tolerance.value = state.tolerance;
  render();
});
render();

// Optional code-style name loop. Identity remains available in a static heading.
const phrases = [
  '<ankit chandola>',
  '</>',
  '<full stack developer>',
  '<problem solver>',
  '<tool builder>',
];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const morph = $('morph'),
  motionButton = $('motion');
let paused = false,
  index = 0,
  timeout = null,
  frame = null;
try {
  paused = localStorage.getItem('ankit-motion-paused') === 'true';
} catch {
  /* Storage is optional. */
}
function stopLoop() {
  clearTimeout(timeout);
  cancelAnimationFrame(frame);
}
function canAnimate() {
  return !paused && !reduced.matches && !document.hidden;
}
function loop() {
  stopLoop();
  if (!canAnimate()) return;
  timeout = setTimeout(() => {
    const from = morph.textContent,
      next = phrases[++index % phrases.length],
      start = performance.now();
    const symbols = '<>/_{}';
    function tick(now) {
      if (!canAnimate()) return;
      const progress = Math.min(1, (now - start) / 620);
      const length = Math.round(
        from.length + (next.length - from.length) * progress,
      );
      const revealed = Math.floor(next.length * progress);
      morph.textContent =
        progress === 1
          ? next
          : Array.from({ length }, (_, i) =>
              i < revealed
                ? next[i] || ''
                : symbols[(i + Math.floor(progress * 18)) % symbols.length],
            ).join('');
      if (progress < 1) frame = requestAnimationFrame(tick);
      else loop();
    }
    frame = requestAnimationFrame(tick);
  }, 2600);
}
function applyMotion() {
  stopLoop();
  const stopped = paused || reduced.matches;
  document.body.classList.toggle('motion-paused', stopped);
  motionButton.setAttribute('aria-pressed', String(stopped));
  $('motion-label').textContent = reduced.matches
    ? 'Motion reduced'
    : paused
      ? 'Play motion'
      : 'Pause motion';
  motionButton.disabled = reduced.matches;
  morph.textContent = phrases[0];
  index = 0;
  loop();
}
motionButton.addEventListener('click', () => {
  paused = !paused;
  try {
    localStorage.setItem('ankit-motion-paused', String(paused));
  } catch {}
  applyMotion();
});
reduced.addEventListener('change', applyMotion);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopLoop();
  else applyMotion();
});
applyMotion();
