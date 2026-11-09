const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

function setup() {
  const preview = {
    background: '#000000',
    text: '#FFFFFF',
    cloneNode() {
      return {
        background: this.background,
        text: this.text,
        attrs: {},
        setAttribute(key, value) {
          this.attrs[key] = value;
        },
        querySelector(selector) {
          assert.equal(selector, '[data-chart-background]');
          return {
            remove: () => {
              this.background = null;
            },
          };
        },
      };
    },
  };
  const element = { value: '', addEventListener() {}, requestSubmit() {} };
  const serialize = vm.runInNewContext(
    readFileSync(require.resolve('../app.js'), 'utf8') + '\n;svgText;',
    {
      document: { getElementById: (id) => (id === 'distribution' ? preview : element) },
      XMLSerializer: class {
        serializeToString(node) {
          return JSON.stringify(node);
        }
      },
    }
  );
  return { preview, serialize };
}
test('solid export retains background and explicit text with standalone dimensions', () => {
  const { serialize } = setup();
  const result = JSON.parse(serialize());
  assert.equal(result.background, '#000000');
  assert.equal(result.text, '#FFFFFF');
  assert.equal(result.attrs.width, '2200');
  assert.equal(result.attrs.height, '1020');
  assert.equal(result.attrs.xmlns, 'http://www.w3.org/2000/svg');
});
test('transparent export removes only the cloned background, preserving preview and later SVGs', () => {
  const { preview, serialize } = setup();
  const result = JSON.parse(serialize(true));
  assert.equal(result.background, null);
  assert.equal(result.text, '#FFFFFF');
  assert.equal(preview.background, '#000000');
  assert.equal(JSON.parse(serialize()).background, '#000000');
});
