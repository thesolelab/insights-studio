(function () {
  'use strict';
  window.TextTools = {
    mount(root, U) {
      const K = window.UtilityCore,
        C = window.ConsoleCore,
        D = window.ChartData,
        { el, panel, form, field, select, submit, button, actions } = U;
      const clean = panel(
        root,
        'Clean & restructure text',
        'Paste text or use the rich-text clipboard. Convert to plain text, extract a list, deduplicate lines, or change case.'
      );
      U.command('Clean plain text extract list uppercase lowercase', 'text', clean);
      const f = form(clean, '', (data) => {
        let output = data.text;
        if (data.operation === 'plain') output = K.plain(output);
        if (data.operation === 'list') output = K.list(output, true);
        if (data.operation === 'sort')
          output = K.list(output, true)
            .split('\n')
            .sort((a, b) => a.localeCompare(b))
            .join('\n');
        if (data.operation === 'upper') output = output.toUpperCase();
        if (data.operation === 'lower') output = output.toLowerCase();
        if (data.operation === 'spaces')
          output = output
            .split(/\r?\n/)
            .map((s) => s.trim().replace(/[\t ]+/g, ' '))
            .join('\n');
        result.value = output;
        copy.disabled = !output;
        download.disabled = !output;
        stats.textContent =
          output.length +
          ' characters · ' +
          (output.trim() ? output.trim().split(/\s+/).length : 0) +
          ' words';
      });
      const source = field(f, 'Source text', 'text', 'textarea');
      select(f, 'Operation', 'operation', [
        ['plain', 'Remove common Markdown formatting'],
        ['list', 'Extract unique lines / list items'],
        ['sort', 'Unique list, alphabetical'],
        ['spaces', 'Trim and collapse spaces'],
        ['upper', 'UPPERCASE'],
        ['lower', 'lowercase'],
      ]);
      submit(f, 'Transform text');
      const result = field(clean, 'Editable plain-text result', 'result', 'textarea', '', false),
        stats = el('p', '', { class: 'note' });
      clean.append(stats);
      const copy = button('Copy text', async () => {
          if (!result.value) throw new Error('Transform or enter text first.');
          try {
            await navigator.clipboard.writeText(result.value);
            U.message('Text copied.');
          } catch (error) {
            result.focus();
            result.select();
            U.message('Clipboard unavailable. Copy the selected text manually.');
          }
        }),
        download = button('Download TXT', () => U.download(result.value, 'text-result.txt'));
      copy.disabled = download.disabled = true;
      actions(clean, copy, download);
      result.addEventListener('input', () => {
        copy.disabled = download.disabled = !result.value;
      });
      f.addEventListener('input', () => {
        result.value = '';
        copy.disabled = download.disabled = true;
        stats.textContent = '';
      });
      const compare = panel(
        root,
        'Compare text',
        'Line-by-line comparison. Added and removed lines use labels and symbols, with no category colors. Up to 1,500 lines and 1 million line pairs.'
      );
      U.command('Compare text differences diff', 'text', compare);
      const diff = el('div', null, {
        class: 'text-diff',
        role: 'region',
        'aria-label': 'Text differences',
        tabindex: '0',
      });
      let diffText = '';
      const cf = form(compare, '', (data) => {
        const rows = K.compareText(data.before, data.after);
        diff.replaceChildren();
        diffText = rows
          .map((r) => (r.type === 'added' ? '+ ' : r.type === 'removed' ? '- ' : '  ') + r.text)
          .join('\n');
        for (const row of rows) {
          const line = el('div', null, { class: 'diff-' + row.type });
          line.append(
            el(
              'strong',
              row.type === 'added' ? '+ Added' : row.type === 'removed' ? '− Removed' : 'Unchanged'
            ),
            el('span', row.text || ' ')
          );
          diff.append(line);
        }
        U.message(
          rows.filter((r) => r.type === 'added').length +
            ' added lines · ' +
            rows.filter((r) => r.type === 'removed').length +
            ' removed lines.'
        );
      });
      field(cf, 'Before', 'before', 'textarea');
      field(cf, 'After', 'after', 'textarea');
      submit(cf, 'Compare text');
      cf.addEventListener('input', () => {
        diff.replaceChildren();
        diffText = '';
      });
      compare.append(diff);
      actions(
        compare,
        button('Download comparison', () => {
          if (!diffText) throw new Error('Compare text first.');
          U.download(diffText, 'text-differences.txt');
        })
      );
      const convert = panel(
        root,
        'Table & text converter',
        'Convert CSV/TSV tables to Markdown, JSON, or plain text, and convert Markdown tables back to CSV. Headers are required.'
      );
      U.command('Convert CSV Markdown JSON table plain text', 'text', convert);
      const tf = form(convert, '', (data) => {
        let rows =
          data.input === 'markdown'
            ? K.markdownTable(data.source)
            : C.table(D.splitDelimited(data.source));
        let text,
          type = 'text/plain',
          extension = 'txt';
        if (data.output === 'markdown') {
          text = K.markdown(rows);
          extension = 'md';
        } else if (data.output === 'json') {
          text = JSON.stringify(rows, null, 2);
          extension = 'json';
          type = 'application/json';
        } else if (data.output === 'csv') {
          text = C.csv(rows);
          extension = 'csv';
          type = 'text/csv';
        } else text = rows.map((r) => r.join('\t')).join('\n');
        converted.value = text;
        last = { rows, text, type, extension };
      });
      select(tf, 'Source format', 'input', [
        ['delimited', 'CSV / TSV'],
        ['markdown', 'Markdown table'],
      ]);
      field(tf, 'Source table', 'source', 'textarea');
      select(tf, 'Output format', 'output', ['markdown', 'json', 'csv', 'text']);
      submit(tf, 'Convert table');
      let last = null;
      const converted = field(convert, 'Converted result', 'converted', 'textarea', '', false);
      tf.addEventListener('input', () => {
        last = null;
        converted.value = '';
      });
      converted.readOnly = true;
      convert.append(converted.parentElement);
      actions(
        convert,
        button('Download converted file', () => {
          if (!last) throw new Error('Convert a table first.');
          U.download(converted.value, 'converted-table.' + last.extension, last.type);
        }),
        button('Send table to Data', () => {
          if (!last) throw new Error('Convert a table first.');
          U.openData('Converted table', last.rows);
        })
      );
    },
  };
})();
