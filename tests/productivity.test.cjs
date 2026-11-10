const test = require('node:test');
const assert = require('node:assert/strict');
const { compareLists, utmLink } = require('../productivity-core.js');
const T = require('../table-core.js');
const D = require('../chart-data.js');
test('comparison returns unique ordered intersections, differences, and A-first union preserving original spelling', () => {
  assert.deepEqual(compareLists(' Acme \nBeta\nBeta\n001\n', 'acme\nGamma\n001'), {
    both: [' Acme ', '001'],
    onlyA: ['Beta'],
    onlyB: ['Gamma'],
    combined: [' Acme ', 'Beta', '001', 'Gamma'],
  });
});
test('list matching options change matching only; blanks skipped and one-sided lists supported', () => {
  assert.deepEqual(
    compareLists('A\na\n A', 'a', { ignoreCase: false, trim: false }).both,
    ['a']
  );
  assert.deepEqual(compareLists('', 'Only\nOnly').onlyB, ['Only']);
  assert.throws(() => compareLists('', ''), /at least/);
  assert.throws(() => compareLists('x\n'.repeat(50002), ''), /50,000/);
});
test('UTM builder encodes values, replaces repeated managed fields, retains unrelated query and anchor', () => {
  const link = utmLink(
    'https://example.com/path?keep=1&utm_source=old&utm_source=older&utm_content=old#part',
    {
      source: 'Newsletter & partners',
      medium: 'email',
      campaign: 'Spring / 2027',
      term: 'C++',
    }
  );
  const u = new URL(link);
  assert.equal(u.hash, '#part');
  assert.equal(u.searchParams.get('keep'), '1');
  assert.deepEqual(u.searchParams.getAll('utm_source'), ['Newsletter & partners']);
  assert.equal(u.searchParams.get('utm_term'), 'C++');
  assert.equal(u.searchParams.has('utm_content'), false);
  assert.equal(u.searchParams.get('utm_campaign'), 'Spring / 2027');
});
test('UTM validation rejects unsafe URLs and missing campaign fields', () => {
  for (const base of [
    'javascript:alert(1)',
    'file:///tmp/a',
    'https://user:secret@example.com',
    'example.com',
  ])
    assert.throws(() => utmLink(base, { source: 'a', medium: 'b', campaign: 'c' }));
  assert.throws(
    () => utmLink('https://example.com', { source: 'x', medium: 'y' }),
    /required/
  );
});
test('table parsing keeps strings, quoted commas/newlines and pads short rows without numeric conversion', () => {
  const rows = T.normalize(
    D.splitDelimited('Account,Value\n"Acme, Inc.",001\n"Two\nlines"')
  );
  assert.deepEqual(rows, [
    ['Account', 'Value'],
    ['Acme, Inc.', '001'],
    ['Two\nlines', ''],
  ]);
  assert.throws(() => T.normalize([['header']]), /data rows/);
  assert.throws(() => T.normalize([Array(11).fill('a'), []]), /columns/);
});
test('table layout wraps content, uses proportional column widths and refuses slide overflow', () => {
  const measure = (t, size) => [...t].length * size * 0.5;
  const rows = [
    ['A', 'B'],
    ['Long enough to wrap '.repeat(5), '001'],
  ];
  const layout = T.layout(rows, { font: 16, padding: 8, widths: [2, 1] }, measure);
  assert.equal(layout.widths[0], 2 * layout.widths[1]);
  assert.ok(layout.cells[1][0].length > 1);
  assert.equal(layout.data[1][1], '001');
  assert.throws(
    () => T.layout(rows, { font: 0, padding: 8, widths: [1, 1] }, measure),
    /font/
  );
  assert.throws(
    () =>
      T.layout(
        [['H'], ...Array.from({ length: 30 }, () => ['Row'])],
        { font: 28, padding: 20, widths: [1] },
        measure
      ),
    /too tall/
  );
  assert.throws(
    () =>
      T.layout(
        [Array(10).fill('H'), Array(10).fill('V')],
        { font: 28, padding: 20, widths: [1, 10, 10, 10, 10, 10, 10, 10, 10, 10] },
        measure
      ),
    /narrow/
  );
});
