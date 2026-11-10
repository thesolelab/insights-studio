(function () {
  'use strict';
  const $ = (id) => document.getElementById('dedupe-' + id);
  let workbook = null,
    source = null,
    result = null,
    revision = 0,
    sourceFilename = 'data';
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
      if (rowCount < 1)
        throw new Error('Include a header row and at least one data row.');
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
      $('exclusion').replaceChildren();
      rows[0].forEach((header, i) => {
        const label =
          X.utils.encode_col(range.s.c + i) + ' — ' + (header || '(no header)');
        option($('column'), i, label);
        option($('exclusion'), i, label);
      });
      $('exclusion').value = String(columnCount > 1 ? 1 : 0);
      updateMode();
      $('options').hidden = false;
      $('source-info').textContent =
        `${rowCount.toLocaleString()} rows · ${columnCount} columns · First used row (${range.s.r + 1}) is the header`;
      status('Choose the column to check, then preview the cleaned rows.');
    } catch (error) {
      status(error.message, true);
    }
  }
  window.FileUploads.bind(
    $('file'),
    async (file) => {
      invalidate();
      workbook = null;
      source = null;
      $('setup').hidden = true;
      $('options').hidden = true;
      sourceFilename = file.name;
      const request = revision;
      try {
        if (!/\.(xlsx|xls|csv)$/i.test(file.name))
          throw new Error('Choose an XLSX, XLS, or CSV file.');
        if (file.size > 10 * 1024 * 1024) throw new Error('Choose a file under 10 MB.');
        status('Reading your file in this browser…');
        const X = await window.ToolLibraries.load('excel'),
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
    },
    (error) => {
      invalidate();
      status(error.message, true);
    }
  );
  function exclusionMode() {
    return $('mode').value === 'exclude';
  }
  function updateMode() {
    const exclude = exclusionMode();
    $('column-label').textContent = exclude
      ? 'Main list column (keep these unless excluded)'
      : 'Column to de-dupe';
    $('exclusion-label').hidden = false;
    $('second-name').textContent = exclude
      ? 'Exclusion list column'
      : 'Second column (for list comparison below)';
    $('blanks-label').hidden = exclude;
    $('mode-help').textContent = exclude
      ? 'Compare every main-list value against the entire exclusion column, regardless of row. Export only the main-list column, in its original order. Blank main-list cells are skipped; repeated unmatched values remain. Matching is exact after the case/space options below.'
      : 'Keep the first row for each matching value. Export all original columns.';
    $('submit').textContent = exclude ? 'Preview exclusions' : 'Preview de-dupe';
    $('download').textContent = exclude
      ? 'Download cleaned list'
      : 'Download cleaned Excel';
    $('input-label').textContent = exclude ? 'Main list entries' : 'Original rows';
    $('removed-label').textContent = exclude ? 'Excluded matches' : 'Duplicates removed';
    $('export-help').textContent = exclude
      ? 'First 30 remaining entries. Download includes the full cleaned main-list column only; the exclusion column is not exported.'
      : 'Showing the first 30 rows. Downloads include all kept rows and original columns.';
  }
  $('mode').addEventListener('change', () => {
    invalidate();
    updateMode();
    status('Mode changed. Preview again before downloading.');
  });
  $('sheet').addEventListener('change', loadSheet);
  for (const id of ['column', 'exclusion', 'trim', 'ignore-case', 'blanks'])
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
    const visibleColumns = exclusionMode()
      ? [Number($('column').value)]
      : source.rows[0].map((_, i) => i);
    for (const text of ['Excel row', ...visibleColumns.map((i) => source.rows[0][i])]) {
      const cell = document.createElement('th');
      cell.scope = 'col';
      cell.textContent = text;
      tr.append(cell);
    }
    if (removed) {
      const cell = document.createElement('th');
      cell.scope = 'col';
      cell.textContent = exclusionMode()
        ? 'Match in exclusion column (Excel row)'
        : 'First match (Excel row)';
      tr.append(cell);
    }
    head.append(tr);
    for (const item of indices.slice(0, 30)) {
      const index = removed ? item.index : item,
        row = document.createElement('tr');
      const values = [
        String(source.range.s.r + index + 1),
        ...visibleColumns.map((i) => source.rows[index][i]),
      ];
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
      const options = {
        trim: $('trim').checked,
        ignoreCase: $('ignore-case').checked,
        blank: $('blanks').value,
      };
      result = exclusionMode()
        ? window.ExcelDedupe.excludeMatches(
            source.rows,
            Number($('column').value),
            Number($('exclusion').value),
            options
          )
        : window.ExcelDedupe.deduplicate(source.rows, Number($('column').value), options);
      $('input-count').textContent = result.inputCount.toLocaleString();
      $('removed-count').textContent = result.removed.length.toLocaleString();
      $('kept-count').textContent = result.kept.length.toLocaleString();
      table($('preview'), result.kept);
      table($('removed'), result.removed, true);
      $('removed-details').hidden = result.removed.length === 0;
      if (exclusionMode()) {
        $('summary').textContent =
          `${result.removed.length.toLocaleString()} entries matched the exclusion list and were removed. ${result.kept.length.toLocaleString()} entries remain. ${result.skippedBlanks.toLocaleString()} blank main-list cells skipped. Original spelling and order are retained.`;
      } else
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
  document.getElementById('lists-use-columns').addEventListener('click', () => {
    const feedback = document.getElementById('lists-status');
    if (!source) {
      feedback.textContent = 'Upload a spreadsheet and choose its worksheet above first.';
      return;
    }
    const a = Number($('column').value),
      b = Number($('exclusion').value);
    if (a === b) {
      feedback.textContent = 'Choose two different worksheet columns above.';
      return;
    }
    window.ListComparison.setLists(
      source.rows.slice(1).map((row) => row[a]),
      source.rows.slice(1).map((row) => row[b])
    );
  });
  $('download').addEventListener('click', () => {
    if (!result || !source) return;
    try {
      const X = window.XLSX,
        cleaned = {},
        indices = [0, ...result.kept];
      const columns = exclusionMode()
        ? [source.range.s.c + Number($('column').value)]
        : source.rows[0].map((_, i) => source.range.s.c + i);
      indices.forEach((index, newRow) => {
        columns.forEach((c, newColumn) => {
          const original =
            source.sheet[X.utils.encode_cell({ r: source.range.s.r + index, c })];
          if (!original || original.v === undefined || original.t === 'z') return;
          const cell = { t: original.t, v: original.v };
          if (original.z) cell.z = original.z;
          cleaned[X.utils.encode_cell({ r: newRow, c: newColumn })] = cell;
        });
      });
      cleaned['!ref'] = X.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: indices.length - 1, c: columns.length - 1 },
      });
      cleaned['!autofilter'] = { ref: cleaned['!ref'] };
      const output = X.utils.book_new();
      X.utils.book_append_sheet(output, cleaned, source.name);
      const name = sourceFilename.replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '-');
      X.writeFile(
        output,
        (name || 'data') + (exclusionMode() ? '-excluded.xlsx' : '-deduped.xlsx')
      );
      status('Cleaned workbook downloaded. Your original file is unchanged.');
    } catch (error) {
      status('Download failed. ' + error.message, true);
    }
  });
})();
