const test = require('node:test');
const assert = require('node:assert/strict');
const { suggest } = require('../slide-formats.js');
test('returns five unique layouts matched to the communication goal', () => {
  const results = suggest('Compare three vendors and choose the best option for approval.');
  assert.equal(results.length, 5);
  assert.equal(new Set(results.map((x) => x.id)).size, 5);
  assert.ok(results.slice(0, 3).some((x) => x.id === 'matrix'));
  const trend = suggest('Show monthly revenue growth over time and explain the trend.');
  assert.ok(trend.slice(0, 2).some((x) => x.id === 'trend'));
  const roadmap = suggest('Explain the rollout process with milestones and next steps.');
  assert.ok(roadmap.slice(0, 2).some((x) => x.id === 'timeline'));
});
test('general briefs get usable fallback formats and invalid briefs get explanations', () => {
  assert.equal(suggest('Tell the audience about our team and what we believe.').length, 5);
  assert.throws(() => suggest('short'), /Describe/);
  assert.throws(() => suggest('a'.repeat(5001)), /5,001/);
});
