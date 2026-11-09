const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../notes-core.js');
test('builds the three recap sections from explicit labels without changing the note facts', () => {
  const result = M.buildRecap(
    'CONNECT was set up 2 years ago\nShould we consider a paid component for CY27?\nFor me: Create the monthly follow-up task\nAction: Matt to find Oktopost engagement data'
  );
  assert.deepEqual(
    result.items.map((x) => x.section),
    ['topics', 'topics', 'mine', 'actions']
  );
  assert.equal(result.items[2].text, 'Create the monthly follow-up task');
  assert.equal(result.items[3].text, 'Matt to find Oktopost engagement data');
  assert.equal(M.sectionText(result.items, 'mine'), 'Create the monthly follow-up task');
  assert.match(M.recapText(result.items), /What's Needed from Me \| Tasks to Create/);
  assert.ok(!M.recapText(result.items).includes('•'));
});
test('recognizes the supplied meeting template and does not copy its headings as notes', () => {
  const draft = M.buildRecap(
    "📃 Meeting notes/topics\nCONNECT space was setup 2 years ago\nCamille to add me to the monthly calls\n📋 What's Needed from Me | Tasks to Create\nCreate follow-up task\n✅ Action Items\nMatt will find engagement data"
  );
  assert.deepEqual(
    draft.items.map((x) => x.section),
    ['topics', 'topics', 'mine', 'actions']
  );
  assert.equal(draft.items.length, 4);
  assert.ok(!draft.items.some((x) => x.text.includes('📋')));
});
test('suggests clear follow-ups but leaves questions, uncertainty, and negated commitments in topics', () => {
  const draft = M.buildRecap(
    'matt will find the data\nI will send the report by Friday\nMatt will send the report?\nMaybe Matt will send it\nI will not send it\nShould we add a paid component?'
  );
  assert.deepEqual(
    draft.items.map((x) => x.section),
    ['actions', 'mine', 'topics', 'topics', 'topics', 'topics']
  );
  assert.equal(draft.items[0].suggested, true);
  assert.equal(draft.items[1].text, 'I will send the report by Friday');
});
test('duplicate removal stays within sections and can be disabled', () => {
  const text =
    'Topic: Budget $5,000\nTopic: Budget $5,000\nFor me: Send the file\nAction: Send the file';
  const draft = M.buildRecap(text);
  assert.equal(draft.removed, 1);
  assert.equal(draft.items.length, 3);
  assert.equal(M.buildRecap(text, { merge: false }).items.length, 4);
});
test('serialization uses the edited section assignments, omits blanks, and preserves order within each section', () => {
  const draft = M.buildRecap('First\nSecond\nThird');
  draft.items[0].section = 'mine';
  draft.items[1].text = 'Second — edited <script> $500';
  draft.items[2].text = ' ';
  assert.equal(M.sectionText(draft.items, 'topics'), 'Second — edited <script> $500');
  assert.equal(
    M.recapText(draft.items),
    "Meeting notes/topics\nSecond — edited <script> $500\n\nWhat's Needed from Me | Tasks to Create\nFirst"
  );
  assert.throws(() => M.sectionText(draft.items, '__proto__'), /valid/);
});
test('recap builder is bounded and rejects empty or headings-only drafts', () => {
  assert.throws(() => M.buildRecap(' '), /notes first/);
  assert.throws(() => M.buildRecap('Meeting notes/topics\nAction Items'), /at least one note/);
  assert.throws(() => M.buildRecap('x'.repeat(100001)), /100,000/);
  assert.throws(
    () => M.buildRecap(Array.from({ length: 501 }, (_, i) => 'Note ' + i).join('\n')),
    /500 notes/
  );
});

test('explicit section headings outrank wording suggestions while inline labels can override', () => {
  const draft = M.buildRecap(
    'Meeting notes/topics\nMatt will send a report\nAction: Send the final report'
  );
  assert.deepEqual(
    draft.items.map((item) => item.section),
    ['topics', 'actions']
  );
  assert.equal(draft.items[0].suggested, false);
});
