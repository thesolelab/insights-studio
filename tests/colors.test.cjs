const assert = require('node:assert/strict');
const test = require('node:test');
const C = require('../colors.js');

test('HEX colors normalize safely, including shorthand and missing hash', () => {
  for (const [value, expected] of [['#36d6ed','#36D6ED'],['abc','#AABBCC'],['#abc','#AABBCC'],[' 123456 ','#123456'],['#000000','#000000']]) assert.equal(C.normalize(value),expected);
  for (const value of ['#12','#12345678','red','url(x)',';color:red','#GGGGGG','']) assert.equal(C.normalize(value),null);
});

test('HSV conversions round-trip across presets, primary colors, black, and white', () => {
  const colors = [...Object.values(C.PALETTES).flatMap(p=>p.colors),'#000000','#FFFFFF','#FF0000','#00FF00','#0000FF','#123456'];
  for (const color of colors) {
    const {h,s,v} = C.hsv(color);
    assert.equal(C.hex(h,s,v),color);
  }
  assert.equal(C.hex(360,1,1),'#FF0000');
});

test('slice foregrounds switch between dark and light text', () => {
  assert.equal(C.foreground('#FBBF24'),'#11151B');
  assert.equal(C.foreground('#123456'),'#F2F5F9');
});
