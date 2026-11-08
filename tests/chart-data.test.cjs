const assert = require('node:assert/strict');
const test = require('node:test');
const D = require('../chart-data.js');

test('CSV supports BOM, quoted commas, escaped quotes and multiline labels', () => {
  const table = D.parseDelimited('\uFEFFCategory,Revenue,Rate\r\n"North, \"\"new\"\"",1200,3.5%\r\n"Two\nlines",2500,4%\r\n');
  assert.equal(table.rows[0][0], 'North, "new"');
  assert.equal(table.rows[1][0], 'Two\nlines');
  assert.deepEqual(table.numeric, [1, 2]);
});

test('pasted spreadsheet tabs and blank lines are handled', () => {
  const table = D.parseDelimited('Month\tSales\nJan\t10\n\nFeb\t20\n');
  assert.deepEqual(table.headers, ['Month', 'Sales']);
  assert.equal(table.rows.length, 2);
});

test('tabs inside quoted CSV headers do not change the delimiter', () => {
  const table = D.parseDelimited('"Region\tname",Sales\nNorth,10\nSouth,20');
  assert.deepEqual(table.headers, ['Region\tname', 'Sales']);
  assert.deepEqual(table.numeric, [1]);
});

test('numbers preserve percentages, negatives and grouped currency values', () => {
  for (const [input, expected] of [['3.5%', 0.035], ['$1,200.50', 1200.5], ['(250)', -250], ['-1.25', -1.25], ['.5', 0.5], ['1e3', 1000], ['0', 0]]) {
    assert.equal(D.numberCell(input), expected);
  }
  for (const input of ['', 'N/A', '1,23', '1.2.3', 'Infinity', '1e99', '12abc']) assert.equal(D.numberCell(input), null);
});

test('blank numeric cells are preserved for explicit validation instead of becoming zero', () => {
  const table = D.parseDelimited('Month,Sales\nJan,10\nFeb,');
  assert.deepEqual(table.numeric, [1]);
  assert.equal(table.rows[1][1], '');
});

test('malformed data and excess categories are rejected with useful errors', () => {
  assert.throws(() => D.parseDelimited(''), /Paste/);
  assert.throws(() => D.parseDelimited('Month,Sales\n"Jan,10'), /closing quote/);
  assert.throws(() => D.parseDelimited('Month,Sales\n"Jan"oops,10'), /Unexpected/);
  assert.throws(() => D.parseDelimited('A,A\n1,2'), /unique/);
  assert.throws(() => D.parseDelimited('A,\n1,2'), /header/);
  assert.throws(() => D.parseDelimited('A,B\n1,2,3'), /more cells/);
  assert.throws(() => D.parseDelimited('A,B\nJan,nope'), /numeric/);
  assert.throws(() => D.normalizeTable([['Month', 'Sales'], ...Array.from({length: 201}, (_, i) => [String(i), 10])]), /200/);
});

test('left/right scales independently contain values, including negatives and zero', () => {
  const left = D.axisScale([24000, 42500]);
  const right = D.axisScale([0.024, 0.038]);
  assert.ok(left.max >= 42500 && right.max >= 0.038 && right.max < 1);
  for (const values of [[0, 0], [-4, -1], [-3, 7], [1e-15, 2e-15]]) {
    const axis = D.axisScale(values);
    assert.ok(Number.isFinite(axis.min) && Number.isFinite(axis.max));
    assert.ok(axis.max > axis.min && axis.step > 0);
    assert.ok(values.every(value => value >= axis.min && value <= axis.max));
  }
});
