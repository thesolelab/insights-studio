const test = require('node:test');
const assert = require('node:assert/strict');
const { forDate } = require('../home-core.js');
test('daily messages are stable within a local calendar day and change the following day', () => {
  const first = forDate(new Date(2026, 10, 11, 0, 0, 1));
  assert.deepEqual(forDate(new Date(2026, 10, 11, 23, 59, 59)), first);
  assert.equal(first.headline, 'Make room for the work that matters.');
  assert.notDeepEqual(forDate(new Date(2026, 10, 12)), first);
});
test('calendar-day selection handles month/year/leap boundaries and earlier dates', () => {
  for (const [year, month, day] of [
    [2026, 11, 31],
    [2028, 1, 28],
    [2028, 1, 29],
    [2026, 2, 8],
    [2026, 10, 1],
    [2000, 0, 1],
  ]) {
    const first = forDate(new Date(year, month, day, 12));
    assert.ok(first.headline && first.detail);
    assert.notDeepEqual(forDate(new Date(year, month, day + 1, 12)), first);
  }
  assert.throws(() => forDate(new Date(NaN)), /valid date/);
});
test('all 31 curated messages are distinct and cycle deterministically without randomness', () => {
  const days = Array.from(
    { length: 31 },
    (_, i) => forDate(new Date(2026, 10, 11 + i)).headline
  );
  assert.equal(new Set(days).size, 31);
  assert.deepEqual(forDate(new Date(2026, 10, 42)), forDate(new Date(2026, 10, 11)));
});
