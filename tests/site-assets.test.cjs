const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
test('entry-point assets exist and resolve under a renamed repository subpath', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const assets = [...html.matchAll(/<(?:script|link|img)\b[^>]*(?:src|href)="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((url) => !/^https?:/.test(url));
  assert.ok(assets.length > 10);
  for (const asset of assets) {
    assert.ok(!asset.startsWith('/'), asset + ' must be relative');
    assert.ok(fs.statSync(path.join(root, asset)).isFile(), asset);
    assert.equal(
      new URL(asset, 'https://example.test/simple-worx/').pathname,
      '/simple-worx/' + asset
    );
  }
  assert.ok(html.indexOf('src="libraries.js"') < html.indexOf('src="charts.js"'));
  assert.ok(html.indexOf('src="libraries.js"') < html.indexOf('src="deduper.js"'));
});
