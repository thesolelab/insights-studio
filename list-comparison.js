(function () {
  'use strict';
  const $ = (id) => document.getElementById('lists-' + id);
  let result = null,
    version = 0;
  const names = {
    both: 'In both lists',
    onlyA: 'Only in A',
    onlyB: 'Only in B',
    combined: 'Combined unique list',
  };
  function invalidate() {
    version++;
    result = null;
    $('result').hidden = true;
    $('status').textContent = '';
  }
  window.ListComparison = {
    setLists(a, b) {
      $('a').value = a.join('\n');
      $('b').value = b.join('\n');
      invalidate();
      $('status').textContent =
        'Worksheet columns copied below. Review and compare the lists.';
      $('a').focus();
    },
  };
  for (const id of ['a', 'b', 'trim', 'case'])
    $(id).addEventListener('input', invalidate);
  function show() {
    const key = $('view').value;
    $('output').value = result[key].join('\n');
    $('count').textContent = Object.entries(names)
      .map(([k, n]) => n + ': ' + result[k].length.toLocaleString())
      .join(' · ');
    $('copy').disabled = !result[key].length;
  }
  $('form').addEventListener('submit', (event) => {
    event.preventDefault();
    invalidate();
    try {
      result = window.Productivity.compareLists($('a').value, $('b').value, {
        trim: $('trim').checked,
        ignoreCase: $('case').checked,
      });
      show();
      $('result').hidden = false;
      $('status').textContent =
        'Comparison ready. Blank entries are skipped and repeats are consolidated. Original spelling is retained; shared values use list A.';
    } catch (error) {
      $('status').textContent = error.message;
    }
  });
  $('view').addEventListener('change', () => {
    version++;
    if (result) show();
  });
  $('clear').addEventListener('click', () => {
    $('form').reset();
    invalidate();
    $('output').value = '';
    $('view').value = 'both';
    $('count').textContent = '';
    $('a').focus();
  });
  $('copy').addEventListener('click', async () => {
    if (!result) return;
    const request = version,
      text = $('output').value;
    try {
      await navigator.clipboard.writeText(text);
      if (request === version) $('status').textContent = 'List copied.';
    } catch {
      if (request !== version) return;
      $('output').focus();
      $('output').select();
      $('status').textContent = 'Copy unavailable. Copy the selected list manually.';
    }
  });
  $('download').addEventListener('click', async () => {
    if (!result) return;
    const snapshot = result,
      request = version;
    try {
      const X = await window.ToolLibraries.load('excel');
      if (request !== version) return;
      const book = X.utils.book_new();
      for (const [key, name] of Object.entries(names))
        X.utils.book_append_sheet(
          book,
          X.utils.aoa_to_sheet([[name], ...snapshot[key].map((v) => [v])]),
          name
        );
      X.writeFile(book, 'simple-worx-list-comparison.xlsx');
    } catch (error) {
      if (request === version) $('status').textContent = error.message;
    }
  });
})();
