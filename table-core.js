(function (root) {
  'use strict';
  function normalize(rows) {
    if (!Array.isArray(rows) || rows.length < 2 || rows.length > 31)
      throw new Error('Include headers and 1–30 data rows.');
    if (!rows.every(Array.isArray)) throw new Error('Use rows of cells.');
    const columns = Math.max(...rows.map((row) => row.length));
    if (columns < 1 || columns > 10) throw new Error('Use 1–10 columns.');
    return rows.map((row) =>
      Array.from({ length: columns }, (_, i) => {
        const value = String(row[i] ?? '');
        if (value.length > 500) throw new Error('Use up to 500 characters per cell.');
        return value;
      })
    );
  }
  function layout(rows, options, measure) {
    const data = normalize(rows),
      font = Number(options.font),
      padding = Number(options.padding);
    if (
      !Number.isFinite(font) ||
      font < 10 ||
      font > 28 ||
      !Number.isFinite(padding) ||
      padding < 4 ||
      padding > 20
    )
      throw new Error('Use a 10–28 pt font and 4–20 pt padding.');
    const width = 1600,
      scale = width / (12.1333333333 * 72),
      size = font * scale,
      pad = padding * scale;
    const weights = options.widths ?? data[0].map(() => 1);
    if (
      weights.length !== data[0].length ||
      weights.some((w) => !Number.isFinite(w) || w < 1 || w > 10)
    )
      throw new Error('Column width weights must be 1–10.');
    const total = weights.reduce((a, b) => a + b, 0),
      widths = weights.map((w) => (width * w) / total);
    function wrap(text, max, bold) {
      if (max < size)
        throw new Error(
          'A column is too narrow. Increase its width or reduce font/padding.'
        );
      const lines = [];
      for (const paragraph of text.replace(/\r\n?/g, '\n').split('\n')) {
        let line = '';
        for (const char of paragraph) {
          if (measure(char, size, bold) > max)
            throw new Error(
              'A character is wider than its cell. Increase the column width.'
            );
          while (line && measure(line + char, size, bold) > max) {
            const split = line.lastIndexOf(' ');
            if (split > 0) {
              lines.push(line.slice(0, split));
              line = line.slice(split + 1);
            } else {
              lines.push(line);
              line = '';
            }
          }
          line += char;
        }
        lines.push(line);
      }
      return lines;
    }
    const cells = data.map((row, r) =>
      row.map((text, c) => wrap(text, widths[c] - 2 * pad, r === 0))
    );
    const heights = cells.map(
        (row) => Math.max(...row.map((lines) => lines.length)) * size * 1.25 + 2 * pad
      ),
      height = heights.reduce((a, b) => a + b, 0);
    const fits = height <= 6.3 * 72 * scale;
    if (!fits && !options.allowOverflow)
      throw new Error(
        'This table is too tall for one slide. Reduce the font/padding, shorten cells, or use fewer rows.'
      );
    return {
      data,
      fits,
      cells,
      widths,
      heights,
      width,
      height,
      scale,
      font,
      padding,
      size,
      pad,
    };
  }
  const api = { normalize, layout };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SlideTable = api;
})(typeof window !== 'undefined' ? window : globalThis);
