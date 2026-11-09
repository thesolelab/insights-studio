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
  const sections = Object.freeze({
    topics: 'Meeting notes/topics',
    mine: "What's Needed from Me | Tasks to Create",
    actions: 'Action Items',
  });
  function sectionHeading(text) {
    const key = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
    if (['meeting notes topics', 'meeting notes', 'topics', 'discussion', 'notes'].includes(key))
      return 'topics';
    if (
      [
        'what s needed from me tasks to create',
        'whats needed from me tasks to create',
        'what s needed from me',
        'whats needed from me',
        'tasks to create',
        'my tasks',
        'to do',
        'todo',
        'to dos',
      ].includes(key)
    )
      return 'mine';
    if (['action items', 'actions', 'follow ups', 'follow up'].includes(key)) return 'actions';
    return null;
  }
  function buildRecap(text, options = {}) {
    if (typeof text !== 'string' || !text.trim())
      throw new Error('Paste or type your meeting notes first.');
    if (text.length > 100000) throw new Error('Use up to 100,000 characters per recap.');
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    if (lines.length > 5000) throw new Error('Use at most 5,000 source lines per recap.');
    const items = [],
      seen = new Set();
    let current = 'topics',
      explicitSection = false,
      removed = 0;
    const verbs =
      '(?:send|share|create|add|check|confirm|follow up|review|schedule|prepare|update|ask|find|contact|draft|book|provide|set up|deliver|investigate|research|complete|submit)';
    const personal = new RegExp('^I\\s+(?:will|need to|have to|must)\\s+' + verbs + '\\b', 'i');
    const assigned = new RegExp(
      "^[A-Z][\\p{L}'’-]+(?: [A-Z][\\p{L}'’-]+){0,2} (?:will|to|agreed to) " + verbs + '\\b',
      'iu'
    );
    lines.forEach((raw, index) => {
      let value = raw
        .trim()
        .replace(/^(?:[-*+•▪◦]|\d+[.)])\s+/, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (!value) return;
      const heading = sectionHeading(value.replace(/^#{1,6}\s+/, ''));
      if (heading) {
        current = heading;
        explicitSection = true;
        return;
      }
      if (/^#{1,6}\s+/.test(value) || /^(?:meeting(?: title)?|title)\s*[:—–]\s*.+$/i.test(value))
        return;
      let section = current,
        suggested = false;
      const label = value.match(
        /^(my task|task for me|need(?:ed)? from me|for me|todo|to-do|to do|task|action(?: item)?s?|follow[- ]?up)\s*:\s*(.+)$/i
      );
      if (label) {
        section = /^(?:action|follow)/i.test(label[1]) ? 'actions' : 'mine';
        value = label[2];
      } else if (
        current === 'topics' &&
        !explicitSection &&
        !/\?$/.test(value) &&
        !/^(?:maybe|perhaps|if|unless|whether|should|could|would|will|can|did|does|do)\b/i.test(
          value
        )
      ) {
        if (personal.test(value)) {
          section = 'mine';
          suggested = true;
        } else if (assigned.test(value) && !/^(?:I|We|Should|Could|Would|Will|Can)\b/.test(value)) {
          section = 'actions';
          suggested = true;
        }
      }
      value = value.replace(/^\[([ xX]?)\]\s+/, (_, mark) =>
        /x/i.test(mark) ? 'Completed: ' : 'To do: '
      );
      const key = section + '\n' + value.toLowerCase();
      if (options.merge !== false && seen.has(key)) {
        removed++;
        return;
      }
      seen.add(key);
      items.push({ id: 'note-' + (index + 1), text: value, section, suggested });
      if (items.length > 500) throw new Error('Use up to 500 notes per recap for review.');
    });
    if (!items.length) throw new Error('Add at least one note beneath the headings.');
    return { items, removed };
  }
  function sectionText(items, section) {
    if (!Object.hasOwn(sections, section)) throw new Error('Choose a valid recap section.');
    return items
      .filter(
        (item) => item.section === section && typeof item.text === 'string' && item.text.trim()
      )
      .map((item) => item.text.trim())
      .join('\n');
  }
  function recapText(items) {
    return Object.entries(sections)
      .map(([key, title]) => {
        const text = sectionText(items, key);
        return text ? title + '\n' + text : '';
      })
      .filter(Boolean)
      .join('\n\n');
  }
  const api = { organize, sections, buildRecap, sectionText, recapText };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MeetingNotes = api;
})(typeof window !== 'undefined' ? window : globalThis);
