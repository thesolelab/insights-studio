const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

// Load the plain browser script without submitting the form or rendering a chart.
const elements = new Map();
const source = readFileSync(join(__dirname, '..', 'app.js'), 'utf8');
const generate = vm.runInNewContext(source + '\n;generateSampleData;', {
  document: {
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, { value: '', addEventListener() {}, requestSubmit() {} });
      }
      return elements.get(id);
    }
  }
});

function assertValid(sample) {
  for (const suffix of ['A', 'B']) {
    const visitors = sample['visitors' + suffix];
    const conversions = sample['conversions' + suffix];
    assert.ok(Number.isSafeInteger(visitors));
    assert.ok(Number.isSafeInteger(conversions));
    assert.ok(visitors >= 10000 && visitors <= 100000);
    assert.ok(conversions >= 5);
    assert.ok(visitors - conversions >= 5);
  }
}

test('sample generation remains valid at both random-number boundaries', () => {
  const low = generate(() => 0);
  const high = generate(() => 1 - Number.EPSILON);
  assertValid(low);
  assertValid(high);
  assert.equal(low.visitorsA, 10000);
  assert.equal(high.visitorsA, 100000);
});

test('varied samples satisfy the calculator limits and include gains and losses', () => {
  let seed = 1;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const unique = new Set();
  let gains = 0;
  let losses = 0;
  for (let i = 0; i < 10000; i++) {
    const sample = generate(random);
    assertValid(sample);
    unique.add(JSON.stringify(sample));
    const difference = sample.conversionsB / sample.visitorsB - sample.conversionsA / sample.visitorsA;
    if (difference > 0) gains++;
    if (difference < 0) losses++;
  }
  assert.equal(unique.size, 10000);
  assert.ok(gains > 0 && losses > 0);
});
