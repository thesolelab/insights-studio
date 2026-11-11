const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../funnel-core.js');
const sample = [
  ['Step', 'Users'],
  ['Visited', '12000'],
  ['Opened', '4800'],
  ['Completed', '1920'],
];
test('funnel calculates conditional/overall conversion and numerical/rate drop-offs', () => {
  const r = M.funnel(sample);
  assert.equal(r.overall, 0.16);
  assert.equal(r.steps[1].conversion, 0.4);
  assert.equal(r.steps[2].conversion, 0.4);
  assert.equal(r.steps[1].lost, 7200);
  assert.equal(r.steps[2].lost, 2880);
  assert.equal(r.steps[1].dropoff, 0.6);
  assert.equal(r.largest[0].label, 'Opened');
  assert.match(r.recap, /16.0% overall/);
  assert.match(r.recap, /7,200/);
});
test('optional headers and grouped counts retain labels/order without modifying input', () => {
  const input = [
    ['A', '12,000'],
    ['B', '4,800'],
  ];
  const copy = JSON.stringify(input);
  const r = M.funnel(input);
  assert.deepEqual(
    r.steps.map((s) => s.label),
    ['A', 'B']
  );
  assert.equal(r.steps[0].count, 12000);
  assert.equal(JSON.stringify(input), copy);
});
test('zero later steps have zero overall conversion and undefined conditional rates after zero', () => {
  const r = M.funnel([
    ['A', '10'],
    ['B', '0'],
    ['C', '0'],
  ]);
  assert.equal(r.overall, 0);
  assert.equal(r.steps[1].conversion, 0);
  assert.equal(r.steps[2].conversion, null);
  assert.equal(r.steps[2].dropoff, null);
  assert.equal(r.steps[2].lost, 0);
  assert.equal(M.percent(null), 'N/A');
  assert.equal(r.visual[2].share, 0);
  assert.doesNotMatch(r.recap, /NaN|Infinity/);
});
test('ties are explicit and unchanged counts do not invent a largest loss', () => {
  const tied = M.funnel([
    ['A', '100'],
    ['B', '80'],
    ['C', '60'],
  ]);
  assert.equal(tied.largest.length, 2);
  assert.match(tied.recap, /tied/);
  const same = M.funnel([
    ['A', '10'],
    ['B', '10'],
  ]);
  assert.equal(same.largest.length, 0);
  assert.match(same.recap, /No numerical drop/);
});
test('funnel rejects increases, zero starting population, malformed columns and out-of-range steps', () => {
  for (const rows of [
    [
      ['A', '10'],
      ['B', '11'],
    ],
    [
      ['A', '0'],
      ['B', '0'],
    ],
    [
      ['A', '10', 'extra'],
      ['B', '2'],
    ],
    [['A', '10']],
    Array.from({ length: 9 }, (_, i) => ['S' + i, '10']),
  ])
    assert.throws(() => M.funnel(rows));
});
test('counts require bounded whole values and do not coerce blanks, percentages or malformed groups', () => {
  for (const value of ['', null, -1, '1.5', '20%', '1e3', '12,34', 'x', 1e12 + 1])
    assert.throws(() => M.count(value));
  assert.equal(M.count(' 001 '), 1);
  assert.equal(M.count('1,000'), 1000);
  assert.equal(M.count('0'), 0);
});
test('adoption differentiates percentage-point change from relative growth with independent eligibility', () => {
  const r = M.adoption({
    eligibleA: 1000,
    adoptedA: 240,
    eligibleB: 1200,
    adoptedB: 360,
  });
  assert.equal(r.a.rate, 0.24);
  assert.equal(r.b.rate, 0.3);
  assert.ok(Math.abs(r.pp - 6) < 1e-10);
  assert.ok(Math.abs(r.relative - 0.25) < 1e-10);
  assert.match(r.recap, /\+6.0 percentage points/);
  assert.match(r.recap, /\+25.0%/);
  assert.deepEqual(
    r.visual.map((v) => v.share),
    [0.24, 0.3]
  );
});
test('adoption declines and zero baseline rates are handled without infinity', () => {
  const r = M.adoption({ eligibleA: 100, adoptedA: 50, eligibleB: 100, adoptedB: 0 });
  assert.equal(r.pp, -50);
  assert.equal(r.relative, -1);
  const zero = M.adoption({ eligibleA: 100, adoptedA: 0, eligibleB: 100, adoptedB: 25 });
  assert.equal(zero.relative, null);
  assert.match(zero.recap, /not defined/);
  assert.doesNotMatch(zero.recap, /Infinity|NaN/);
});
test('adoption rejects impossible eligibility and handles unchanged rates', () => {
  assert.throws(() =>
    M.adoption({ eligibleA: 0, adoptedA: 0, eligibleB: 100, adoptedB: 1 })
  );
  assert.throws(() =>
    M.adoption({ eligibleA: 100, adoptedA: 101, eligibleB: 100, adoptedB: 1 })
  );
  const r = M.adoption({ eligibleA: 100, adoptedA: 20, eligibleB: 200, adoptedB: 40 });
  assert.equal(r.pp, 0);
  assert.equal(r.relative, 0);
  assert.equal(M.signed(-0.00001), '0.0');
});
