const test = require('node:test');
const assert = require('node:assert/strict');
const K = require('../utility-core.js');
test('data append, duplicate finding and pivots retain numeric meaning', () => {
  const rows = [
    ['Group', 'Value'],
    ['A', '10'],
    ['B', '20'],
    ['A', '30'],
  ];
  assert.deepEqual(K.duplicates(rows, 'Group'), [
    ['Group', 'Value'],
    ['A', '10'],
    ['A', '30'],
  ]);
  assert.deepEqual(K.pivot(rows, 'Group', 'Value', 'sum'), [
    ['Group', 'sum Value'],
    ['A', '40'],
    ['B', '20'],
  ]);
  assert.deepEqual(K.pivot(rows, 'Group', 'Value', 'mean').slice(1), [
    ['A', '20'],
    ['B', '20'],
  ]);
  assert.deepEqual(K.pivot(rows, 'Group', 'Value', 'count').slice(1), [
    ['A', '2'],
    ['B', '1'],
  ]);
  assert.equal(K.append([rows, rows]).length, 7);
  assert.throws(() => K.append([rows, [['Other'], ['x']]]), /identical/);
  assert.throws(
    () =>
      K.pivot(
        [
          ['Group', 'Value'],
          ['A', 'bad'],
        ],
        'Group',
        'Value',
        'sum'
      ),
    /number/
  );
});
test('line comparison respects order, labels inserts/removals, and bounds work', () => {
  assert.deepEqual(
    K.compareText('old\nsame', 'new\nsame')
      .filter((x) => x.type !== 'same')
      .map((x) => [x.type, x.text]),
    [
      ['added', 'new'],
      ['removed', 'old'],
    ]
  );
  assert.deepEqual(
    K.compareText('a\nb', 'a\nb').map((x) => x.type),
    ['same', 'same']
  );
  assert.throws(() => K.compareText('x\n'.repeat(1501), 'y'), /1,500/);
});
test('text cleanup and Markdown round trips preserve table values', () => {
  assert.equal(
    K.plain('# Title\n**Bold** and [link](https://example.com)'),
    'Title\nBold and link'
  );
  assert.equal(K.list('1. One\n- Two\n• One'), 'One\nTwo');
  const rows = [
    ['Name', 'Value'],
    ['A | B', 'line1\nline2'],
  ];
  assert.deepEqual(K.markdownTable(K.markdown(rows)), rows);
  assert.throws(() => K.markdownTable('not a table'), /Markdown/);
});
test('decision models use correct denominators and validate assumptions', () => {
  assert.deepEqual(K.roi(15000, 10000), { net: 5000, roi: 50 });
  assert.equal(K.price(30, 40), 50);
  assert.equal(K.forecast(100, 10, 2)[3][1], String(100 * 1.1 ** 2));
  assert.equal(K.economics({ units: 1000, price: 50, variable: 20, fixed: 10000 }).profit, 20000);
  assert.throws(() => K.price(10, 100), /under 100/);
  assert.throws(() => K.roi(10, 0), /positive/);
  assert.throws(() => K.forecast(100, -101, 2), /−100/);
  assert.throws(() => K.forecast(100, 10, 121), /120/);
});
test('weighted choices normalize weights and rank scores without mutating sources', () => {
  const rows = [
    ['Criterion', 'Weight', 'A', 'B'],
    ['Fit', '3', '10', '2'],
    ['Cost', '1', '2', '10'],
  ];
  const source = JSON.stringify(rows);
  assert.deepEqual(K.weighted(rows), [
    ['Option', 'Weighted score'],
    ['A', '8'],
    ['B', '4'],
  ]);
  assert.equal(JSON.stringify(rows), source);
  assert.throws(() => K.weighted([rows[0], ['Fit', '0', '1', '2']]), /positive total/);
  assert.throws(() => K.weighted([rows[0], ['Fit', '-1', '1', '2']]), /nonnegative/);
});
test('WCAG contrast matches black/white and identical-color boundaries', () => {
  assert.equal(K.contrast('#000000', '#ffffff'), 21);
  assert.equal(K.contrast('#abcdef', '#abcdef'), 1);
  assert.throws(() => K.contrast('bad', '#ffffff'), /HEX/);
});
