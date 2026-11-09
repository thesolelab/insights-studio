(function (root) {
  'use strict';
  function organize(text, options = {}) {
    if (typeof text !== 'string' || !text.trim())
      throw new Error('Paste or type your meeting notes first.');
    if (text.length > 100000) throw new Error('Use up to 100,000 characters per recap.');
    const groups = new Map([
      ['Discussion', []],
      ['Decisions', []],
      ['Action items', []],
      ['Open questions', []],
    ]);
    const seen = new Set();
    let count = 0,
      removed = 0,
      section = 'Discussion';
    const headings = {
      discussion: 'Discussion',
      notes: 'Discussion',
      decisions: 'Decisions',
      'action items': 'Action items',
      actions: 'Action items',
      'next steps': 'Action items',
      'open questions': 'Open questions',
      questions: 'Open questions',
    };
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    if (lines.length > 5000) throw new Error('Use at most 5,000 lines per recap.');
    if (options.group === false) {
      const flat = organizeFlat(text, options.merge !== false);
      const total = lines.map((line) => line.trim()).filter(Boolean).length;
      const title = String(options.title || '').trim();
      return {
        text: (title ? title + '\n\n' : '') + flat.map((line) => '• ' + line).join('\n'),
        count: flat.length,
        removed: total - flat.length,
      };
    }
    for (const line of lines) {
      let value = line
        .trim()
        .replace(/^(?:[-*+•]|\d+[.)])\s+/, '')
        .trim();
      if (!value) continue;
      const heading = value
        .replace(/^#{1,6}\s*/, '')
        .replace(/:$/, '')
        .trim()
        .toLowerCase();
      if (Object.hasOwn(headings, heading)) {
        section = headings[heading];
        continue;
      }
      let group = section;
      const marked = value.match(
        /^(decision|decided|action(?: item)?|todo|next step|question|open question)\s*:\s*(.+)$/i
      );
      if (marked) {
        const label = marked[1].toLowerCase();
        value = marked[2].trim();
        group = /decision|decided/.test(label)
          ? 'Decisions'
          : /question/.test(label)
            ? 'Open questions'
            : 'Action items';
      } else if (section === 'Discussion' && /\?$/.test(value)) group = 'Open questions';
      const key = group + '\n' + value.replace(/\s+/g, ' ').toLowerCase();
      if (options.merge !== false && seen.has(key)) {
        removed++;
        continue;
      }
      seen.add(key);
      groups.get(group).push(value);
      count++;
    }
    if (!count) throw new Error('Add at least one note beneath the headings.');
    const title = String(options.title || '').trim();
    const body = [...groups]
      .filter(([, items]) => items.length)
      .map(([name, items]) => name + '\n' + items.map((item) => '• ' + item).join('\n'))
      .join('\n\n');
    return { text: (title ? title + '\n\n' : '') + body, count, removed };
  }
  function organizeFlat(text, merge) {
    const lines = [],
      seen = new Set();
    for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
      const value = raw
        .trim()
        .replace(/^(?:[-*+•]|\d+[.)])\s+/, '')
        .trim();
      if (!value) continue;
      const key = value.replace(/\s+/g, ' ').toLowerCase();
      if (merge && seen.has(key)) continue;
      seen.add(key);
      lines.push(value);
    }
    return lines;
  }
  const api = { organize };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MeetingNotes = api;
})(typeof window !== 'undefined' ? window : globalThis);
