(function () {
  'use strict';
  const $ = (id) => document.getElementById('utm-' + id);
  let version = 0;
  function invalidate() {
    version++;
    $('output').value = '';
    $('copy').disabled = true;
    $('status').textContent = '';
  }
  $('form').addEventListener('input', invalidate);
  $('form').addEventListener('submit', (event) => {
    event.preventDefault();
    invalidate();
    try {
      const values = {};
      for (const key of ['source', 'medium', 'campaign', 'term', 'content'])
        values[key] = $(key).value;
      $('output').value = window.Productivity.utmLink($('url').value, values);
      $('copy').disabled = false;
      $('status').textContent =
        'Lowercase link ready. Existing UTM tags are replaced; other URL parameters and anchors are kept.';
    } catch (error) {
      $('status').textContent = error.message;
    }
  });
  $('clear').addEventListener('click', () => {
    $('form').reset();
    invalidate();
    $('url').focus();
  });
  $('copy').addEventListener('click', async () => {
    if (!$('output').value) return;
    const request = version,
      text = $('output').value;
    try {
      await navigator.clipboard.writeText(text);
      if (request === version) $('status').textContent = 'Link copied.';
    } catch {
      if (request !== version) return;
      $('output').focus();
      $('output').select();
      $('status').textContent = 'Copy unavailable. Copy the selected link manually.';
    }
  });
})();
