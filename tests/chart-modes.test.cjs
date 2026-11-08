const assert = require('node:assert/strict');
const test = require('node:test');
const M = require('../chart-modes.js');
const D = require('../chart-data.js');

function config(id, rows = M.example(id)) {
  const table = D.normalizeTable(rows);
  const mode = M.definition(id);
  const columns = table.numeric.filter(i => i !== 0 && !(id === 'bubble' && i === 2));
  const colors = ['FFDC19', 'C9C9C9', 'F2F2F2', 'FFE64D', '858585', 'C9C9C9'];
  const series = columns.map((column, i) => ({ name: table.headers[column], values: table.rows.map(row => D.numberCell(row[column])), color: colors[i], type: i ? 'line' : 'bar', axis: 'left' }));
  return M.prepare({ title: mode.name, category: table.headers[0], labels: table.rows.map(row => row[0]), series,
    axes: { left: { ...D.axisScale(series.flatMap(s => s.values)), format: 'number' } } }, id,
  { colors, xValues: table.rows.map(row => row[0]), sizes: table.rows.map(row => row[2]) });
}

test('random startup supports every chart style with valid matching data', () => {
  for (let i = 0; i < M.MODES.length; i++) {
    const sample = M.randomStartup(() => (i + 0.5) / M.MODES.length);
    assert.equal(sample.id, M.MODES[i].id);
    const chart = config(sample.id, sample.rows);
    assert.ok(chart.series.every(series => series.values.every(Number.isFinite)));
    if (chart.definition.xy) assert.ok(chart.xValues.every((v, index, list) => !index || v > list[index - 1]));
  }
  assert.equal(M.randomStartup(() => 0).id, M.MODES[0].id);
  assert.equal(M.randomStartup(() => 1 - Number.EPSILON).id, M.MODES.at(-1).id);
});

test('random startup varies types and data across a deterministic sequence', () => {
  let seed = 42;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const modes = new Set(), tables = new Set();
  for (let i = 0; i < 1000; i++) {
    const sample = M.randomStartup(random);
    config(sample.id, sample.rows);
    modes.add(sample.id); tables.add(JSON.stringify(sample.rows));
  }
  assert.equal(modes.size, M.MODES.length);
  assert.equal(tables.size, 1000);
});

test('all 21 chart choices have valid examples and native export specifications', () => {
  assert.equal(M.MODES.length, 21);
  assert.equal(new Set(M.MODES.map(m => m.id)).size, 21);
  for (const mode of M.MODES) {
    const c = config(mode.id);
    assert.ok(c.series.length && c.labels.length);
    if (mode.id !== 'combo') {
      const spec = M.nativeSpec(c, color => color);
      assert.equal(spec.type, mode.native);
      assert.ok(spec.data.length);
    }
  }
});

test('stacked values use separate positive and negative baselines', () => {
  const result = M.stack([{ values: [5, -2] }, { values: [3, -4] }, { values: [-1, 5] }], false);
  assert.deepEqual(result.map(s => [s[0].low, s[0].high]), [[0,5],[5,8],[0,-1]]);
  assert.deepEqual(result.map(s => [s[1].low, s[1].high]), [[0,-2],[-2,-6],[0,5]]);
});

test('100% stacks normalize per category and handle zero totals', () => {
  const result = M.stack([{ values: [1,0] }, { values: [3,0] }], true);
  assert.equal(result[0][0].high, 0.25);
  assert.equal(result[1][0].high, 1);
  assert.equal(result[1][1].high, 0);
  const c = config('percent-column');
  assert.deepEqual(c.axes.left, { min:0,max:1,step:0.2,format:'percent' });
  assert.equal(M.nativeSpec(c,x=>x).options.barGrouping,'percentStacked');
});

test('pie, radar, and percentage charts reject unsuitable data', () => {
  const pie = config('pie');
  const options = { colors:['FFDC19','C9C9C9'] };
  assert.throws(() => M.prepare({ ...pie, series:[...pie.series,...pie.series] },'pie',options), /one numeric series/);
  assert.throws(() => M.prepare({ ...pie, series:[{...pie.series[0],values:[0,0,0,0]}] },'pie',options), /positive/);
  const radar = config('radar');
  assert.throws(() => M.prepare({...radar,labels:['A','B']},'radar'), /3–12/);
  const percent = config('percent-column');
  percent.series[0].values[0] = -1;
  assert.throws(() => M.prepare(percent,'percent-column'), /non-negative/);
});

test('scatter preserves actual X values; bubble sizes are validated and zero Y values retained', () => {
  const scatter = config('scatter');
  assert.deepEqual(scatter.xValues,[10,20,35,45,60]);
  const bubble = config('bubble');
  bubble.series[0].values[0] = 0;
  assert.equal(M.nativeSpec(bubble,x=>x).data[1].values[0],0);
  assert.equal(M.nativeSpec(bubble,x=>x).data[1].sizes.length,5);
  assert.throws(() => M.prepare(bubble,'bubble',{xValues:['a'],sizes:[10]}), /numeric X/);
  assert.throws(() => M.prepare(bubble,'bubble',{xValues:[1,2,3,4,5],sizes:[1,-1,2,3,4]}), /bubble-size/);
});
