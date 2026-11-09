(function (root) {
  'use strict';
  const D =
    typeof module === 'object' && module.exports ? require('./chart-data.js') : root.ChartData;
  const C =
    typeof module === 'object' && module.exports ? require('./console-core.js') : root.ConsoleCore;
  function numeric(value, label = 'Value') {
    const n = D.numberCell(value);
    if (n === null)
      throw new Error(label + ' must be a finite number (maximum magnitude 1 trillion).');
    return n;
  }
  function append(tables) {
    if (!tables.length) throw new Error('Choose at least one table.');
    const headers = tables[0][0];
    if (tables.some((t) => JSON.stringify(t[0]) !== JSON.stringify(headers)))
      throw new Error('Combined tables need identical headers in the same order.');
    return C.table([headers, ...tables.flatMap((t) => t.slice(1))]);
  }
  function duplicates(rows, key) {
    rows = C.table(rows);
    const index = rows[0].indexOf(key),
      counts = new Map();
    if (index < 0) throw new Error('Choose a key column.');
    for (const row of rows.slice(1))
      counts.set(row[index].trim(), (counts.get(row[index].trim()) || 0) + 1);
    return [rows[0], ...rows.slice(1).filter((r) => counts.get(r[index].trim()) > 1)];
  }
  function pivot(rows, group, value, operation) {
    rows = C.table(rows);
    const g = rows[0].indexOf(group),
      v = rows[0].indexOf(value),
      groups = new Map();
    if (g < 0 || (operation !== 'count' && v < 0))
      throw new Error('Choose valid group and value columns.');
    if (!['sum', 'mean', 'count', 'min', 'max'].includes(operation))
      throw new Error('Unsupported aggregation.');
    rows.slice(1).forEach((row, i) => {
      const key = row[g],
        values = groups.get(key) || [];
      values.push(operation === 'count' ? 1 : numeric(row[v], 'Row ' + (i + 2)));
      groups.set(key, values);
    });
    return C.table([
      [group, operation + (operation === 'count' ? ' rows' : ' ' + value)],
      ...[...groups].map(([key, values]) => {
        const total = values.reduce((a, b) => a + b, 0);
        const result =
          operation === 'mean'
            ? total / values.length
            : operation === 'min'
              ? Math.min(...values)
              : operation === 'max'
                ? Math.max(...values)
                : total;
        if (!Number.isFinite(result)) throw new Error('Aggregation is outside the numeric range.');
        return [key, String(result)];
      }),
    ]);
  }
  function compareText(before, after) {
    const a = String(before).split(/\r?\n/),
      b = String(after).split(/\r?\n/);
    if (a.length > 1500 || b.length > 1500 || a.length * b.length > 1000000)
      throw new Error('Compare up to 1,500 lines and 1 million line pairs.');
    const dp = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
    for (let i = a.length - 1; i >= 0; i--)
      for (let j = b.length - 1; j >= 0; j--)
        dp[i][j] = a[i] === b[j] ? 1 + dp[i + 1][j + 1] : Math.max(dp[i + 1][j], dp[i][j + 1]);
    let i = 0,
      j = 0;
    const out = [];
    while (i < a.length || j < b.length) {
      if (i < a.length && j < b.length && a[i] === b[j])
        out.push({ type: 'same', text: a[i++] }), j++;
      else if (j < b.length && (i === a.length || dp[i][j + 1] >= dp[i + 1][j]))
        out.push({ type: 'added', text: b[j++] });
      else out.push({ type: 'removed', text: a[i++] });
    }
    return out;
  }
  function plain(text) {
    return String(text)
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/^\s{0,3}(?:#{1,6}\s+|>\s?)/gm, '')
      .replace(/(\*\*|__|~~|`)/g, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/\r\n/g, '\n');
  }
  function list(text, unique = true) {
    const lines = String(text)
      .split(/\r?\n/)
      .map((s) => s.replace(/^\s*(?:[-*+•]|\d+[.)])\s*/, '').trim())
      .filter(Boolean);
    return (unique ? [...new Set(lines)] : lines).join('\n');
  }
  function markdown(rows) {
    const escape = (v) => String(v).replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
    return [rows[0], rows[0].map(() => '---'), ...rows.slice(1)]
      .map((r) => '| ' + r.map(escape).join(' | ') + ' |')
      .join('\n');
  }
  function markdownTable(text) {
    const rows = String(text)
      .trim()
      .split(/\r?\n/)
      .map((line) =>
        line
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split(/(?<!\\)\|/)
          .map((s) => s.trim().replace(/\\\|/g, '|').replace(/<br>/g, '\n'))
      );
    if (rows.length < 3 || !rows[1].every((v) => /^:?-{3,}:?$/.test(v)))
      throw new Error('Paste a Markdown table with a header separator row.');
    return C.table([rows[0], ...rows.slice(2)]);
  }
  function economics(v) {
    return C.scenario(v);
  }
  function forecast(base, growth, periods) {
    base = numeric(base, 'Starting value');
    growth = numeric(growth, 'Growth percent');
    periods = numeric(periods, 'Periods');
    if (!Number.isInteger(periods) || periods < 1 || periods > 120 || growth < -100)
      throw new Error('Use 1–120 whole periods and growth of at least −100%.');
    const rows = [
      ['Period', 'Forecast'],
      ['0', String(base)],
    ];
    for (let i = 1; i <= periods; i++) {
      const value = base * (1 + growth / 100) ** i;
      if (!Number.isFinite(value) || Math.abs(value) > 1e12)
        throw new Error('Forecast exceeds the supported numeric range.');
      rows.push([String(i), String(value)]);
    }
    return rows;
  }
  function roi(gain, cost) {
    gain = numeric(gain, 'Return');
    cost = numeric(cost, 'Investment');
    if (cost <= 0) throw new Error('Investment must be positive.');
    return { net: gain - cost, roi: ((gain - cost) / cost) * 100 };
  }
  function price(cost, margin) {
    cost = numeric(cost, 'Cost');
    margin = numeric(margin, 'Margin');
    if (cost < 0 || margin < 0 || margin >= 100)
      throw new Error('Use nonnegative cost and a target margin from 0 to under 100%.');
    return cost / (1 - margin / 100);
  }
  function weighted(rows) {
    rows = C.table(rows);
    if (rows[0].length < 3)
      throw new Error('Use Criterion, Weight, then one or more option-score columns.');
    const weights = rows.slice(1).map((r, i) => numeric(r[1], 'Weight row ' + (i + 2)));
    if (weights.some((w) => w < 0) || !weights.some((w) => w > 0))
      throw new Error('Use nonnegative weights with a positive total.');
    const total = weights.reduce((a, b) => a + b, 0);
    return [
      ['Option', 'Weighted score'],
      ...rows[0]
        .slice(2)
        .map((name, c) => [
          name,
          String(
            rows.slice(1).reduce((sum, r, i) => sum + numeric(r[c + 2], 'Score') * weights[i], 0) /
              total
          ),
        ])
        .sort((a, b) => Number(b[1]) - Number(a[1])),
    ];
  }
  function contrast(first, second) {
    function luminance(hex) {
      if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error('Use six-digit HEX colors.');
      const c = hex
        .slice(1)
        .match(/../g)
        .map((v) => {
          const n = parseInt(v, 16) / 255;
          return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
        });
      return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
    }
    const a = luminance(first),
      b = luminance(second);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }
  const api = {
    numeric,
    append,
    duplicates,
    pivot,
    compareText,
    plain,
    list,
    markdown,
    markdownTable,
    economics,
    forecast,
    roi,
    price,
    weighted,
    contrast,
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.UtilityCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
