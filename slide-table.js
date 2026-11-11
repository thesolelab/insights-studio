(function () {
  'use strict';
  const $ = (id) => document.getElementById('table-' + id),
    C = window.ChartColors,
    NS = 'http://www.w3.org/2000/svg';
  let rows = null,
    current = null,
    version = 0,
    widths = [];
  const palette = {
    header: '#8B5CF6',
    headerText: '#080611',
    body: '#FFFFFF',
    alternate: '#F1F5F9',
    text: '#0F172A',
    border: '#CBD5E1',
  };
  function el(tag, attrs = {}, text) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function svgEl(tag, attrs = {}, text) {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function buttons(enabled) {
    for (const key of ['pptx', 'svg', 'png', 'copy']) $(key).disabled = !enabled;
  }
  function stale() {
    version++;
    current = null;
    buttons(false);
    $('preview').replaceChildren();
    $('preview-status').textContent = '';
  }
  function status(text) {
    $('status').textContent = text;
  }
  function options() {
    return { font: Number($('font').value), padding: Number($('padding').value), widths };
  }
  function draw() {
    stale();
    if (!rows) return;
    try {
      const canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');
      const model = window.SlideTable.layout(
        rows,
        { ...options(), allowOverflow: true },
        (text, size, bold) => {
          ctx.font = (bold ? 'bold ' : '') + size + 'px Arial';
          return ctx.measureText(text).width;
        }
      );
      const svg = svgEl('svg', {
        xmlns: NS,
        viewBox: `0 0 ${model.width} ${model.height}`,
        width: model.width,
        height: Math.ceil(model.height),
        role: 'img',
        'aria-label': 'Formatted slide table',
      });
      svg.append(svgEl('title', {}, 'Formatted slide table'));
      let y = 0;
      model.cells.forEach((row, r) => {
        let x = 0;
        row.forEach((lines, c) => {
          const fill =
              r === 0
                ? palette.header
                : $('banded').checked && r % 2 === 0
                  ? palette.alternate
                  : palette.body,
            color = r === 0 ? palette.headerText : palette.text;
          svg.append(
            svgEl('rect', {
              x,
              y,
              width: model.widths[c],
              height: model.heights[r],
              fill,
              stroke: $('borders').checked ? palette.border : fill,
              'stroke-width': 1,
            })
          );
          lines.forEach((line, i) =>
            svg.append(
              svgEl(
                'text',
                {
                  x:
                    $('align').value === 'center'
                      ? x + model.widths[c] / 2
                      : $('align').value === 'right'
                        ? x + model.widths[c] - model.pad
                        : x + model.pad,
                  y: y + model.pad + model.size * (1 + i * 1.25),
                  fill: color,
                  'font-size': model.size,
                  'font-family': 'Arial, sans-serif',
                  'xml:space': 'preserve',
                  'font-weight': r === 0 ? '700' : '400',
                  'text-anchor':
                    $('align').value === 'center'
                      ? 'middle'
                      : $('align').value === 'right'
                        ? 'end'
                        : 'start',
                },
                line
              )
            )
          );
          x += model.widths[c];
        });
        y += model.heights[r];
      });
      $('preview').append(svg);
      current = model.fits
        ? {
            ...model,
            palette: { ...palette },
            align: $('align').value,
            banded: $('banded').checked,
            borders: $('borders').checked,
          }
        : null;
      buttons(model.fits);
      $('preview-status').textContent = model.fits
        ? 'This table fits one slide.'
        : 'The full table is shown below, but it is too tall for one slide. Select Fit to slide, reduce font/padding, or use fewer rows. Exports stay disabled until it fits.';
      status(
        model.fits
          ? `${rows.length - 1} data rows · ${rows[0].length} columns · Ready to copy or export. PowerPoint uses editable text boxes and shapes.`
          : 'Table exceeds one slide. Review the preview and fit controls below.'
      );
    } catch (error) {
      status(error.message);
      $('preview-status').textContent = error.message;
      $('preview').append(el('p', { class: 'note' }, error.message));
    }
  }
  $('fit').addEventListener('click', () => {
    if (!rows) return;
    const ctx = document.createElement('canvas').getContext('2d');
    const measure = (text, size, bold) => {
      ctx.font = (bold ? 'bold ' : '') + size + 'px Arial';
      return ctx.measureText(text).width;
    };
    for (let font = Math.max(10, Math.min(28, Math.floor(Number($('font').value) || 16))); font >= 10; font--) {
      for (
        let padding = Math.max(4, Math.min(20, Math.floor(Number($('padding').value) || 8)));
        padding >= 4;
        padding--
      ) {
        try {
          window.SlideTable.layout(rows, { font, padding, widths }, measure);
          $('font').value = font;
          $('padding').value = padding;
          draw();
          return;
        } catch {
          /* Try a smaller readable layout without altering data. */
        }
      }
    }
    $('preview-status').textContent =
      'This table cannot fit at the minimum 10 pt font and 4 pt padding. Use fewer rows, shorten text, or adjust column widths. Your data is unchanged.';
  });
  function grid() {
    const table = el('table'),
      body = el('tbody');
    rows.forEach((row, r) => {
      const tr = el('tr');
      row.forEach((text, c) => {
        const td = el(r === 0 ? 'th' : 'td');
        const input = el('textarea', {
          'aria-label': `Row ${r + 1}, column ${c + 1}`,
          rows: '1',
          maxlength: '500',
        });
        input.value = text;
        input.addEventListener('paste', (event) => {
          const text = event.clipboardData.getData('text/plain');
          if (!text.includes('\t')) return;
          event.preventDefault();
          try {
            if (text.length > 100000) throw new Error('Paste up to 100,000 characters.');
            const block = window.ChartData.splitDelimited(text);
            if (
              r + block.length > 31 ||
              c + Math.max(...block.map((row) => row.length)) > 10
            )
              throw new Error('The pasted range exceeds 30 data rows or 10 columns.');
            const next = rows.map((row) => [...row]);
            block.forEach((row, y) => {
              if (!next[r + y]) next[r + y] = [];
              row.forEach((value, x) => {
                next[r + y][c + x] = value;
              });
            });
            const normalized = window.SlideTable.normalize(next);
            if (widths.length !== normalized[0].length)
              widths = normalized[0].map(() => 1);
            rows = normalized;
            grid();
            draw();
            $('grid').querySelectorAll('textarea')[r * rows[0].length + c].focus();
          } catch (error) {
            status(error.message);
          }
        });
        input.addEventListener('input', () => {
          rows[r][c] = input.value;
          draw();
        });
        td.append(input);
        tr.append(td);
      });
      body.append(tr);
    });
    table.append(body);
    $('grid').replaceChildren(table);
    $('widths').replaceChildren();
    widths.forEach((weight, c) => {
      const label = el(
        'label',
        { class: 'builder-label' },
        'Column ' + (c + 1) + ' width'
      );
      const input = el('input', {
        type: 'number',
        min: '1',
        max: '10',
        step: '1',
        'aria-label': 'Column ' + (c + 1) + ' width weight',
      });
      input.value = weight;
      input.addEventListener('input', () => {
        widths[c] = Number(input.value);
        draw();
      });
      label.append(input);
      $('widths').append(label);
    });
  }
  $('form').addEventListener('submit', (event) => {
    event.preventDefault();
    stale();
    try {
      if ($('source').value.length > 100000)
        throw new Error('Paste up to 100,000 characters.');
      rows = window.SlideTable.normalize(
        window.ChartData.splitDelimited($('source').value)
      );
      widths = rows[0].map(() => 1);
      grid();
      $('workspace').hidden = false;
      draw();
    } catch (error) {
      rows = null;
      $('workspace').hidden = true;
      status(error.message);
    }
  });
  $('source').addEventListener('input', () => {
    stale();
    rows = null;
    $('workspace').hidden = true;
    status('Source changed. Build the table again.');
  });
  $('settings').addEventListener('input', draw);
  for (const [key, name] of Object.entries({
    header: 'Header background',
    headerText: 'Header text',
    body: 'Cell background',
    alternate: 'Alternate rows',
    text: 'Cell text',
    border: 'Table borders',
  })) {
    $('colors').append(
      C.control(name, palette[key], (color) => {
        palette[key] = color;
        draw();
      }).element
    );
  }
  $('clear').addEventListener('click', () => {
    $('form').reset();
    stale();
    rows = null;
    widths = [];
    $('grid').replaceChildren();
    $('workspace').hidden = true;
    status('Table cleared. Formatting choices are retained.');
    $('source').focus();
  });
  function sourceSVG() {
    return new XMLSerializer().serializeToString($('preview').querySelector('svg'));
  }
  function save(blob, name) {
    const url = URL.createObjectURL(blob),
      a = el('a', { href: url, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function png(svg) {
    const url = URL.createObjectURL(
      new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    );
    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Image export failed. Try SVG.'));
        img.src = url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      return await new Promise((resolve, reject) =>
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed.'))),
          'image/png'
        )
      );
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  $('svg').addEventListener('click', () => {
    if (current)
      save(
        new Blob([sourceSVG()], { type: 'image/svg+xml;charset=utf-8' }),
        'simple-worx-table.svg'
      );
  });
  for (const key of ['png', 'copy'])
    $(key).addEventListener('click', async () => {
      if (!current) return;
      const request = version,
        svg = sourceSVG();
      try {
        const blob = await png(svg);
        if (request !== version) return;
        if (key === 'copy') {
          if (!window.ClipboardItem || !navigator.clipboard?.write)
            throw new Error(
              'Image clipboard unavailable. Use Download PNG and insert it into your slide.'
            );
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          if (request === version)
            status('Table image copied. Paste it into PowerPoint.');
        } else save(blob, 'simple-worx-table.png');
      } catch (error) {
        if (request === version)
          status(
            key === 'copy'
              ? 'Image copying unavailable. Download PNG and insert it into your slide.'
              : error.message
          );
      }
    });
  $('pptx').addEventListener('click', async () => {
    if (!current) return;
    const model = current,
      request = version;
    try {
      await window.ToolLibraries.load('powerpoint');
      if (request !== version) return;
      const pptx = new window.PptxGenJS();
      pptx.layout = 'LAYOUT_WIDE';
      pptx.author = 'Simple Worx';
      pptx.title = 'Slide-ready table';
      const slide = pptx.addSlide();
      const inches = (pixels) => pixels / (model.scale * 72);
      let y = 0.6;
      model.cells.forEach((row, r) => {
        let x = 0.6;
        row.forEach((lines, c) => {
          const fill =
            r === 0
              ? model.palette.header
              : model.banded && r % 2 === 0
                ? model.palette.alternate
                : model.palette.body;
          slide.addShape(pptx.ShapeType.rect, {
            x,
            y,
            w: inches(model.widths[c]),
            h: inches(model.heights[r]),
            fill: { color: fill.slice(1) },
            line: {
              color: (model.borders ? model.palette.border : fill).slice(1),
              width: model.borders ? 0.5 : 0,
            },
          });
          slide.addText(lines.join('\n'), {
            x: x + model.padding / 72,
            y: y + model.padding / 72,
            w: inches(model.widths[c]) - model.padding / 36,
            h: inches(model.heights[r]) - model.padding / 36,
            fontFace: 'Arial',
            fontSize: model.font,
            bold: r === 0,
            color: (r === 0 ? model.palette.headerText : model.palette.text).slice(1),
            margin: 0,
            align: model.align,
            valign: 'top',
            breakLine: false,
            lineSpacingMultiple: 1.25,
            paraSpaceAfter: 0,
          });
          x += inches(model.widths[c]);
        });
        y += inches(model.heights[r]);
      });
      const blob = await pptx.write({ outputType: 'blob' });
      if (request !== version) return;
      save(blob, 'simple-worx-table.pptx');
      status(
        'Editable PowerPoint downloaded. Cells are separate editable text boxes and shapes.'
      );
    } catch (error) {
      if (request === version) status(error.message);
    }
  });
  buttons(false);
})();
