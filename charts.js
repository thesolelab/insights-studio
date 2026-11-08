(function () {
  'use strict';
  const $ = id => document.getElementById('builder-' + id);
  const D = window.ChartData;
  const NS = 'http://www.w3.org/2000/svg';
  let table = null, workbook = null, revision = 0, current = null, exporting = false;
  const libraries = new Map();

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
  function palette() { return ['--chart-variant', '--chart-control', '--text', '--accent-hover', '--text-muted', '--chart-control'].map(token); }
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
    invalidate('Update the data or settings to create a chart.');
  }
  function option(select, value, label) { select.appendChild(el('option', { value }, label)); }

  function seriesControls() {
    $('series').replaceChildren();
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
      row.append(include, typeLabel, axisLabel);
      $('series').appendChild(row);
    });
    for (const [side, position] of [['left', 0], ['right', 1]]) {
      const index = columns[position];
      $(side + '-title').value = index === undefined ? '' : table.headers[index];
      $(side + '-format').value = index !== undefined && table.rows.some(row => row[index].endsWith('%')) ? 'percent' : 'number';
    }
  }

  function useTable(next) {
    table = next;
    $('category').replaceChildren();
    table.headers.forEach((header, index) => option($('category'), index, header));
    $('settings').hidden = false;
    seriesControls();
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
    const series = selected.map((row, index) => {
      const column = Number(row.dataset.column);
      const values = table.rows.map((data, i) => {
        const number = D.numberCell(data[column]);
        if (number === null) throw new Error(`Enter a numeric value for ${table.headers[column]} in row ${i + 2}. Blank values are not treated as zero.`);
        return number;
      });
      return { name: table.headers[column], values, type: row.querySelector('.series-type').value,
        axis: $('dual').checked ? row.querySelector('.series-axis').value : 'left', color: colors[index] };
    });
    if (!series.some(item => item.axis === 'left')) throw new Error('Keep at least one selected series on the left axis.');
    const axes = {};
    for (const side of ['left', 'right']) {
      const values = series.filter(item => item.axis === side).flatMap(item => item.values);
      if (values.length) axes[side] = { ...D.axisScale(values), title: $(side + '-title').value.trim(), format: $(side + '-format').value };
    }
    return { title: $('title').value.trim() || 'Untitled chart', category: table.headers[category], labels, series, axes };
  }

  function format(number, mode) {
    return new Intl.NumberFormat('en-US', mode === 'percent'
      ? { style: 'percent', maximumFractionDigits: 2 }
      : { maximumFractionDigits: 4, notation: Math.abs(number) >= 1e6 ? 'compact' : 'standard' }).format(number);
  }

  function draw(c) {
    const svg = $('chart'), chart = document.createDocumentFragment();
    const text = token('--text'), muted = token('--text-muted'), font = token('--font-body');
    const left = 110, right = 990, top = 95, bottom = 460;
    const x = i => left + (i + 0.5) * (right - left) / c.labels.length;
    const y = (value, axis) => bottom - (value - axis.min) / (axis.max - axis.min) * (bottom - top);
    const label = (value, attrs) => chart.appendChild(svgNode('text', {
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
      label(axis.title, { x: side === 'left' ? left : right, y: 76, 'text-anchor': side === 'left' ? 'start' : 'end', fill: text });
    }
    const skip = Math.max(1, Math.ceil(c.labels.length / 10));
    c.labels.forEach((value, index) => {
      if (index % skip === 0 || index === c.labels.length - 1) label(value.length > 16 ? value.slice(0, 15) + '…' : value,
        { x: x(index), y: bottom + 26, 'text-anchor': 'middle' });
    });
    label(c.category, { x: (left + right) / 2, y: 517, 'text-anchor': 'middle' });
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
      const lx = 65 + (seriesIndex % 3) * 345, ly = 559 + Math.floor(seriesIndex / 3) * 29;
      chart.appendChild(svgNode('rect', { x: lx, y: ly - 10, width: 10, height: 10, fill: series.color }));
      const name = series.name.length > 26 ? series.name.slice(0, 25) + '…' : series.name;
      label(`${name} · ${series.axis}`, { x: lx + 19, y: ly });
    });
    svg.setAttribute('aria-label', c.title + '. ' + c.series.map(s => s.name + ' on the ' + s.axis + ' axis').join(', '));
    svg.replaceChildren(chart);
  }

  function render() {
    try {
      const next = config();
      draw(next);
      current = next;
      $('preview').hidden = false;
      $('error').textContent = '';
      $('status').textContent = `${next.labels.length} categories · ${next.series.length} series${next.axes.right ? ' · Independent left and right scales' : ''}`;
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
    $('data').value = rows.map(row => row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(',')).join('\n');
  }

  $('form').addEventListener('submit', event => {
    event.preventDefault(); revision++; table = null;
    try { useTable(D.parseDelimited($('data').value)); } catch (error) { fail(error); }
  });
  $('data').addEventListener('input', () => {
    revision++; workbook = null; table = null; $('sheet-label').hidden = true;
    $('error').textContent = '';
    $('import-status').textContent = '';
    invalidate('Data changed. Select Create chart to update the preview.');
  });
  $('file').addEventListener('change', async () => {
    const file = $('file').files[0];
    if (!file) return;
    const request = ++revision;
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
  $('settings').addEventListener('input', event => {
    if (!table || event.target === $('category')) return;
    if (event.target === $('dual')) {
      for (const select of $('series').querySelectorAll('.series-axis')) select.disabled = !$('dual').checked;
    }
    render();
  });

  function serializedChart() {
    const copy = $('chart').cloneNode(true);
    copy.setAttribute('width', '2200'); copy.setAttribute('height', '1240');
    copy.setAttribute('xmlns', NS);
    return new XMLSerializer().serializeToString(copy);
  }
  function save(blob, name) {
    const url = URL.createObjectURL(blob), anchor = el('a', { href: url, download: name });
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function filename(c, extension) { return (c.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 70) || 'insights-chart') + '.' + extension; }
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
        const canvas = document.createElement('canvas'); canvas.width = 2200; canvas.height = 1240;
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
            barDir: 'col', grouping: 'clustered', showMarker: type === 'line', markerSize: 4, lineSize: 2 } });
      }
    }
    const axisOptions = axis => ({ valAxisTitle: axis.title, showValAxisTitle: Boolean(axis.title),
      valAxisMinVal: axis.min, valAxisMaxVal: axis.max, valAxisMajorUnit: axis.step,
      valAxisLabelFormatCode: axis.format === 'percent' ? '0.##%' : '#,##0.####', valAxisLabelColor: muted, valAxisTitleColor: text });
    const axes = [axisOptions(c.axes.left)];
    if (c.axes.right) axes.push({ ...axisOptions(c.axes.right), valGridLine: { style: 'none' } });
    slide.background = { color: officeColor(token('--bg')) };
    slide.addText(c.title, { x: 0.6, y: 0.3, w: 12.1, h: 0.55, fontFace: 'Arial', fontSize: 26, bold: true, color: text, margin: 0 });
    slide.addChart(groups, {
      x: 0.6, y: 1.05, w: 12.1, h: 5.7, showTitle: false, showLegend: true, legendPos: 'b',
      legendColor: text, legendFontSize: 11, fontFace: 'Arial', fontSize: 11,
      chartArea: { fill: { color: background }, border: { color: background, pt: 0 } },
      plotArea: { fill: { color: background }, border: { color: background, pt: 0 } },
      catAxisLabelColor: muted, catAxisTitleColor: text, catAxisTitle: c.category, showCatAxisTitle: true,
      catAxisLabelFontSize: 10, valAxisLabelFontSize: 10, valAxisTitleFontSize: 12,
      catAxisLineColor: muted, valAxisLineColor: muted, catAxisLineShow: true, valAxisLineShow: true,
      catAxisLabelFrequency: Math.max(1, Math.ceil(c.labels.length / 10)).toString(),
      valGridLine: { color: officeColor(token('--border')), width: 0.5 }, catGridLine: { style: 'none' },
      barDir: 'col', showValue: false, showBorder: false,
      valAxes: axes, catAxes: c.axes.right ? [{}, { catAxisHidden: true, showCatAxisTitle: false, catAxisTitle: '' }] : [{}]
    });
  }

  $('pptx').addEventListener('click', async () => {
    if (!current || exporting) return;
    const snapshot = current;
    exporting = true; buttons(true); $('status').textContent = 'Preparing editable PowerPoint…';
    try {
      await library('powerpoint');
      const pptx = new window.PptxGenJS();
      pptx.layout = 'LAYOUT_WIDE'; pptx.author = 'Insights Studio'; pptx.subject = 'Editable chart and source data'; pptx.title = snapshot.title;
      addNativeChart(pptx, pptx.addSlide(), snapshot);
      await pptx.writeFile({ fileName: filename(snapshot, 'pptx') });
      $('status').textContent = 'PowerPoint downloaded. Select the chart → Edit Data to change its values.';
    } catch (error) {
      $('error').textContent = 'PowerPoint export failed. ' + error.message;
      $('status').textContent = 'Your chart is still available. Try exporting again.';
    }
    finally { exporting = false; buttons(Boolean(current)); }
  });

  try { useTable(D.parseDelimited($('data').value)); } catch (error) { fail(error); }
})();
