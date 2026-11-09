(function (root) {
  'use strict';
  function organize(text, options = {}) {
    if (typeof text !== 'string' || !text.trim())
      throw new Error('Paste or type your meeting notes first.');
    if (text.length > 100000) throw new Error('Use up to 100,000 characters per recap.');
    const source = text.replace(/\r\n?/g, '\n').split('\n');
    if (source.length > 5000) throw new Error('Use at most 5,000 lines per recap.');
    const lines = [],
      seen = new Set();
    let removed = 0;
    for (const raw of source) {
      // Remove explicit Markdown headings and labeled titles, never guess whether
      // an ordinary note is a title: it may contain important meeting details.
      if (/^\s{0,3}#{1,6}\s+/.test(raw)) continue;
      let value = raw.trim().replace(/^(?:[-*+•▪◦]|\d+[.)])\s+/, '');
      value = value
        .replace(/^\[([ xX]?)\]\s+/, (_, mark) => (/x/i.test(mark) ? 'Completed: ' : 'To do: '))
        .replace(/\s+/g, ' ')
        .trim();
      if (!value) continue;
      if (
        /^(?:meeting(?: notes| recap)?|discussion|notes|decisions?|actions?(?: items?)?|next steps|open questions?|questions?|todo)\s*:?$/i.test(
          value
        )
      )
        continue;
      if (/^(?:meeting(?: title)?|title|discussion title)\s*[:—–]\s*.+$/i.test(value)) continue;
      const key = value.toLowerCase();
      if (options.merge !== false && seen.has(key)) {
        removed++;
        continue;
      }
      seen.add(key);
      lines.push(value);
    }
    if (!lines.length) throw new Error('Add at least one note beneath the headings.');
    return { text: lines.join('\n'), count: lines.length, removed };
  }
  const api = { organize };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MeetingNotes = api;
})(typeof window !== 'undefined' ? window : globalThis);
