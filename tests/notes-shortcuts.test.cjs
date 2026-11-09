const test = require('node:test');
const assert = require('node:assert/strict');
const { tagNoteLines } = require('../notes-core.js');
test('tags current line while preserving content and cursor position', () => {
  assert.deepEqual(tagNoteLines('Budget $500\nSam by 12/4', 14, 14, 'mine'), {
    text: 'Budget $500\nFor me: Sam by 12/4',
    start: 22,
    end: 22,
  });
});
test('batch selection skips blanks and excludes next line at selection boundary', () => {
  assert.equal(
    tagNoteLines('one\n\ntwo\nthree', 0, 9, 'actions').text,
    'Action: one\n\nAction: two\nthree'
  );
});
test('replaces labels without stacking them and preserves list markers', () => {
  const a = tagNoteLines('  - For me: Send $500', 10, 10, 'actions');
  assert.equal(a.text, '  - Action: Send $500');
  assert.equal(tagNoteLines(a.text, 0, a.text.length, 'actions').text, a.text);
});
test('empty editor supports tagging before typing and invalid selections fail', () => {
  assert.deepEqual(tagNoteLines('', 0, 0, 'mine'), {
    text: 'For me: ',
    start: 8,
    end: 8,
  });
  assert.throws(() => tagNoteLines('a', 2, 2, 'mine'));
  assert.throws(() => tagNoteLines('a', 0, 0, 'topics'));
});
