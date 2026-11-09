const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../console-core.js');
const D = require('../chart-data.js');

test('workbench accepts text tables and keeps chart limits independent', () => {
  assert.deepEqual(C.table(D.splitDelimited('Owner,Action\nAlex,Review')), [['Owner','Action'],['Alex','Review']]);
  const rows = [['Key','Value'], ...Array.from({length:201},(_,i)=>[String(i),String(i)])];
  assert.equal(C.table(rows).length,202);
  assert.throws(()=>D.normalizeTable(rows),/200/);
  assert.throws(()=>C.table([['X','X'],['1','2']]),/unique/);
  assert.throws(()=>C.table([['X'],['1','2']]),/Too many/);
});
test('cleanup and workflows do not mutate sources and reject invalid calculations', () => {
  const source = [['Key','A','B'],[' x ',' 20 ','10'],[' x ',' 20 ','10'],['','','']];
  const before = JSON.stringify(source);
  const steps = [{type:'clean'},{type:'derive',a:'A',b:'B',op:'change',name:'Lift'}];
  assert.deepEqual(C.run(source,steps),[['Key','A','B','Lift'],['x','20','10','1']]);
  assert.equal(JSON.stringify(source),before);
  assert.throws(()=>C.derive([['A','B'],['2','0']],{a:'A',b:'B',op:'ratio',name:'C'}),/zero/);
  assert.throws(()=>C.run(source,[{type:'eval'}]),/Unsupported/);
  assert.throws(()=>C.derive(source,{a:'A',b:'B',op:'__proto__',name:'C'}),/supported/);
});
test('keyed comparisons distinguish changed, removed and added records', () => {
  const a=[['ID','Value'],['a','10'],['b','20']], b=[['ID','Value'],['a','11'],['c','30']];
  assert.deepEqual(C.compare(a,b,'ID').slice(1).map(r=>r[0]),['Changed','Removed','Added']);
  assert.throws(()=>C.compare(a,[['ID','Value'],['a','1'],['a','2']],'ID'),/unique/);
  assert.throws(()=>C.compare(a,[['ID','Value'],['','1']],'ID'),/nonblank/);
  assert.equal(C.compare(a,a,'ID').length,1);
});
test('scenario economics handle zero revenue and impossible break even', () => {
  assert.deepEqual(C.scenario({units:1000,price:50,variable:20,fixed:10000}),{revenue:50000,cost:30000,profit:20000,margin:.4,breakEven:334});
  assert.equal(C.scenario({units:0,price:0,variable:2,fixed:5}).margin,null);
  assert.equal(C.scenario({units:0,price:0,variable:2,fixed:5}).breakEven,null);
  assert.throws(()=>C.scenario({units:1.5,price:1,variable:1,fixed:1}),/whole/);
});
test('project round trips rebuild IDs, preserve evidence, reject malformed imports', () => {
  const p=C.project('Launch');p.notes='ACTION: Review';p.datasets.push({id:C.id(),name:'Costs',rows:[['ID','Cost'],['a','2']]});
  p.tasks.push({id:C.id(),title:'Review',owner:'Sam',due:'2026-11-10',status:'Open'});
  p.workflows.push({id:C.id(),name:'Clean',steps:[{type:'clean'}]});
  const imported=C.importProject(JSON.stringify({version:1,project:p}));
  assert.notEqual(imported.id,p.id);assert.deepEqual(imported.datasets[0].rows,p.datasets[0].rows);assert.equal(imported.tasks[0].owner,'Sam');
  assert.throws(()=>C.importProject('{"version":2}'),/Unsupported/);
  assert.throws(()=>C.importProject(JSON.stringify({version:1,project:{name:'x'}})),/collection/);
  p.workflows[0].steps=[{type:'script'}];assert.throws(()=>C.importProject(JSON.stringify({version:1,project:p})),/operation/);
});
test('CSV downloads neutralize formula cells while preserving negative numbers', () => {
  const exported=D.splitDelimited(C.csv([['Name','Value'],['=HYPERLINK("evil")','-12'],[' @SUM(A1)','+cmd']]));
  assert.equal(exported[1][0][0],"'");assert.equal(exported[1][1],'-12');assert.equal(exported[2][1],"'+cmd");
});
test('left joins retain unmatched rows, avoid header collisions, and require unique keys', () => {
  const a=[['ID','Cost'],['a','10'],['b','20']], b=[['ID','Cost','Owner'],['a','11','Sam']];
  assert.deepEqual(C.join(a,b,'ID'),[['ID','Cost','Cost (2)','Owner'],['a','10','11','Sam'],['b','20','','']]);
  assert.throws(()=>C.join(a,[['ID','Cost'],['a','1'],['a','2']],'ID'),/unique/);
});
test('all-empty cleanup fails instead of producing an unloadable dataset', () => {
  assert.throws(()=>C.clean([['Name'],['  ']]),/data rows/);
});
