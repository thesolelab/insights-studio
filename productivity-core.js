(function (root) {
  'use strict';
  function compareLists(a, b, options = {}) {
    const normalize = (v) => {
      const s = options.trim === false ? v : v.trim();
      return options.ignoreCase === false ? s : s.toLowerCase();
    };
    function list(text) {
      if (typeof text !== 'string' || text.length > 1000000)
        throw new Error('Use up to 1 million characters per list.');
      const lines = text.split(/\r\n?|\n/);
      if (lines.length > 50001) throw new Error('Use up to 50,000 entries per list.');
      const values = new Map();
      for (const value of lines) {
        if (!value.trim()) continue;
        const key = normalize(value);
        if (!values.has(key)) values.set(key, value);
      }
      return values;
    }
    const left = list(a),
      right = list(b);
    if (!left.size && !right.size) throw new Error('Add at least one list entry.');
    return {
      both: [...left].filter(([k]) => right.has(k)).map(([, v]) => v),
      onlyA: [...left].filter(([k]) => !right.has(k)).map(([, v]) => v),
      onlyB: [...right].filter(([k]) => !left.has(k)).map(([, v]) => v),
      combined: [...new Map([...left, ...right])].map(
        ([k]) => left.get(k) ?? right.get(k)
      ),
    };
  }
  function utmLink(base, values) {
    if (typeof base !== 'string' || base.length > 8192)
      throw new Error('Use a URL of up to 8,192 characters.');
    let url;
    try {
      url = new URL(base.trim().toLowerCase());
    } catch {
      throw new Error('Enter a complete URL beginning with https:// or http://.');
    }
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password)
      throw new Error('Use an HTTP/HTTPS URL without embedded credentials.');
    for (const field of ['source', 'medium', 'campaign', 'term', 'content']) {
      const value = String(values[field] ?? '').trim().toLowerCase();
      if (value.length > 1000)
        throw new Error('Use up to 1,000 characters per UTM field.');
      if (['source', 'medium', 'campaign'].includes(field) && !value)
        throw new Error('Source, medium, and campaign are required.');
      url.searchParams.delete('utm_' + field);
      if (value) url.searchParams.set('utm_' + field, value);
    }
    return url.href.toLowerCase();
  }
  const api = { compareLists, utmLink };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Productivity = api;
})(typeof window !== 'undefined' ? window : globalThis);
