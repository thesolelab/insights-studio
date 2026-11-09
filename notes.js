(function () {
  'use strict';
  const $ = (id) => document.getElementById('notes-' + id);
  const M = window.MeetingNotes;
  let items = [],
    builtSource = '',
    builtMerge = true,
    sourceDirty = false,
    manualId = 0,
    version = 0;
  const sections = new Map();
  function el(tag, text, attrs = {}) {
    const node = document.createElement(tag);
    if (text !== null) node.textContent = text;
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  }
  function status(text, error = false) {
    $('status').setAttribute('role', error ? 'alert' : 'status');
    $('status').textContent = text;
  }
  function hideManualCopy() {
    $('manual-copy').hidden = true;
    $('manual-copy').value = '';
  }
  function sync() {
    version++;
    hideManualCopy();
    $('output').value = M.recapText(items);
    $('copy').disabled = sourceDirty || !$('output').value;
    for (const [key, section] of sections) {
      const count = items.filter((item) => item.section === key && item.text.trim()).length;
      section.count.textContent = String(count);
      section.copy.disabled = sourceDirty || count === 0;
    }
  }
  function sourceChanged() {
    sourceDirty = $('source').value !== builtSource || $('merge').checked !== builtMerge;
    sync();
    status(
      !builtSource
        ? 'Ready to build a recap.'
        : sourceDirty
          ? 'Source notes changed. Build the recap again to replace this draft.'
          : 'Source notes match this draft. Review your items before copying.'
    );
  }
  $('source').addEventListener('input', sourceChanged);
  $('merge').addEventListener('change', sourceChanged);
  async function copy(text) {
    if (sourceDirty || !text.trim()) return;
    const request = version;
    try {
      await navigator.clipboard.writeText(text);
      if (request === version) status('Copied. Paste into the matching Wrike recap section.');
    } catch (error) {
      if (request !== version) return;
      $('manual-copy').value = text;
      $('manual-copy').hidden = false;
      $('manual-copy').focus();
      $('manual-copy').select();
      status('Clipboard unavailable. Copy the selected text manually.');
    }
  }
  function draw(focusId, control = 'section') {
    for (const [key, section] of sections) {
      section.list.replaceChildren();
      const matches = items.filter((item) => item.section === key);
      section.empty.hidden = matches.length > 0;
      for (const item of matches) {
        const card = el('div', null, { class: 'recap-item' });
        const field = el('label', 'Note', { class: 'builder-label' }),
          text = el('textarea', null, {
            id: item.id + '-text',
            rows: '2',
            'aria-label': M.sections[key] + ' note',
          });
        text.value = item.text;
        field.append(text);
        card.append(field);
        text.addEventListener('input', () => {
          item.text = text.value;
          select.setAttribute(
            'aria-label',
            'Section for ' + (item.text.slice(0, 70) || 'new note')
          );
          remove.setAttribute('aria-label', 'Remove ' + (item.text.slice(0, 70) || 'new note'));
          sync();
        });
        const label = el('label', 'Section', { class: 'builder-label' }),
          select = el('select', null, {
            id: item.id + '-section',
            'aria-label': 'Section for ' + (item.text.slice(0, 70) || 'new note'),
          });
        for (const [value, title] of Object.entries(M.sections))
          select.append(el('option', title, { value }));
        select.value = item.section;
        label.append(select);
        select.addEventListener('change', () => {
          item.section = select.value;
          item.suggested = false;
          draw(item.id);
          status('Moved item to ' + M.sections[item.section] + '.');
        });
        const controls = el('div', null, { class: 'recap-item-controls' }),
          remove = el('button', 'Remove', {
            type: 'button',
            class: 'recap-secondary',
            'aria-label': 'Remove ' + (item.text.slice(0, 70) || 'new note'),
          });
        remove.addEventListener('click', () => {
          items = items.filter((other) => other.id !== item.id);
          draw();
          section.add.focus();
          status('Item removed from the recap. Original notes are unchanged.');
        });
        controls.append(label, remove);
        card.append(controls);
        if (item.suggested)
          card.append(
            el('p', 'Suggested placement — please review.', { class: 'note recap-suggestion' })
          );
        section.list.append(card);
      }
    }
    sync();
    if (focusId) document.getElementById(focusId + '-' + control)?.focus();
  }
  for (const [key, title] of Object.entries(M.sections)) {
    const section = el('section', null, {
        class: 'recap-section',
        'aria-labelledby': 'recap-' + key + '-heading',
      }),
      header = el('div', null, { class: 'recap-section-heading' }),
      heading = el('h3', title, { id: 'recap-' + key + '-heading' }),
      count = el('span', '0', { class: 'pill', 'aria-label': title + ' item count' });
    header.append(heading, count);
    section.append(header);
    const empty = el('p', 'No items here yet. Move an item here or add one.', { class: 'note' }),
      list = el('div', null, { class: 'recap-items' }),
      controls = el('div', null, { class: 'recap-section-actions' }),
      add = el('button', '+ Add item', { type: 'button', class: 'recap-secondary' }),
      copyButton = el('button', 'Copy section', {
        type: 'button',
        class: 'recap-secondary',
        'aria-label': 'Copy ' + title,
      });
    add.addEventListener('click', () => {
      if (items.length >= 500) {
        status('Use at most 500 recap items.', true);
        return;
      }
      const item = { id: 'manual-' + ++manualId, text: '', section: key, suggested: false };
      items.push(item);
      draw(item.id, 'text');
    });
    copyButton.addEventListener('click', () => copy(M.sectionText(items, key)));
    controls.append(add, copyButton);
    section.append(empty, list, controls);
    $('sections').append(section);
    sections.set(key, { list, empty, count, copy: copyButton, add });
  }
  $('form').addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const draft = M.buildRecap($('source').value, { merge: $('merge').checked });
      items = draft.items;
      builtSource = $('source').value;
      builtMerge = $('merge').checked;
      sourceDirty = false;
      manualId = 0;
      $('result').hidden = false;
      $('build').textContent = 'Rebuild recap';
      draw();
      status(
        `${items.length} items drafted${draft.removed ? ' · ' + draft.removed + (draft.removed === 1 ? ' repeat removed' : ' repeats removed') : ''}. Review placements and edit wording before copying. Rebuilding replaces this draft.`
      );
    } catch (error) {
      status(error.message, true);
    }
  });
  $('copy').addEventListener('click', () => copy(M.recapText(items)));
})();
