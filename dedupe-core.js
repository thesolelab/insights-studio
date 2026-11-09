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
  function excludeMatches(rows, mainColumn, exclusionColumn, options = {}) {
    if (!Array.isArray(rows) || rows.length < 2 || !Array.isArray(rows[0]))
      throw new Error('Include column headers and at least one data row.');
    for (const column of [mainColumn, exclusionColumn]) {
      if (!Number.isInteger(column) || column < 0 || column >= rows[0].length)
        throw new Error('Choose valid main-list and exclusion columns.');
    }
    if (mainColumn === exclusionColumn)
      throw new Error('Choose different main-list and exclusion columns.');
    if (rows.length > 50001 || rows[0].length > 200 || rows.length * rows[0].length > 1000000)
      throw new Error('Use up to 50,000 data rows, 200 columns, and 1 million cells.');
    const normalize = (value) => {
      let text = String(value ?? '');
      if (options.trim !== false) text = text.trim();
      return options.ignoreCase === false ? text : text.toLowerCase();
    };
    const exclusions = new Map();
    for (let i = 1; i < rows.length; i++) {
      if (!Array.isArray(rows[i]) || rows[i].length > rows[0].length)
        throw new Error('A row has more cells than the headers.');
      const key = normalize(rows[i][exclusionColumn]);
      if (key.trim() && !exclusions.has(key)) exclusions.set(key, i);
    }
    const kept = [],
      removed = [],
      matched = new Set();
    let skippedBlanks = 0;
    for (let i = 1; i < rows.length; i++) {
      const key = normalize(rows[i][mainColumn]);
      if (!key.trim()) {
        skippedBlanks++;
        continue;
      }
      if (exclusions.has(key)) {
        removed.push({ index: i, firstIndex: exclusions.get(key) });
        matched.add(key);
      } else kept.push(i);
    }
    return {
      kept,
      removed,
      duplicateKeys: matched.size,
      inputCount: rows.length - 1 - skippedBlanks,
      skippedBlanks,
    };
  }
  const api = { deduplicate, excludeMatches };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ExcelDedupe = api;
})(typeof window !== 'undefined' ? window : globalThis);
