(function () {
  'use strict';
  const $ = id => document.getElementById('builder-' + id);
  const D = window.ChartData;
  const M = window.ChartModes;
  const C = window.ChartColors;
  const NS = 'http://www.w3.org/2000/svg';
  let table = null, workbook = null, revision = 0, current = null, exporting = false;
  let editorRows = [], dirty = false;
  const libraries = new Map();
  const colorOverrides = new Map();
  let seriesBindings = [], sliceBindings = [], sliceSignature = '';

  function el(tag, attrs = {}, text) {
    const element = document.createElement(tag);
    for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function svgNode(tag, attrs = {}, text) {
    const element = document.createElementNS(NS, tag);
    for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function token(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function palette() { return C.PALETTES[$('palette').value || 'signal'].colors; }
  function colorFor(key, index) { return colorOverrides.get(key) || palette()[index % palette().length]; }
  function sliceKey(name, index) { return 'slice:' + index + ':' + name; }
  function colorControl(name, key, index, label) {
    const control = C.control(name, colorFor(key, index), color => { colorOverrides.set(key, color); render(); }, label);
    return { key, index, control };
  }
  function sliceControls(c) {
    $('slice-colors').hidden = !c.definition.radial;
    if (!c.definition.radial) return;
    const signature = JSON.stringify(c.labels);
    if (signature === sliceSignature) return;
    sliceSignature = signature; sliceBindings = [];
    $('slice-colors').replaceChildren();
    c.labels.forEach((name, index) => {
      const binding = colorControl(name, sliceKey(name, index), index, name);
      sliceBindings.push(binding); $('slice-colors').appendChild(binding.control.element);
    });
  }
  function buttons(enabled) {
    for (const name of ['svg', 'png', 'pptx']) $(name).disabled = !enabled || (name === 'pptx' && exporting);
  }
  function invalidate(message) {
    current = null;
    buttons(false);
    $('preview').hidden = true;
    $('status').textContent = message;
  }
  function fail(error) {
    $('error').textContent = error.message || String(error);
    $('slice-colors').hidden = true;
    invalidate('Update the data or settings to create a chart.');
  }
  function option(select, value, label) { select.appendChild(el('option', { value }, label)); }

  for (const [id, preset] of Object.entries(C.PALETTES)) option($('palette'), id, preset.name);
  $('palette').addEventListener('change', () => {
    colorOverrides.clear();
    for (const binding of [...seriesBindings, ...sliceBindings]) binding.control.setColor(colorFor(binding.key, binding.index));
    render();
  });

  for (const family of [...new Set(M.MODES.map(mode => mode.family))]) {
    const group = el('optgroup', { label: family });
    M.MODES.filter(mode => mode.family === family).forEach(mode => option(group, mode.id, mode.name));
    $('mode').appendChild(group);
  }

  function modeControls() {
    const mode = M.definition($('mode').value), combo = mode.id === 'combo';
    $('dual').disabled = !combo;
    $('dual').closest('label').hidden = !combo;
    $('dual-help').hidden = !combo;
    $('right-format').closest('label').hidden = !combo;
    $('left-format').closest('label').hidden = mode.radial;
    $('category-label').textContent = mode.xy ? 'X values column' : 'Category column';
    $('value-format-label').textContent = combo ? 'Left axis format' : 'Value format';
    $('series').classList.toggle('single-style', !combo);
    $('right-format').disabled = !combo || !$('dual').checked;
    $('size-label').hidden = mode.id !== 'bubble';
    if (!mode.radial) $('slice-colors').hidden = true;
    $('mode-help').textContent = mode.radial
      ? 'Select one numeric series and up to 12 categories. Values must be non-negative, with at least one positive value.'
      : mode.xy ? (mode.id === 'bubble' ? 'Choose a numeric X column, one or more Y series, and a separate bubble-size column. Sizes must be non-negative.' : 'Choose a numeric X column and one or more Y series. Points use their actual X values, not category spacing.')
      : mode.native === 'radar' ? 'Compare series across 3–12 categories using non-negative values on a shared scale.'
      : combo ? 'Choose column or line for each series. Optional independent left/right axes support different units.'
      : mode.percent ? 'Show each category as a share of 100%. Select multiple non-negative series to compare contributions.'
      : mode.stacked && mode.native === 'area' ? 'Stack non-negative series to show their combined contribution on a shared scale.'
      : 'All selected series use this chart style on a shared scale. Choose Combination for independent left/right axes.';
    let selected = 0;
    for (const row of $('series').children) {
      const check = row.querySelector('input');
      check.disabled = mode.id === 'bubble' && row.dataset.column === $('size').value;
      if (check.disabled) check.checked = false;
      if (mode.radial && check.checked && selected++) check.checked = false;
      row.querySelector('.series-type').disabled = !combo;
      row.querySelector('.series-type').closest('label').hidden = !combo;
      row.querySelector('.series-axis').disabled = !combo || !$('dual').checked;
      row.querySelector('.series-axis').closest('label').hidden = !combo;
      row.querySelector('.color-control').hidden = mode.radial;
    }
  }

  function edited() {
    revision++; dirty = true; workbook = null;
    $('sheet-label').hidden = true;
    $('data-source').textContent = 'Your data · editable';
    $('error').textContent = '';
    $('import-status').textContent = 'Changes not applied';
    invalidate('Data changed. Select Update chart to refresh the preview.');
  }

  function syncEditor() {
    $('data').value = D.serializeTable(editorRows);
    edited();
  }

  function drawEditor() {
    const grid = el('table', { class: 'data-grid' });
    grid.appendChild(el('caption', { class: 'sr-only' }, 'Chart data. Edit column names and values, then select Update chart.'));
    const head = el('thead'), header = el('tr');
    header.appendChild(el('th', { scope: 'col', class: 'row-number' }, '#'));
    editorRows[0].forEach((name, column) => {
      const cell = el('th', { scope: 'col' });
      const field = el('input', { type: 'text', 'data-row': 0, 'data-column': column,
        'aria-label': `Column ${column + 1} name`, maxlength: 80 });
      field.value = name;
      const remove = el('button', { type: 'button', class: 'grid-remove', 'data-remove-column': column,
        'aria-label': `Remove column ${name || column + 1}`, title: 'Remove column' }, '×');
      remove.disabled = editorRows[0].length <= 2;
      cell.append(field, remove); header.appendChild(cell);
    });
    const actionHeader = el('th', { scope: 'col', class: 'row-actions' });
    actionHeader.appendChild(el('span', { class: 'sr-only' }, 'Row actions'));
    header.appendChild(actionHeader);
    head.appendChild(header); grid.appendChild(head);
    const body = el('tbody');
    editorRows.slice(1).forEach((values, index) => {
      const row = el('tr');
      row.appendChild(el('th', { scope: 'row', class: 'row-number' }, String(index + 1).padStart(2, '0')));
      values.forEach((value, column) => {
        const numeric = table && table.numeric.includes(column);
        const cell = el('td');
        const field = el('input', { type: 'text', class: numeric ? 'numeric-cell' : '',
          'data-row': index + 1, 'data-column': column,
          inputmode: numeric ? 'decimal' : 'text',
          'aria-label': `${editorRows[0][column] || 'Column ' + (column + 1)}, row ${index + 1}` });
        field.value = numeric && /^[+-]?\d+$/.test(value) && D.numberCell(value) !== null
          ? Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 }) : value;
        cell.appendChild(field); row.appendChild(cell);
      });
      const actions = el('td', { class: 'row-actions' });
      const remove = el('button', { type: 'button', class: 'grid-remove', 'data-remove-row': index + 1,
        'aria-label': `Remove row ${index + 1}`, title: 'Remove row' }, '×');
      remove.disabled = editorRows.length <= 2;
      actions.appendChild(remove); row.appendChild(actions); body.appendChild(row);
    });
    grid.appendChild(body); $('grid').replaceChildren(grid);
    $('add-row').disabled = editorRows.length - 1 >= D.MAX_ROWS;
    $('add-column').disabled = editorRows[0].length >= D.MAX_SERIES + 1;
  }

  $('grid').addEventListener('input', event => {
    const field = event.target.closest('input[data-row]');
    if (!field) return;
    editorRows[Number(field.dataset.row)][Number(field.dataset.column)] = field.value;
    syncEditor();
  });
  $('grid').addEventListener('click', event => {
    const row = event.target.closest('[data-remove-row]');
    const column = event.target.closest('[data-remove-column]');
    if (row && editorRows.length > 2) editorRows.splice(Number(row.dataset.removeRow), 1);
    else if (column && editorRows[0].length > 2) editorRows.forEach(values => values.splice(Number(column.dataset.removeColumn), 1));
    else return;
    syncEditor(); drawEditor(); $('grid').focus();
  });
  $('grid').addEventListener('paste', event => {
    const text = event.clipboardData.getData('text/plain');
    if (!/[\t\r\n]/.test(text)) return;
    event.preventDefault(); $('data').value = text; edited();
    try { useTable(D.parseDelimited(text)); } catch (error) { fail(error); }
  });
  $('add-row').addEventListener('click', () => {
    if (editorRows.length - 1 >= D.MAX_ROWS) return;
    editorRows.push(editorRows[0].map(() => ''));
    syncEditor(); drawEditor();
    $('grid').querySelector(`input[data-row="${editorRows.length - 1}"]`).focus();
  });
  $('add-column').addEventListener('click', () => {
    if (editorRows[0].length >= D.MAX_SERIES + 1) return;
    let number = editorRows[0].length;
    while (editorRows[0].includes('Series ' + number)) number++;
    editorRows[0].push('Series ' + number);
    editorRows.slice(1).forEach(row => row.push('0'));
    syncEditor(); drawEditor();
    $('grid').querySelector(`input[data-row="0"][data-column="${editorRows[0].length - 1}"]`).focus();
  });

  function seriesControls() {
    $('series').replaceChildren();
    seriesBindings = [];
    const category = Number($('category').value);
    const columns = table.numeric.filter(index => index !== category);
    columns.forEach((index, position) => {
      const row = el('div', { class: 'builder-series-row', 'data-column': index });
      const include = el('label', { class: 'builder-toggle' });
      const check = el('input', { type: 'checkbox', 'aria-label': 'Include ' + table.headers[index] });
      check.checked = position < D.MAX_SERIES;
      include.append(check, document.createTextNode(table.headers[index]));
      const typeLabel = el('label', { class: 'builder-label' }, 'Chart type');
      const type = el('select', { class: 'series-type', 'aria-label': table.headers[index] + ' chart type' });
      option(type, 'bar', 'Column'); option(type, 'line', 'Line');
      type.value = position === 0 ? 'bar' : 'line';
      typeLabel.appendChild(type);
      const axisLabel = el('label', { class: 'builder-label' }, 'Axis');
      const axis = el('select', { class: 'series-axis', 'aria-label': table.headers[index] + ' axis' });
      option(axis, 'left', 'Left'); option(axis, 'right', 'Right');
      axis.value = position === 1 && $('dual').checked ? 'right' : 'left';
      axis.disabled = !$('dual').checked;
      axisLabel.appendChild(axis);
      const binding = colorControl(table.headers[index], 'series:' + table.headers[index], position, 'Series color');
      seriesBindings.push(binding);
      row.append(include, typeLabel, axisLabel, binding.control.element);
      $('series').appendChild(row);
    });
    for (const [side, position] of [['left', 0], ['right', 1]]) {
      const index = columns[position];
      $(side + '-format').value = index !== undefined && table.rows.some(row => row[index].endsWith('%')) ? 'percent' : 'number';
    }
    const previousSize = $('size').value;
    $('size').replaceChildren();
    columns.forEach(index => option($('size'), index, table.headers[index]));
    $('size').value = columns.map(String).includes(previousSize) ? previousSize : String(columns[columns.length - 1] ?? '');
    modeControls();
  }

  function useTable(next) {
    const sameHeaders = table && JSON.stringify(table.headers) === JSON.stringify(next.headers);
    // A typo in an edited numeric series must not silently remove that series.
    if (sameHeaders) {
      for (const control of $('series').children) {
        if (!control.querySelector('input').checked) continue;
        const column = Number(control.dataset.column);
        next.rows.forEach((row, index) => {
          if (D.numberCell(row[column]) === null) throw new Error(`Enter a numeric value for ${next.headers[column]} in row ${index + 2}.`);
        });
      }
    }
    const preserveSettings = sameHeaders
      && JSON.stringify(table.numeric) === JSON.stringify(next.numeric);
    table = next;
    dirty = false;
    editorRows = [table.headers.slice(), ...table.rows.map(row => row.slice())];
    drawEditor();
    if (!preserveSettings) {
      $('category').replaceChildren();
      table.headers.forEach((header, index) => option($('category'), index, header));
      seriesControls();
    }
    $('settings').hidden = false;
    $('import-status').textContent = `${table.rows.length} rows · ${table.headers.length} columns`;
    render();
  }

  function config() {
    if (!table) throw new Error('Create a chart from your table first.');
    const category = Number($('category').value);
    const labels = table.rows.map((row, index) => {
      if (!row[category]) throw new Error(`Add a category label in row ${index + 2}.`);
      return row[category];
    });
    const colors = palette();
    const selected = [...$('series').children].filter(row => row.querySelector('input').checked);
    if (!selected.length) throw new Error('Select at least one numeric series.');
    if (selected.length > D.MAX_SERIES) throw new Error(`Select at most ${D.MAX_SERIES} series.`);
    const combo = $('mode').value === 'combo';
    const series = selected.map((row, index) => {
      const column = Number(row.dataset.column);
      const values = table.rows.map((data, i) => {
        const number = D.numberCell(data[column]);
        if (number === null) throw new Error(`Enter a numeric value for ${table.headers[column]} in row ${i + 2}. Blank values are not treated as zero.`);
        return number;
      });
      return { name: table.headers[column], values, type: row.querySelector('.series-type').value,
        axis: combo && $('dual').checked ? row.querySelector('.series-axis').value : 'left',
        color: colorFor('series:' + table.headers[column], table.numeric.filter(i => i !== category).indexOf(column)) };
    });
    if (!series.some(item => item.axis === 'left')) throw new Error('Keep at least one selected series on the left axis.');
    const axes = {};
    for (const side of ['left', 'right']) {
      const values = series.filter(item => item.axis === side).flatMap(item => item.values);
      if (values.length) axes[side] = { ...D.axisScale(values), format: $(side + '-format').value };
    }
    const next = M.prepare({ title: $('title').value.trim() || 'Untitled chart', category: table.headers[category], labels, series, axes }, $('mode').value, {
      colors, xValues: table.rows.map(row => row[category]), xPercent: table.rows.some(row => row[category].endsWith('%')),
      sizes: table.rows.map(row => row[Number($('size').value)] ?? '')
    });
    if (next.definition.radial) next.legend.forEach((item, index) => { item.color = colorFor(sliceKey(item.name, index), index); });
    return next;
  }

  function format(number, mode) {
    return new Intl.NumberFormat('en-US', mode === 'percent'
      ? { style: 'percent', maximumFractionDigits: 2 }
      : { maximumFractionDigits: 4, notation: Math.abs(number) >= 1e6 ? 'compact' : 'standard' }).format(number);
  }

  function draw(c) {
    if (c.mode !== 'combo') { M.render(c, $('chart'), token); return; }
    const svg = $('chart'), chart = document.createDocumentFragment();
    svg.setAttribute('viewBox', '0 0 1100 620');
    const text = token('--text'), muted = token('--text-muted'), font = token('--font-body');
    const left = 110, right = 990, top = 95, bottom = 460;
    const x = i => left + (i + 0.5) * (right - left) / c.labels.length;
    const y = (value, axis) => bottom - (value - axis.min) / (axis.max - axis.min) * (bottom - top);
    const label = (value, attrs, parent = chart) => parent.appendChild(svgNode('text', {
      fill: muted, 'font-family': font, 'font-size': 14, 'font-weight': 600, ...attrs
    }, value));
    chart.appendChild(svgNode('title', {}, c.title));
    chart.appendChild(svgNode('desc', {}, c.series.map(s => `${s.name}: ${s.type}, ${s.axis} axis`).join('; ')));
    chart.appendChild(svgNode('rect', { width: 1100, height: 620, fill: token('--surface-inset') }));
    label(c.title, { x: 45, y: 42, fill: text, 'font-size': 25, 'font-weight': 700 });
    for (const [side, axis] of Object.entries(c.axes)) {
      const ticks = Math.round((axis.max - axis.min) / axis.step);
      for (let i = 0; i <= ticks; i++) {
        const value = axis.min + i * axis.step, yy = y(value, axis);
        if (side === 'left') chart.appendChild(svgNode('line', {
          x1: left, x2: right, y1: yy, y2: yy, stroke: text, 'stroke-opacity': 0.10
        }));
        label(format(value, axis.format), { x: side === 'left' ? left - 14 : right + 14, y: yy + 5, 'text-anchor': side === 'left' ? 'end' : 'start' });
      }
    }
    const skip = Math.max(1, Math.ceil(c.labels.length / 10));
    c.labels.forEach((value, index) => {
      if (index % skip === 0 || index === c.labels.length - 1) label(value.length > 16 ? value.slice(0, 15) + '…' : value,
        { x: x(index), y: bottom + 26, 'text-anchor': 'middle' });
    });
    const bars = c.series.filter(s => s.type === 'bar');
    const band = (right - left) / c.labels.length * 0.7;
    // Paint lines above columns regardless of the input column order.
    const paintOrder = [...c.series].sort((a, b) => Number(a.type === 'line') - Number(b.type === 'line'));
    paintOrder.forEach(series => {
      const seriesIndex = c.series.indexOf(series);
      const axis = c.axes[series.axis];
      if (series.type === 'bar') {
        const width = band / bars.length;
        series.values.forEach((value, index) => {
          const zero = y(0, axis), yy = y(value, axis);
          const rect = svgNode('rect', { x: x(index) - band / 2 + bars.indexOf(series) * width,
            y: Math.min(zero, yy), width: Math.max(0.5, width - 2), height: Math.abs(zero - yy), fill: series.color });
          rect.appendChild(svgNode('title', {}, `${c.labels[index]} · ${series.name}: ${format(value, axis.format)}`));
          chart.appendChild(rect);
        });
      } else {
        chart.appendChild(svgNode('path', { d: series.values.map((value, index) => `${index ? 'L' : 'M'}${x(index)} ${y(value, axis)}`).join(' '),
          fill: 'none', stroke: series.color, 'stroke-width': 3, 'stroke-dasharray': seriesIndex > 2 ? '7 4' : 'none' }));
        series.values.forEach((value, index) => {
          const point = svgNode('circle', { cx: x(index), cy: y(value, axis), r: 3, fill: series.color });
          point.appendChild(svgNode('title', {}, `${c.labels[index]} · ${series.name}: ${format(value, axis.format)}`));
          chart.appendChild(point);
        });
      }
    });
    // Center each legend row using its actual text widths, including short rows.
    const context = document.createElement('canvas').getContext('2d');
    context.font = `600 14px ${font}`;
    const rows = [[]], gap = 28;
    let rowWidth = 0;
    c.series.forEach(series => {
      const name = series.name.length > 26 ? series.name.slice(0, 25) + '…' : series.name;
      const width = 19 + context.measureText(name).width;
      if (rowWidth && rowWidth + gap + width > right - left) { rows.push([]); rowWidth = 0; }
      rows[rows.length - 1].push({ name, width, color: series.color });
      rowWidth += (rowWidth ? gap : 0) + width;
    });
    const legend = svgNode('g', { 'data-chart-legend': '' });
    rows.forEach((items, row) => {
      const width = items.reduce((sum, item) => sum + item.width, 0) + gap * (items.length - 1);
      let lx = (left + right - width) / 2;
      const ly = 550 + row * 26;
      const group = svgNode('g', { 'data-legend-row': row });
      items.forEach(item => {
        group.appendChild(svgNode('rect', { x: lx, y: ly - 10, width: 10, height: 10, fill: item.color }));
        label(item.name, { x: lx + 19, y: ly }, group);
        lx += item.width + gap;
      });
      legend.appendChild(group);
    });
    chart.appendChild(legend);
    svg.setAttribute('aria-label', c.title + '. ' + c.series.map(s => s.name + ' on the ' + s.axis + ' axis').join(', '));
    svg.replaceChildren(chart);
  }

  function render() {
    if (dirty) { invalidate('Data changed. Select Update chart to refresh the preview.'); return; }
    try {
      const next = config();
      draw(next);
      sliceControls(next);
      current = next;
      $('preview').hidden = false;
      $('error').textContent = '';
      $('status').textContent = `${next.definition.name} · ${next.labels.length} ${next.definition.xy ? 'points' : 'categories'} · ${next.series.length} series${next.axes.right ? ' · Independent left and right scales' : ''}`;
      buttons(true);
    } catch (error) { fail(error); }
  }

  function library(name) {
    if (libraries.has(name)) return libraries.get(name);
    const sources = {
      excel: ['https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js', 'sha384-EnyY0/GSHQGSxSgMwaIPzSESbqoOLSexfnSMN2AP+39Ckmn92stwABZynq1JyzdT'],
      powerpoint: ['https://cdn.jsdelivr.net/npm/pptxgenjs@4.0.1/dist/pptxgen.bundle.js', 'sha384-qb0Xhi7LLYpvW1HCK6oMrmDLSY9sy7vwm6ZlV6KjtrlL9yg30+YN4neTwnmX+Kp8']
    };
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = sources[name][0]; script.integrity = sources[name][1]; script.crossOrigin = 'anonymous';
      const timeout = setTimeout(() => failed(), 30000);
      function failed() {
        clearTimeout(timeout); script.remove(); libraries.delete(name);
        reject(new Error('Unable to load the ' + name + ' tool. Check your connection and try again.'));
      }
      script.onload = () => { clearTimeout(timeout); resolve(); };
      script.onerror = failed;
      document.head.appendChild(script);
    });
    libraries.set(name, promise);
    return promise;
  }

  function useSheet() {
    table = null;
    const worksheet = workbook.Sheets[$('sheet').value];
    const rows = window.XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '', blankrows: false });
    useTable(D.normalizeTable(rows));
    $('data').value = D.serializeTable(rows);
  }

  $('form').addEventListener('submit', event => {
    event.preventDefault(); revision++; dirty = true;
    try { useTable(D.parseDelimited($('data').value)); } catch (error) { fail(error); }
  });
  $('data').addEventListener('input', () => {
    edited();
  });
  $('file').addEventListener('change', async () => {
    const file = $('file').files[0];
    if (!file) return;
    const request = ++revision;
    dirty = true;
    $('data-source').textContent = 'Your data · editable';
    invalidate('Reading file…'); $('error').textContent = '';
    workbook = null; table = null; $('sheet-label').hidden = true;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('Choose a file no larger than 5 MB.');
      if (/\.(csv|tsv)$/i.test(file.name)) {
        const text = await file.text();
        if (request !== revision) return;
        $('data').value = text; useTable(D.parseDelimited(text));
      } else if (/\.xlsx?$/i.test(file.name)) {
        await library('excel');
        const bytes = await file.arrayBuffer();
        if (request !== revision) return;
        workbook = window.XLSX.read(bytes, { type: 'array', cellDates: true });
        if (!workbook.SheetNames.length) throw new Error('No worksheets found in this file.');
        $('sheet').replaceChildren();
        workbook.SheetNames.forEach(name => option($('sheet'), name, name));
        $('sheet-label').hidden = workbook.SheetNames.length < 2;
        useSheet();
      } else throw new Error('Choose a CSV, TSV, XLSX, or XLS file.');
    } catch (error) { if (request === revision) fail(error); }
    finally { $('file').value = ''; }
  });
  $('sheet').addEventListener('change', () => { try { useSheet(); } catch (error) { fail(error); } });
  $('category').addEventListener('change', () => { if (table) { seriesControls(); render(); } });
  $('mode').addEventListener('change', () => {
    if (!table) return;
    const mode = M.definition($('mode').value);
    if (mode.xy && !table.numeric.includes(Number($('category').value))) {
      $('category').value = table.numeric[0]; seriesControls();
    }
    modeControls(); render();
  });
  $('size').addEventListener('change', () => { modeControls(); render(); });
  $('example').addEventListener('click', () => {
    revision++; table = null; workbook = null; $('sheet-label').hidden = true;
    const rows = M.example($('mode').value);
    $('data').value = D.serializeTable(rows);
    $('title').value = M.definition($('mode').value).name + ' example';
    $('data-source').textContent = 'Sample data · editable';
    try { useTable(D.normalizeTable(rows)); } catch (error) { fail(error); }
  });
  $('settings').addEventListener('input', event => {
    if (event.target.closest('.color-control')) return;
    if (!table || [$('category'), $('mode'), $('size')].includes(event.target)) return;
    if (event.target === $('dual')) {
      modeControls();
    }
    render();
  });

  function serializedChart() {
    const copy = $('chart').cloneNode(true);
    copy.setAttribute('width', '2200'); copy.setAttribute('height', String($('chart').viewBox.baseVal.height * 2));
    copy.setAttribute('xmlns', NS);
    return new XMLSerializer().serializeToString(copy);
  }
  function save(blob, name) {
    const url = URL.createObjectURL(blob), anchor = el('a', { href: url, download: name });
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function filename(c, extension) { return (c.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 70) || 'stat-console-chart') + '.' + extension; }
  $('svg').addEventListener('click', () => {
    if (current) save(new Blob([serializedChart()], { type: 'image/svg+xml;charset=utf-8' }), filename(current, 'svg'));
  });
  $('png').addEventListener('click', () => {
    if (!current) return;
    const name = filename(current, 'png');
    const url = URL.createObjectURL(new Blob([serializedChart()], { type: 'image/svg+xml;charset=utf-8' }));
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => { if (blob) save(blob, name); else $('error').textContent = 'PNG export failed. Try SVG.'; }, 'image/png');
      } catch (error) { $('error').textContent = 'PNG export failed. Try SVG.'; }
      finally { URL.revokeObjectURL(url); }
    };
    image.onerror = () => { URL.revokeObjectURL(url); $('error').textContent = 'PNG export failed. Try SVG.'; };
    image.src = url;
  });

  // Flatten token colors to portable hex for native Office charts, including alpha.
  function officeColor(color) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = token('--surface-inset'); ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3).map(value => value.toString(16).padStart(2, '0')).join('');
  }

  function addNativeChart(pptx, slide, c) {
    const text = officeColor(token('--text')), muted = officeColor(token('--text-muted'));
    const background = officeColor(token('--surface-inset'));
    const groups = [];
    for (const type of ['bar', 'line']) {
      for (const axis of ['left', 'right']) {
        const series = c.series.filter(s => s.axis === axis && s.type === type);
        if (!series.length) continue;
        groups.push({ type: type === 'bar' ? pptx.ChartType.bar : pptx.ChartType.line,
          data: series.map(s => ({ name: s.name, labels: c.labels, values: s.values })),
          options: { chartColors: series.map(s => officeColor(s.color)), secondaryValAxis: axis === 'right', secondaryCatAxis: axis === 'right',
            barDir: 'col', barGrouping: 'clustered', lineDataSymbol: type === 'line' ? 'circle' : 'none', lineDataSymbolSize: 4, lineSize: 2 } });
      }
    }
    const axisOptions = axis => ({ valAxisTitle: '', showValAxisTitle: false,
      valAxisMinVal: axis.min, valAxisMaxVal: axis.max, valAxisMajorUnit: axis.step,
      valAxisLabelFormatCode: axis.format === 'percent' ? '0.##%' : '#,##0.####', valAxisLabelColor: muted, valAxisTitleColor: text });
    const axes = c.axes.left ? [axisOptions(c.axes.left)] : [];
    if (c.axes.right) axes.push({ ...axisOptions(c.axes.right), valGridLine: { style: 'none' } });
    slide.background = { color: officeColor(token('--bg')) };
    slide.addText(c.title, { x: 0.6, y: 0.3, w: 12.1, h: 0.55, fontFace: 'Arial', fontSize: 26, bold: true, color: text, margin: 0 });
    const options = {
      x: 0.6, y: 1.05, w: 12.1, h: 5.7, showTitle: false, showLegend: true, legendPos: 'b',
      legendColor: text, legendFontSize: 11, fontFace: 'Arial', fontSize: 11,
      chartArea: { fill: { color: background }, border: { color: background, pt: 0 } },
      plotArea: { fill: { color: background }, border: { color: background, pt: 0 } },
      catAxisLabelColor: muted, catAxisTitleColor: text, catAxisTitle: '', showCatAxisTitle: false,
      catAxisLabelFontSize: 10, valAxisLabelFontSize: 10, valAxisTitleFontSize: 12,
      catAxisLineColor: muted, valAxisLineColor: muted, catAxisLineShow: true, valAxisLineShow: true,
      catAxisLabelFrequency: Math.max(1, Math.ceil(c.labels.length / 10)).toString(),
      valGridLine: { color: officeColor(token('--border')), width: 0.5 }, catGridLine: { style: 'none' },
      barDir: 'col', showValue: false, showBorder: false,
      valAxes: axes.length ? axes : undefined, catAxes: c.axes.right ? [{}, { catAxisHidden: true, showCatAxisTitle: false, catAxisTitle: '' }] : [{}]
    };
    if (c.mode === 'combo') slide.addChart(groups, options);
    else {
      const spec = M.nativeSpec(c, officeColor);
      slide.addChart(spec.type, spec.data, { ...options, ...spec.options });
    }
  }

  $('pptx').addEventListener('click', async () => {
    if (!current || exporting) return;
    const snapshot = current;
    exporting = true; buttons(true); $('status').textContent = 'Preparing editable PowerPoint…';
    try {
      await library('powerpoint');
      const pptx = new window.PptxGenJS();
      pptx.layout = 'LAYOUT_WIDE'; pptx.author = 'Stat Console'; pptx.subject = 'Editable chart and source data'; pptx.title = snapshot.title;
      addNativeChart(pptx, pptx.addSlide(), snapshot);
      if (['bubble', 'percent-area'].includes(snapshot.mode) || snapshot.definition.radial) {
        // PptxGenJS 4.0.1 writes zero-valued bubble cells as blanks. Restore them
        // in the embedded workbook so Edit Data preserves the source numbers.
        const zip = await window.JSZip.loadAsync(await pptx.write({ outputType: 'blob' }));
        for (const name of Object.keys(zip.files).filter(name => snapshot.mode === 'bubble' && name.startsWith('ppt/embeddings/') && name.endsWith('.xlsx'))) {
          const workbookZip = await window.JSZip.loadAsync(await zip.file(name).async('uint8array'));
          const path = 'xl/worksheets/sheet1.xml';
          const xml = new DOMParser().parseFromString(await workbookZip.file(path).async('string'), 'application/xml');
          for (const row of xml.getElementsByTagName('row')) {
            if (Number(row.getAttribute('r')) < 2) continue;
            for (const value of row.getElementsByTagName('v')) if (value.textContent === '') value.textContent = '0';
          }
          workbookZip.file(path, new XMLSerializer().serializeToString(xml));
          // Rebuild the table headers with XML escaping and the full data range.
          // The bundled bubble writer truncates this range and leaves names raw.
          const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
          const headers = [snapshot.category, ...snapshot.series.flatMap((series, i) => [series.name, `Bubble size ${i + 1}`])];
          const used = new Set();
          headers.forEach((header, i) => {
            let unique = header, suffix = 2;
            while (used.has(unique)) unique = header + ' ' + suffix++;
            used.add(unique); headers[i] = unique;
          });
          const strings = document.implementation.createDocument(ns, 'sst');
          strings.documentElement.setAttribute('count', headers.length);
          strings.documentElement.setAttribute('uniqueCount', headers.length);
          const definition = document.implementation.createDocument(ns, 'table');
          const tableRoot = definition.documentElement;
          for (const [key, value] of Object.entries({ id: 1, name: 'Table1', displayName: 'Table1', ref: `A1:${String.fromCharCode(64 + headers.length)}${snapshot.labels.length + 1}`, totalsRowShown: 0 })) tableRoot.setAttribute(key, value);
          const columns = definition.createElementNS(ns, 'tableColumns');
          columns.setAttribute('count', headers.length);
          headers.forEach((header, i) => {
            const item = strings.createElementNS(ns, 'si'), text = strings.createElementNS(ns, 't');
            text.textContent = header; item.appendChild(text); strings.documentElement.appendChild(item);
            const column = definition.createElementNS(ns, 'tableColumn');
            column.setAttribute('id', i + 1); column.setAttribute('name', header); columns.appendChild(column);
          });
          tableRoot.appendChild(columns);
          workbookZip.file('xl/sharedStrings.xml', new XMLSerializer().serializeToString(strings));
          workbookZip.file('xl/tables/table1.xml', new XMLSerializer().serializeToString(definition));
          zip.file(name, await workbookZip.generateAsync({ type: 'uint8array' }));
        }
        // The library accepts percentStacked area options but omits their XML
        // grouping element. Add it while retaining the original editable data.
        if (snapshot.mode === 'percent-area') {
          for (const name of Object.keys(zip.files).filter(name => /^ppt\/charts\/chart\d+\.xml$/.test(name))) {
            const xml = new DOMParser().parseFromString(await zip.file(name).async('string'), 'application/xml');
            const ns = 'http://schemas.openxmlformats.org/drawingml/2006/chart';
            for (const area of xml.getElementsByTagNameNS(ns, 'areaChart')) {
              const grouping = xml.createElementNS(ns, 'c:grouping');
              grouping.setAttribute('val', 'percentStacked');
              area.insertBefore(grouping, area.firstChild);
            }
            zip.file(name, new XMLSerializer().serializeToString(xml));
          }
        }
        if (snapshot.definition.radial) {
          for (const name of Object.keys(zip.files).filter(name => /^ppt\/charts\/chart\d+\.xml$/.test(name))) {
            const xml = new DOMParser().parseFromString(await zip.file(name).async('string'), 'application/xml');
            const chartNs = 'http://schemas.openxmlformats.org/drawingml/2006/chart';
            const drawingNs = 'http://schemas.openxmlformats.org/drawingml/2006/main';
            for (const label of xml.getElementsByTagNameNS(chartNs, 'dLbl')) {
              const index = Number(label.getElementsByTagNameNS(chartNs, 'idx')[0]?.getAttribute('val'));
              const slice = snapshot.legend[index];
              if (!slice) continue;
              for (const color of label.getElementsByTagNameNS(drawingNs, 'srgbClr')) color.setAttribute('val', C.foreground(slice.color).slice(1));
            }
            zip.file(name, new XMLSerializer().serializeToString(xml));
          }
        }
        save(await zip.generateAsync({ type: 'blob' }), filename(snapshot, 'pptx'));
      } else await pptx.writeFile({ fileName: filename(snapshot, 'pptx') });
      $('status').textContent = 'PowerPoint downloaded. Select the chart → Edit Data to change its values.';
    } catch (error) {
      $('error').textContent = 'PowerPoint export failed. ' + error.message;
      $('status').textContent = 'Your chart is still available. Try exporting again.';
    }
    finally { exporting = false; buttons(Boolean(current)); }
  });

  try { useTable(D.parseDelimited($('data').value)); } catch (error) { fail(error); }
  document.fonts.ready.then(() => { if (current) draw(current); });
})();
