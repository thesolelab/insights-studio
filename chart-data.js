(function (root) {
  'use strict';
  const MAX_ROWS = 200;
  const MAX_SERIES = 6;

  function parseDelimited(text) {
    text = String(text).replace(/^\uFEFF/, '');
    if (!text.trim()) throw new Error('Paste a table or choose a data file first.');
    let inHeaderQuotes = false, hasTab = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        if (inHeaderQuotes && text[i + 1] === '"') i++;
        else inHeaderQuotes = !inHeaderQuotes;
      } else if (!inHeaderQuotes) {
        if (char === '\t') hasTab = true;
        if (char === '\n' || char === '\r') break;
      }
    }
    const delimiter = hasTab ? '\t' : ',';
    const rows = [];
    let row = [], cell = '', quoted = false, closed = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (quoted) {
        if (char === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (char === '"') { quoted = false; closed = true; }
        else cell += char;
      } else if (char === '"') {
        if (cell.trim() || closed) throw new Error('A quote is misplaced. Check the CSV formatting.');
        cell = ''; quoted = true;
      } else if (char === delimiter) {
        row.push(cell); cell = ''; closed = false;
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = ''; closed = false;
      } else {
        if (closed && char.trim()) throw new Error('Unexpected text after a closing quote.');
        if (!closed) cell += char;
      }
    }
    if (quoted) throw new Error('A quoted cell is missing its closing quote.');
    if (row.length || cell || closed) { row.push(cell); rows.push(row); }
    return normalizeTable(rows);
  }

  function numberCell(value) {
    let text = String(value).trim();
    if (!text) return null;
    const percent = text.endsWith('%');
    if (percent) text = text.slice(0, -1).trim();
    const negative = /^\(.*\)$/.test(text);
    if (negative) text = text.slice(1, -1);
    text = text.replace(/^[$£€]/, '');
    if (!/^[+-]?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)) return null;
    const number = Number(text.replace(/,/g, '')) * (negative ? -1 : 1) / (percent ? 100 : 1);
    return Number.isFinite(number) && Math.abs(number) <= 1e12 ? number : null;
  }

  function normalizeTable(input) {
    const rows = input.filter(row => row.some(value => String(value).trim() !== ''));
    if (rows.length < 2) throw new Error('Include a header row and at least one data row.');
    const headers = rows[0].map(value => String(value).trim());
    if (headers.length < 2) throw new Error('Include a category column and at least one numeric column.');
    if (headers.some(header => !header)) throw new Error('Give every column a header.');
    if (new Set(headers).size !== headers.length) throw new Error('Use a unique name for each column.');
    if (headers.some(header => header.length > 80)) throw new Error('Keep column headers under 81 characters.');
    if (rows.length - 1 > MAX_ROWS) throw new Error(`Use at most ${MAX_ROWS} data rows per chart.`);
    const data = rows.slice(1).map((row, index) => {
      // Excel may omit trailing empty cells; retain them as blanks for validation.
      if (row.length > headers.length) throw new Error(`Row ${index + 2} has more cells than the header.`);
      return headers.map((_, i) => String(row[i] ?? '').trim());
    });
    const numeric = headers.map((_, index) => index).filter(index =>
      data.some(row => row[index] !== '') && data.every(row => row[index] === '' || numberCell(row[index]) !== null)
    );
    if (!numeric.length) throw new Error('No numeric columns found. Use numbers with a decimal point; percentages such as 2.5% are supported.');
    return { headers, rows: data, numeric };
  }

  function axisScale(values) {
    const min = Math.min(0, ...values), max = Math.max(0, ...values);
    const span = Math.max(max - min || 1, 1e-12);
    const raw = span / 5;
    const magnitude = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map(n => n * magnitude).find(n => n >= raw);
    return { min: Math.floor(min / step) * step, max: Math.ceil((min === max ? 1 : max) / step) * step, step };
  }

  const api = { MAX_ROWS, MAX_SERIES, parseDelimited, normalizeTable, numberCell, axisScale };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChartData = api;
})(typeof window !== 'undefined' ? window : globalThis);
