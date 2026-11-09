const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function setup() {
  const scripts = [],
    timers = new Set(),
    window = {};
  const context = {
    window,
    document: {
      createElement: () => ({
        remove() {
          this.removed = true;
        },
      }),
      head: { appendChild: (s) => scripts.push(s) },
    },
    setTimeout: (fn) => {
      timers.add(fn);
      return fn;
    },
    clearTimeout: (fn) => timers.delete(fn),
  };
  vm.runInNewContext(
    fs.readFileSync(require.resolve('../libraries.js'), 'utf8'),
    context
  );
  return { window, scripts, timers, load: window.ToolLibraries.load };
}
test('concurrent tools share one pinned library request and reuse its result', async () => {
  const { window, scripts, timers, load } = setup();
  const first = load('excel');
  assert.equal(first, load('excel'));
  assert.equal(scripts.length, 1);
  assert.match(scripts[0].integrity, /^sha384-/);
  assert.equal(scripts[0].crossOrigin, 'anonymous');
  window.XLSX = { utils: {} };
  scripts[0].onload();
  assert.equal(await first, window.XLSX);
  assert.equal(await load('excel'), window.XLSX);
  assert.equal(scripts.length, 1);
  assert.equal(timers.size, 0);
});
test('failed requests clear cache and permit a fresh attempt', async () => {
  const { scripts, load } = setup();
  const failed = load('excel');
  scripts[0].onerror();
  await assert.rejects(failed, /Unable to load/);
  assert.ok(scripts[0].removed);
  load('excel');
  assert.equal(scripts.length, 2);
});
test('timeout and missing APIs fail explicitly; PowerPoint requires its ZIP API', async () => {
  const { window, scripts, timers, load } = setup();
  const timed = load('excel');
  [...timers][0]();
  await assert.rejects(timed, /Unable to load/);
  const missing = load('powerpoint');
  window.PptxGenJS = function () {};
  scripts[1].onload();
  await assert.rejects(missing, /Unable to load/);
  const retry = load('powerpoint');
  window.JSZip = {};
  scripts[2].onload();
  assert.equal(await retry, window.PptxGenJS);
});
test('preloaded APIs avoid network requests and unknown libraries are rejected', async () => {
  const { window, scripts, load } = setup();
  window.XLSX = {};
  assert.equal(await load('excel'), window.XLSX);
  assert.equal(scripts.length, 0);
  await assert.rejects(load('toString'), /Unknown/);
});
