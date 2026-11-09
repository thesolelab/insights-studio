const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../percentages.js');
test('percentage of supports decimal, zero, negative and over-100 percentages', () => {
  assert.equal(P.calculate('of','15','200'),30);
  assert.equal(P.calculate('of','2.5','80'),2);
  assert.equal(P.calculate('of','0','0'),0);
  assert.equal(P.calculate('of','-10','50'),-5);
  assert.equal(P.calculate('of','150','200'),300);
});
test('proportions and percentage change preserve direction and reject undefined bases', () => {
  assert.equal(P.calculate('portion','30','200'),15);
  assert.equal(P.calculate('portion','0','200'),0);
  assert.equal(P.calculate('change','200','250'),25);
  assert.equal(P.calculate('change','200','150'),-25);
  assert.equal(P.calculate('change','200','0'),-100);
  assert.equal(P.calculate('change','200','200'),0);
  assert.throws(()=>P.calculate('portion','10','0'),/zero/);
  assert.throws(()=>P.calculate('change','0','10'),/zero/);
  assert.throws(()=>P.calculate('change','-10','20'),/positive/);
});
test('invalid inputs never silently become zero or partially parsed numbers', () => {
  for(const bad of ['', ' ', 'NaN','Infinity','1,000','12abc','0x10']) assert.throws(()=>P.calculate('of',bad,'100'),/number/);
  assert.throws(()=>P.calculate('of','1e309','1'),/finite/);
  assert.throws(()=>P.calculate('portion','1e308','1e-308'),/range/);
  assert.equal(P.format(P.calculate('portion','1','3')),'33.3333333333');
  assert.equal(P.format(P.calculate('of','-0','10')),'0');
});
