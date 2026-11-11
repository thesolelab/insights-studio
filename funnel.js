(function () {
  'use strict';
  const $ = (id) => document.getElementById('funnel-' + id),
    M = window.FunnelMath,
    C = window.ChartColors,
    NS = 'http://www.w3.org/2000/svg';
  let current = null,
    drawing = null,
    version = 0;
  const colors = {
    bar: '#8B5CF6',
    highlight: '#2DD4BF',
    background: '#101B30',
    text: '#F4F6FC',
  };
  function el(tag, attrs = {}, text) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function svgEl(tag, attrs, text) {
    const node = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function status(text, error = false) {
    $('status').textContent = text;
    $('status').setAttribute('role', error ? 'alert' : 'status');
  }
  function invalidate() {
    version++;
    current = null;
    drawing = null;
    $('result').hidden = true;
    $('chart').replaceChildren();
    $('recap').value = '';
    status('Inputs changed. Calculate again to refresh the results.');
  }
  function mode() {
    const adopt = $('mode').value === 'adoption';
    $('steps-fields').hidden = adopt;
    $('adoption-fields').hidden = !adopt;
    $('calculate').textContent = adopt ? 'Compare adoption' : 'Calculate funnel';
  }
  $('mode').addEventListener('change', () => {
    mode();
    invalidate();
  });
  $('form').addEventListener('input', invalidate);
  function wrap(text, max, font, bold) {
    const context = document.createElement('canvas').getContext('2d');
    context.font = (bold ? 'bold ' : '') + font + 'px Arial';
    const lines = [];
    let line = '';
    for (const char of text) {
      while (line && context.measureText(line + char).width > max) {
        const split = line.lastIndexOf(' ');
        if (split > 0) {
          lines.push(line.slice(0, split));
          line = line.slice(split + 1);
        } else {
          lines.push(line);
          line = '';
        }
      }
      line += char;
    }
    lines.push(line);
    return lines;
  }
  function draw() {
    version++;
    const items = [],
      rect = (x, y, w, h, fill, opacity = 1) =>
        items.push({ kind: 'rect', x, y, w, h, fill, opacity }),
      text = (
        value,
        x,
        y,
        size = 24,
        align = 'left',
        bold = false,
        opacity = 1,
        w = 1120
      ) => items.push({ kind: 'text', value, x, y, size, align, bold, opacity, w });
    const title =
        $('title').value.trim() ||
        (current.mode === 'funnel' ? 'Funnel overview' : 'Feature adoption comparison'),
      titleLines = wrap(title, 1120, 30, true);
    titleLines.forEach((line, i) => text(line, 40, 42 + i * 34, 30, 'left', true));
    const header = titleLines.length * 34 + 64;
    text(
      current.mode === 'funnel'
        ? 'Bar widths show the share of the first step.'
        : 'Bar widths show the share of eligible users in each period.',
      40,
      header - 15,
      18
    );
    let y = header;
    current.visual.forEach((item, i) => {
      const labelLines = wrap(item.label, 350, 24, true),
        detailLines = wrap(item.detail, 350, 16, false);
      const detailStart = Math.max(78, labelLines.length * 27 + 28),
        rowHeight = Math.max(104, detailStart + (detailLines.length - 1) * 19 + 26);
      labelLines.forEach((line, j) =>
        text(line, 40, y + 26 + j * 27, 24, 'left', true, 1, 350)
      );
      detailLines.forEach((line, j) =>
        text(line, 40, y + detailStart + j * 19, 16, 'left', false, 1, 350)
      );
      text(item.value, 1160, y + 24, 22, 'right', true, 1, 700);
      rect(440, y + 38, 700, 26, colors.text, 0.08);
      const width = 700 * item.share;
      if (width > 0)
        rect(
          440 + (current.mode === 'funnel' ? (700 - width) / 2 : 0),
          y + 38,
          width,
          26,
          i === current.visual.length - 1 ? colors.highlight : colors.bar
        );
      if (item.loss)
        text(item.loss, 1160, y + rowHeight - 21, 16, 'right', false, 0.8, 700);
      y += rowHeight;
    });
    const height = y + 12,
      svg = svgEl('svg', {
        xmlns: NS,
        viewBox: `0 0 1200 ${height}`,
        width: 1200,
        height,
        role: 'img',
        'aria-label': title,
      });
    svg.append(svgEl('title', {}, title));
    svg.append(svgEl('rect', { width: 1200, height, fill: colors.background }));
    for (const item of items)
      if (item.kind === 'rect')
        svg.append(
          svgEl('rect', {
            x: item.x,
            y: item.y,
            width: item.w,
            height: item.h,
            fill: item.fill,
            'fill-opacity': item.opacity,
            rx: 3,
          })
        );
      else
        svg.append(
          svgEl(
            'text',
            {
              x: item.x,
              y: item.y,
              fill: colors.text,
              'fill-opacity': item.opacity,
              'font-family': 'Arial, sans-serif',
              'font-size': item.size,
              'font-weight': item.bold ? 700 : 400,
              'text-anchor': item.align === 'right' ? 'end' : 'start',
            },
            item.value
          )
        );
    $('chart').replaceChildren(svg);
    drawing = { title, height, items, colors: { ...colors } };
  }
  function metrics(values) {
    $('metrics').replaceChildren();
    for (const [label, value] of values) {
      const tile = el('div', { class: 'funnel-metric' });
      tile.append(el('span', {}, label), el('strong', {}, value));
      $('metrics').append(tile);
    }
  }
  function table() {
    const node = el('table'),
      head = el('thead'),
      body = el('tbody'),
      row = el('tr');
    const headers =
      current.mode === 'funnel'
        ? ['Step', 'Users', 'From previous', 'Overall', 'Users lost', 'Drop-off']
        : ['Period', 'Eligible users', 'Adopted users', 'Adoption'];
    for (const name of headers) row.append(el('th', { scope: 'col' }, name));
    head.append(row);
    const values =
      current.mode === 'funnel'
        ? current.steps.map((s) => [
            s.label,
            M.number(s.count),
            M.percent(s.conversion),
            M.percent(s.overall),
            s.lost === null ? '—' : M.number(s.lost),
            M.percent(s.dropoff),
          ])
        : [current.a, current.b].map((p) => [
            p.label,
            M.number(p.eligible),
            M.number(p.adopted),
            M.percent(p.rate),
          ]);
    for (const valuesRow of values) {
      const row = el('tr');
      for (const value of valuesRow) row.append(el('td', {}, value));
      body.append(row);
    }
    node.append(head, body);
    $('table').replaceChildren(node);
  }
  $('form').addEventListener('submit', (event) => {
    event.preventDefault();
    invalidate();
    try {
      if ($('mode').value === 'funnel') {
        if ($('steps').value.length > 20000)
          throw new Error('Paste up to 20,000 characters.');
        current = M.funnel(window.ChartData.splitDelimited($('steps').value));
        metrics([
          ['Starting users', M.number(current.steps[0].count)],
          ['Completed users', M.number(current.steps[current.steps.length - 1].count)],
          ['Overall conversion', M.percent(current.overall)],
          [
            'Largest numerical drop',
            current.largest.length
              ? M.number(current.largest[0].lost) +
                (current.largest.length > 1 ? ' (tied)' : '')
              : '0',
          ],
        ]);
      } else {
        const values = {};
        for (const key of [
          'eligibleA',
          'adoptedA',
          'eligibleB',
          'adoptedB',
          'labelA',
          'labelB',
        ])
          values[key] = $(key).value;
        current = M.adoption(values);
        metrics([
          [current.a.label + ' adoption', M.percent(current.a.rate)],
          [current.b.label + ' adoption', M.percent(current.b.rate)],
          ['Percentage-point change', M.signed(current.pp, ' pp')],
          [
            'Relative change',
            current.relative === null
              ? 'N/A (0% baseline)'
              : M.signed(current.relative * 100, '%'),
          ],
        ]);
      }
      table();
      $('recap').value = current.recap;
      draw();
      $('result').hidden = false;
      status(
        'Results ready. Review your counts and definitions before copying or exporting.'
      );
    } catch (error) {
      current = null;
      drawing = null;
      status(error.message, true);
    }
  });
  $('example').addEventListener('click', () => {
    if ($('mode').value === 'funnel')
      $('steps').value =
        'Step\tUsers\nVisited the page\t12000\nOpened the feature\t4800\nCompleted the action\t1920';
    else
      for (const [key, value] of Object.entries({
        labelA: 'Previous period',
        labelB: 'Current period',
        eligibleA: '1000',
        adoptedA: '240',
        eligibleB: '1000',
        adoptedB: '300',
      }))
        $(key).value = value;
    $('form').requestSubmit();
  });
  $('clear').addEventListener('click', () => {
    $('form').reset();
    mode();
    invalidate();
    $('metrics').replaceChildren();
    $('table').replaceChildren();
    status('Inputs and results cleared. Chart colors are retained.');
    $('steps').focus();
  });
  for (const [key, label] of Object.entries({
    bar: 'Starting / period A color',
    highlight: 'Final / period B color',
    background: 'Visual background',
    text: 'Visual text',
  }))
    $('colors').append(
      C.control(label, colors[key], (color) => {
        colors[key] = color;
        if (current) draw();
      }).element
    );
  $('copy').addEventListener('click', async () => {
    if (!current) return;
    const request = version,
      text = $('recap').value;
    try {
      await navigator.clipboard.writeText(text);
      if (request === version) status('Recap copied.');
    } catch {
      if (request !== version) return;
      $('recap').focus();
      $('recap').select();
      status('Copy unavailable. Copy the selected recap manually.');
    }
  });
  function save(blob, name) {
    const url = URL.createObjectURL(blob),
      a = el('a', { href: url, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const filename = (extension) =>
    'simple-worx-' +
    (current.mode === 'funnel' ? 'funnel' : 'adoption') +
    '.' +
    extension;
  function svgText() {
    return new XMLSerializer().serializeToString($('chart').querySelector('svg'));
  }
  $('svg').addEventListener('click', () => {
    if (drawing)
      save(
        new Blob([svgText()], { type: 'image/svg+xml;charset=utf-8' }),
        filename('svg')
      );
  });
  async function png(source) {
    const url = URL.createObjectURL(
      new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    );
    try {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error('Visual export failed. Try SVG.'));
        image.src = url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      canvas.getContext('2d').drawImage(image, 0, 0);
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
  for (const key of ['png', 'image'])
    $(key).addEventListener('click', async () => {
      if (!drawing) return;
      const request = version,
        source = svgText(),
        name = filename('png');
      try {
        const blob = await png(source);
        if (request !== version) return;
        if (key === 'png') save(blob, name);
        else {
          if (!window.ClipboardItem || !navigator.clipboard?.write)
            throw new Error('Image clipboard unavailable.');
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          if (request === version) status('Visual copied. Paste it into your slide.');
        }
      } catch (error) {
        if (request === version)
          status(
            key === 'image'
              ? 'Image copying unavailable. Download PNG and insert it into your slide.'
              : error.message
          );
      }
    });
  $('pptx').addEventListener('click', async () => {
    if (!drawing) return;
    const snapshot = drawing,
      request = version,
      name = filename('pptx');
    try {
      await window.ToolLibraries.load('powerpoint');
      if (request !== version) return;
      const pptx = new window.PptxGenJS();
      pptx.layout = 'LAYOUT_WIDE';
      pptx.author = 'Simple Worx';
      pptx.title = snapshot.title;
      const slide = pptx.addSlide(),
        scale = Math.min(12.133333333 / 1200, 6.3 / snapshot.height),
        offsetX = (13.333333333 - 1200 * scale) / 2,
        offsetY = (7.5 - snapshot.height * scale) / 2;
      slide.background = { color: snapshot.colors.background.slice(1) };
      for (const item of snapshot.items)
        if (item.kind === 'rect')
          slide.addShape(pptx.ShapeType.rect, {
            x: offsetX + item.x * scale,
            y: offsetY + item.y * scale,
            w: item.w * scale,
            h: item.h * scale,
            fill: { color: item.fill.slice(1), transparency: (1 - item.opacity) * 100 },
            line: { transparency: 100 },
          });
        else {
          const x = item.align === 'right' ? item.x - item.w : item.x;
          slide.addText(item.value, {
            x: offsetX + x * scale,
            y: offsetY + (item.y - item.size * 0.95) * scale,
            w: item.w * scale,
            h: item.size * 1.4 * scale,
            fontFace: 'Arial',
            fontSize: item.size * scale * 72,
            bold: item.bold,
            color: snapshot.colors.text.slice(1),
            transparency: (1 - item.opacity) * 100,
            margin: 0,
            align: item.align,
            valign: 'top',
            breakLine: false,
            paraSpaceAfter: 0,
          });
        }
      const blob = await pptx.write({ outputType: 'blob' });
      if (request === version) {
        save(blob, name);
        status(
          'PowerPoint downloaded. Text and bars are editable shapes; values do not recalculate inside PowerPoint.'
        );
      }
    } catch (error) {
      if (request === version) status(error.message);
    }
  });
  mode();
})();
