(function () {
  'use strict';
  const $ = (id) => document.getElementById('dedupe-' + id);
  let workbook = null,
    source = null,
    result = null,
    revision = 0,
    libraryPromise;
  function status(text, error = false) {
    $('status').textContent = text;
    $('status').setAttribute('role', error ? 'alert' : 'status');
  }
  function invalidate() {
    revision++;
    result = null;
    $('result').hidden = true;
    $('download').disabled = true;
  }
  function library() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (libraryPromise) return libraryPromise;
    libraryPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
      script.integrity = 'sha384-EnyY0/GSHQGSxSgMwaIPzSESbqoOLSexfnSMN2AP+39Ckmn92stwABZynq1JyzdT';
      script.crossOrigin = 'anonymous';
      const timer = setTimeout(failed, 30000);
      function failed() {
        clearTimeout(timer);
        script.remove();
        libraryPromise = null;
        reject(
          new Error(
            'Unable to load the Excel tool. Check your connection and choose the file again.'
          )
        );
      }
      script.onload = () => {
        clearTimeout(timer);
        if (window.XLSX) resolve(window.XLSX);
        else failed();
      };
      script.onerror = failed;
      document.head.append(script);
    });
    return libraryPromise;
  }
  function option(parent, value, text) {
    const node = document.createElement('option');
    node.value = value;
    node.textContent = text;
    parent.append(node);
  }
  function loadSheet() {
    invalidate();
    source = null;
    $('options').hidden = true;
    status('');
    try {
      const X = window.XLSX,
        sheet = workbook.Sheets[$('sheet').value];
      if (!sheet || !sheet['!ref'])
        throw new Error('This worksheet is empty. Choose another worksheet.');
      const range = X.utils.decode_range(sheet['!ref']),
        rowCount = range.e.r - range.s.r,
        columnCount = range.e.c - range.s.c + 1;
      if (rowCount < 1) throw new Error('Include a header row and at least one data row.');
      if (rowCount > 50000 || columnCount > 200 || (rowCount + 1) * columnCount > 1000000)
        throw new Error('Use up to 50,000 data rows, 200 columns, and 1 million cells.');
      const rows = [];
      for (let r = range.s.r; r <= range.e.r; r++) {
        const row = [];
        for (let c = range.s.c; c <= range.e.c; c++) {
          const cell = sheet[X.utils.encode_cell({ r, c })];
          if (cell?.f && cell.v === undefined)
            throw new Error(
              'A formula has no saved value. Recalculate and save the workbook in Excel, then upload it again.'
            );
          row.push(cell ? X.utils.format_cell(cell) : '');
        }
        rows.push(row);
      }
      source = { sheet, range, rows, name: $('sheet').value };
      $('column').replaceChildren();
      rows[0].forEach((header, i) =>
        option(
          $('column'),
          i,
          X.utils.encode_col(range.s.c + i) + ' — ' + (header || '(no header)')
        )
      );
      $('options').hidden = false;
      $('source-info').textContent =
        `${rowCount.toLocaleString()} rows · ${columnCount} columns · First used row (${range.s.r + 1}) is the header`;
      status('Choose the column to check, then preview the cleaned rows.');
    } catch (error) {
      status(error.message, true);
    }
  }
  $('file').addEventListener('change', async () => {
    invalidate();
    workbook = null;
    source = null;
    $('setup').hidden = true;
    $('options').hidden = true;
    const file = $('file').files[0];
    if (!file) {
      status('');
      return;
    }
    const request = revision;
    try {
      if (!/\.(xlsx|xls|csv)$/i.test(file.name))
        throw new Error('Choose an XLSX, XLS, or CSV file.');
      if (file.size > 10 * 1024 * 1024) throw new Error('Choose a file under 10 MB.');
      status('Reading your file in this browser…');
      const X = await library(),
        bytes = await file.arrayBuffer();
      if (request !== revision) return;
      const next = X.read(bytes, { type: 'array', cellNF: true, raw: true });
      if (!next.SheetNames.length) throw new Error('No worksheets found.');
      workbook = next;
      $('sheet').replaceChildren();
      next.SheetNames.forEach((name) => option($('sheet'), name, name));
      $('setup').hidden = false;
      loadSheet();
    } catch (error) {
      if (request === revision) status(error.message, true);
    }
  });
  $('sheet').addEventListener('change', loadSheet);
  for (const id of ['column', 'trim', 'ignore-case', 'blanks'])
    $(id).addEventListener('change', () => {
      invalidate();
      status('Settings changed. Preview again before downloading.');
    });
  function table(parent, indices, removed = false) {
    parent.replaceChildren();
    const node = document.createElement('table'),
      head = document.createElement('thead'),
      body = document.createElement('tbody'),
      tr = document.createElement('tr');
    for (const text of ['Excel row', ...source.rows[0]]) {
      const cell = document.createElement('th');
      cell.scope = 'col';
      cell.textContent = text;
      tr.append(cell);
    }
    if (removed) {
      const cell = document.createElement('th');
      cell.scope = 'col';
      cell.textContent = 'First match (Excel row)';
      tr.append(cell);
    }
    head.append(tr);
    for (const item of indices.slice(0, 30)) {
      const index = removed ? item.index : item,
        row = document.createElement('tr');
      const values = [String(source.range.s.r + index + 1), ...source.rows[index]];
      if (removed) values.push(String(source.range.s.r + item.firstIndex + 1));
      for (const text of values) {
        const cell = document.createElement('td');
        cell.textContent = text;
        row.append(cell);
      }
      body.append(row);
    }
    node.append(head, body);
    parent.append(node);
  }
  $('form').addEventListener('submit', (event) => {
    event.preventDefault();
    invalidate();
    try {
      if (!source) throw new Error('Choose a file and worksheet first.');
      result = window.ExcelDedupe.deduplicate(source.rows, Number($('column').value), {
        trim: $('trim').checked,
        ignoreCase: $('ignore-case').checked,
        blank: $('blanks').value,
      });
      $('input-count').textContent = result.inputCount.toLocaleString();
      $('removed-count').textContent = result.removed.length.toLocaleString();
      $('kept-count').textContent = result.kept.length.toLocaleString();
      table($('preview'), result.kept);
      table($('removed'), result.removed, true);
      $('removed-details').hidden = result.removed.length === 0;
      $('summary').textContent = result.removed.length
        ? `Keep the first row for each match in “${source.rows[0][Number($('column').value)] || $('column').selectedOptions[0].textContent}”. ${result.duplicateKeys.toLocaleString()} repeated values found.`
        : 'No duplicate values found with these settings. All rows will be kept.';
      $('result').hidden = false;
      $('download').disabled = false;
      status('Preview ready. Download the cleaned worksheet when you are ready.');
    } catch (error) {
      result = null;
      status(error.message, true);
    }
  });
  $('download').addEventListener('click', () => {
    if (!result || !source) return;
    try {
      const X = window.XLSX,
        cleaned = {},
        indices = [0, ...result.kept];
      indices.forEach((index, newRow) => {
        for (let c = source.range.s.c; c <= source.range.e.c; c++) {
          const original = source.sheet[X.utils.encode_cell({ r: source.range.s.r + index, c })];
          if (!original || original.v === undefined || original.t === 'z') continue;
          const cell = { t: original.t, v: original.v };
          if (original.z) cell.z = original.z;
          cleaned[X.utils.encode_cell({ r: newRow, c: c - source.range.s.c })] = cell;
        }
      });
      cleaned['!ref'] = X.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: indices.length - 1, c: source.rows[0].length - 1 },
      });
      cleaned['!autofilter'] = { ref: cleaned['!ref'] };
      const output = X.utils.book_new();
      X.utils.book_append_sheet(output, cleaned, source.name);
      const name = ($('file').files[0]?.name || 'data')
        .replace(/\.[^.]+$/, '')
        .replace(/[^\w-]+/g, '-');
      X.writeFile(output, (name || 'data') + '-deduped.xlsx');
      status('Cleaned workbook downloaded. Your original file is unchanged.');
    } catch (error) {
      status('Download failed. ' + error.message, true);
    }
  });
})();
