(function (root) {
  'use strict';
  // Spreadsheet clipboard cells may contain literal quotes. Only interpret an
  // opening quote as a wrapper when it closes cleanly at a cell boundary.
  function spreadsheet(text) {
    const rows = [];
    let row = [],
      i = 0;
    while (i < text.length) {
      const start = i;
      let value = '',
        wrapped = false;
      if (text[i] === '"') {
        let j = i + 1;
        while (j < text.length) {
          if (text[j] !== '"') {
            value += text[j++];
            continue;
          }
          if (text[j + 1] === '"') {
            value += '"';
            j += 2;
            continue;
          }
          let end = j + 1;
          while (text[end] === ' ') end++;
          if (end === text.length || /[\t\r\n]/.test(text[end])) {
            i = end;
            wrapped = true;
          }
          break;
        }
      }
      if (!wrapped) {
        i = start;
        while (i < text.length && !/[\t\r\n]/.test(text[i])) i++;
        value = text.slice(start, i);
      }
      row.push(value);
      if (i === text.length) break;
      if (text[i] === '\t') {
        i++;
        if (i === text.length) row.push('');
      } else {
        if (text[i] === '\r' && text[i + 1] === '\n') i++;
        i++;
        rows.push(row);
        row = [];
      }
    }
    if (row.length) rows.push(row);
    return rows;
  }
  function parse(text, format = 'auto') {
    text = String(text).replace(/^\uFEFF/, '');
    if (!text.trim()) throw new Error('Paste a table first.');
    if (text.length > 100000) throw new Error('Paste up to 100,000 characters.');
    if (!['auto', 'tsv', 'csv'].includes(format))
      throw new Error('Choose a valid paste format.');
    if (format === 'tsv') return spreadsheet(text);
    const D =
      typeof module === 'object' && module.exports
        ? require('./chart-data.js')
        : root.ChartData;
    try {
      return D.splitDelimited(text, format === 'csv' ? { delimiter: ',' } : {});
    } catch (error) {
      const firstLine = text.split(/\r\n?|\n/, 1)[0];
      if (format === 'auto' && (firstLine.includes('\t') || !firstLine.includes(',')))
        return spreadsheet(text);
      throw new Error(
        error.message +
          ' For spreadsheet text with literal quotes, choose Spreadsheet / tab-separated; CSV requires escaped quotes.'
      );
    }
  }
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
  const api = { normalize, layout, parse };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SlideTable = api;
})(typeof window !== 'undefined' ? window : globalThis);
