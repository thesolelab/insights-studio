(function () {
  'use strict';
  const $ = (id) => document.getElementById('notes-' + id);
  function status(text, error = false) {
    $('status').textContent = text;
    $('status').setAttribute('role', error ? 'alert' : 'status');
  }
  function invalidate() {
    $('result').hidden = true;
    $('copy').disabled = true;
    $('output').value = '';
    status('Notes changed. Clean up again to refresh the recap.');
  }
  for (const id of ['source', 'merge'])
    $(id).addEventListener('input', invalidate);
  $('form').addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const result = window.MeetingNotes.organize($('source').value, {
        merge: $('merge').checked,
      });
      $('output').value = result.text;
      $('result').hidden = false;
      $('copy').disabled = false;
      status(
        `${result.count} ${result.count === 1 ? 'note' : 'notes'} cleaned${result.removed ? ' · ' + result.removed + ' repeated ' + (result.removed === 1 ? 'line' : 'lines') + ' removed' : ''}. Review and edit the recap before copying.`
      );
    } catch (error) {
      $('result').hidden = true;
      $('copy').disabled = true;
      status(error.message, true);
    }
  });
  $('output').addEventListener('input', () => {
    $('copy').disabled = !$('output').value.trim();
  });
  $('copy').addEventListener('click', async () => {
    if (!$('output').value.trim()) return;
    try {
      await navigator.clipboard.writeText($('output').value);
      status('Recap copied. Paste it into your Wrike meeting recap.');
    } catch (error) {
      $('output').focus();
      $('output').select();
      status('Clipboard unavailable. Copy the selected recap manually.');
    }
  });
})();
