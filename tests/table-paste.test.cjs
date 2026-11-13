const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../table-core.js');
const D = require('../chart-data.js');
test('spreadsheet pastes preserve literal quotes including text after a quote', () => {
  const source =
    'Name\tDescription\nA\t"Start" event\nB\t6" display\nC\tSay "hello" today';
  assert.throws(() => D.splitDelimited(source), /closing quote/);
  assert.deepEqual(T.parse(source), [
    ['Name', 'Description'],
    ['A', '"Start" event'],
    ['B', '6" display'],
    ['C', 'Say "hello" today'],
  ]);
  assert.deepEqual(T.parse(source, 'tsv'), T.parse(source));
});
test('Excel escaped quotes, tabs and line breaks inside wrapped fields still parse', () => {
  const source = 'Name\tDescription\r\nA\t"Say ""hello""\r\nNext line"\r\nB\t"tab\there"';
  assert.deepEqual(T.parse(source, 'tsv'), [
    ['Name', 'Description'],
    ['A', 'Say "hello"\r\nNext line'],
    ['B', 'tab\there'],
  ]);
  assert.deepEqual(T.parse(source), T.parse(source, 'tsv'));
});
test('one-column spreadsheet mode preserves commas and literal unmatched quotes', () => {
  assert.deepEqual(T.parse('Company\nAcme, Inc.\n"Start" event\nUnclosed "text', 'tsv'), [
    ['Company'],
    ['Acme, Inc.'],
    ['"Start" event'],
    ['Unclosed "text'],
  ]);
});
test('spreadsheet parser retains blanks, trailing cells, BOM and ordinary punctuation', () => {
  assert.deepEqual(T.parse('\uFEFFName\tValue\nA\t\nB\t"unfinished\nC\t001\t', 'tsv'), [
    ['Name', 'Value'],
    ['A', ''],
    ['B', '"unfinished'],
    ['C', '001', ''],
  ]);
});
test('CSV remains quote-aware and strict, with actionable malformed input feedback', () => {
  assert.deepEqual(T.parse('Name,Value\n"Acme, Inc.","Say ""go"""', 'csv'), [
    ['Name', 'Value'],
    ['Acme, Inc.', 'Say "go"'],
  ]);
  assert.throws(
    () => T.parse('Name,Value\nA,"Start" event', 'csv'),
    /CSV requires escaped quotes/
  );
  assert.throws(() => T.parse('Name,Value\nA,"unclosed', 'csv'), /closing quote/);
  assert.deepEqual(T.parse('Name,Value\nA,unquoted\ttab', 'csv'), [
    ['Name', 'Value'],
    ['A', 'unquoted\ttab'],
  ]);
});
test('paste bounds and unknown formats fail explicitly', () => {
  assert.throws(() => T.parse(' '), /Paste/);
  assert.throws(() => T.parse('x'.repeat(100001)), /100,000/);
  assert.throws(() => T.parse('A\nB', 'unknown'), /format/);
});
