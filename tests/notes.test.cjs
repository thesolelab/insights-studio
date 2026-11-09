const test = require('node:test');
const assert = require('node:assert/strict');
const { organize } = require('../notes-core.js');
test('recap groups explicit notes and preserves owners, dates and numbers', () => {
  const result = organize(
    'Launch moved to Thursday\nDecision: Keep $5,000 budget\nAction: Alex to send assets by May 2\nQuestion: Legal approval needed?',
    { title: 'Team sync' }
  );
  assert.equal(
    result.text,
    'Team sync\n\nDiscussion\n• Launch moved to Thursday\n\nDecisions\n• Keep $5,000 budget\n\nAction items\n• Alex to send assets by May 2\n\nOpen questions\n• Legal approval needed?'
  );
  assert.equal(result.count, 4);
});
test('repeated lines merge without inventing or merging different facts', () => {
  const result = organize(
    '- Budget $500\n• Budget $500\nBudget $600\nTODO: Send files\nAction: Send files'
  );
  assert.equal(result.count, 3);
  assert.equal(result.removed, 2);
  assert.match(result.text, /Budget \$500/);
  assert.match(result.text, /Budget \$600/);
});
test('headings classify following lines and text remains literal', () => {
  const result = organize(
    'Decisions:\nKeep current plan\nActions:\nSam: review <script> by Friday\nQuestions:\nWho signs off?'
  );
  assert.match(result.text, /Decisions\n• Keep current plan/);
  assert.match(result.text, /<script>/);
});
test('flat output retains encounter order and optional repetition', () => {
  assert.equal(
    organize('One\nTwo\nOne', { group: false, merge: false }).text,
    '• One\n• Two\n• One'
  );
});
test('empty and oversized notes fail explicitly', () => {
  assert.throws(() => organize('  '), /notes first/);
  assert.throws(() => organize('x'.repeat(100001)), /100,000/);
});
