(function (root) {
  'use strict';
  function deduplicate(rows, column, options = {}) {
    if (!Array.isArray(rows) || rows.length < 2)
      throw new Error('Include column headers and at least one data row.');
    if (
      !Array.isArray(rows[0]) ||
      !Number.isInteger(column) ||
      column < 0 ||
      column >= rows[0].length
    )
      throw new Error('Choose a column to de-dupe.');
    if (rows.length > 50001 || rows[0].length > 200 || rows.length * rows[0].length > 1000000)
      throw new Error('Use up to 50,000 data rows, 200 columns, and 1 million cells.');
    const kept = [],
      removed = [],
      seen = new Map(),
      duplicates = new Set();
    for (let i = 1; i < rows.length; i++) {
      if (!Array.isArray(rows[i]) || rows[i].length > rows[0].length)
        throw new Error('A row has more cells than the headers.');
      let key = String(rows[i][column] ?? '');
      if (options.trim !== false) key = key.trim();
      if (options.ignoreCase !== false) key = key.toLowerCase();
      if (!key && options.blank !== 'dedupe') {
        kept.push(i);
        continue;
      }
      if (seen.has(key)) {
        removed.push({ index: i, firstIndex: seen.get(key) });
        duplicates.add(key);
      } else {
        seen.set(key, i);
        kept.push(i);
      }
    }
    return { kept, removed, duplicateKeys: duplicates.size, inputCount: rows.length - 1 };
  }
  const api = { deduplicate };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ExcelDedupe = api;
})(typeof window !== 'undefined' ? window : globalThis);
