const test = require('node:test');
const assert = require('node:assert/strict');
const { deduplicate } = require('../dedupe-core.js');
test('dedupes the selected column and retains the first complete row in source order', () => {
  const rows = [
    ['Name', 'Email', 'Amount'],
    ['Alex', 'a@example.com', '10'],
    ['Bea', 'b@example.com', '20'],
    ['Alex updated', 'a@example.com', '99'],
  ];
  const original = JSON.stringify(rows),
    result = deduplicate(rows, 1);
  assert.deepEqual(result.kept, [1, 2]);
  assert.deepEqual(result.removed, [{ index: 3, firstIndex: 1 }]);
  assert.equal(result.duplicateKeys, 1);
  assert.equal(result.inputCount, 3);
  assert.equal(JSON.stringify(rows), original);
  assert.deepEqual(deduplicate(rows, 0).kept, [1, 2, 3]);
});
test('case and whitespace options normalize matching only, never source values', () => {
  const rows = [['ID'], [' A '], ['a'], ['A']];
  assert.deepEqual(deduplicate(rows, 0).kept, [1]);
  assert.deepEqual(deduplicate(rows, 0, { ignoreCase: false, trim: false }).kept, [1, 2, 3]);
  assert.deepEqual(deduplicate(rows, 0, { ignoreCase: false }).kept, [1, 2]);
});
test('blank rows stay by default; optional blank dedupe never confuses zero with blank', () => {
  const rows = [['ID'], [''], [' '], ['0'], ['0'], []];
  assert.deepEqual(deduplicate(rows, 0).kept, [1, 2, 3, 5]);
  assert.deepEqual(deduplicate(rows, 0, { blank: 'dedupe' }).kept, [1, 3]);
});
test('leading zeros and display strings remain distinct and duplicate headers use column position', () => {
  const rows = [
    ['ID', 'ID'],
    ['001', 'a'],
    ['1', 'a'],
    ['001', 'b'],
  ];
  assert.deepEqual(deduplicate(rows, 0).kept, [1, 2]);
  assert.deepEqual(deduplicate(rows, 1).kept, [1, 3]);
});
test('invalid columns and oversized ranges fail explicitly', () => {
  assert.throws(() => deduplicate([['A'], ['x']], 1), /column/);
  assert.throws(() => deduplicate([['A']], 0), /data row/);
  assert.throws(() => deduplicate([['A'], ['x', 'y']], 0), /more cells/);
  assert.throws(
    () => deduplicate([['A'], ...Array.from({ length: 50001 }, () => ['x'])], 0),
    /50,000/
  );
});
