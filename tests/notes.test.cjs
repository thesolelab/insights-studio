const test = require('node:test');
const assert = require('node:assert/strict');
const { organize } = require('../notes-core.js');
test('cleanup produces plain ordered lines without a meeting title or section headings', () => {
  const result = organize(
    '# Weekly sync\nMeeting: Team catch-up\nDiscussion:\n- Launch  moved to Thursday\nDecisions\n1. Decision: Keep $5,000 budget\nActions:\n• Action: Alex to send assets by May 2\nQuestions:\nQuestion: Legal approval needed?',
    { title: 'Unused title', group: true }
  );
  assert.equal(
    result.text,
    'Launch moved to Thursday\nDecision: Keep $5,000 budget\nAction: Alex to send assets by May 2\nQuestion: Legal approval needed?'
  );
  assert.equal(result.count, 4);
});
test('spacing and repetition are cleaned without merging different facts or action types', () => {
  const result = organize(
    '- Budget  $500\n• budget\t$500\nBudget $600\nAction: Send files\nDecision: Send files'
  );
  assert.equal(result.removed, 1);
  assert.equal(result.count, 4);
  assert.equal(result.text, 'Budget $500\nBudget $600\nAction: Send files\nDecision: Send files');
});
test('cleanup preserves rushed wording, numbers, dates, negations, and literal text', () => {
  const result = organize(
    'do NOT launch yet\nsam wrking on 20% target by 11/12\nA <script> $5,000 -2.5'
  );
  assert.equal(
    result.text,
    'do NOT launch yet\nsam wrking on 20% target by 11/12\nA <script> $5,000 -2.5'
  );
});
test('blank lines are removed and checkbox meaning is retained without list formatting', () => {
  assert.equal(
    organize('- [x] One\r\n\r\n2. Two\nOne', { merge: false }).text,
    'Completed: One\nTwo\nOne'
  );
});
test('unchecked list items retain their action status as plain text', () => {
  assert.equal(organize('- [ ] Review budget').text, 'To do: Review budget');
});
test('unlabeled first lines remain and substantive text containing section labels is preserved', () => {
  assert.equal(
    organize('Weekly customer update\nDiscussion: pricing needs review\nAction items are overdue')
      .text,
    'Weekly customer update\nDiscussion: pricing needs review\nAction items are overdue'
  );
});
test('empty, headings-only, and oversized notes fail explicitly', () => {
  assert.throws(() => organize('  '), /notes first/);
  assert.throws(() => organize('Discussion:\n# Team meeting\nActions:'), /at least one note/);
  assert.throws(() => organize('x'.repeat(100001)), /100,000/);
  assert.throws(() => organize('x\n'.repeat(5001)), /5,000/);
});
