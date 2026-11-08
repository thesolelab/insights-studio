(function (root) {
  'use strict';
  const D = typeof module === 'object' && module.exports ? require('./chart-data.js') : root.ChartData;
  const MODES = [
    ['combo', 'Combination · column + line', 'Combination', 'combo'],
    ['column', 'Grouped columns', 'Columns & bars', 'bar'],
    ['stacked-column', 'Stacked columns', 'Columns & bars', 'bar'],
    ['percent-column', '100% stacked columns', 'Columns & bars', 'bar'],
    ['horizontal-bar', 'Horizontal bars', 'Columns & bars', 'bar'],
    ['stacked-bar', 'Stacked horizontal bars', 'Columns & bars', 'bar'],
    ['percent-bar', '100% stacked horizontal bars', 'Columns & bars', 'bar'],
    ['line', 'Line', 'Lines & areas', 'line'],
    ['line-markers', 'Line with markers', 'Lines & areas', 'line'],
    ['smooth-line', 'Smooth line', 'Lines & areas', 'line'],
    ['area', 'Area', 'Lines & areas', 'area'],
    ['stacked-area', 'Stacked area', 'Lines & areas', 'area'],
    ['percent-area', '100% stacked area', 'Lines & areas', 'area'],
    ['scatter', 'Scatter · points', 'Relationships', 'scatter'],
    ['scatter-lines', 'Scatter · lines + points', 'Relationships', 'scatter'],
    ['bubble', 'Bubble', 'Relationships', 'bubble'],
    ['pie', 'Pie', 'Composition', 'pie'],
    ['doughnut', 'Doughnut', 'Composition', 'doughnut'],
    ['radar', 'Radar', 'Radar', 'radar'],
    ['radar-markers', 'Radar with markers', 'Radar', 'radar'],
    ['radar-filled', 'Filled radar', 'Radar', 'radar']
  ].map(([id, name, family, native]) => ({ id, name, family, native,
    xy: native === 'scatter' || native === 'bubble',
    radial: native === 'pie' || native === 'doughnut',
    horizontal: id.includes('bar') && native === 'bar',
    percent: id.startsWith('percent-'),
    stacked: id.startsWith('stacked-') || id.startsWith('percent-') }));

  function definition(id) {
    const mode = MODES.find(mode => mode.id === id);
    if (!mode) throw new Error('Choose a supported chart style.');
    return mode;
  }

  function stack(series, percent) {
    const positive = series[0].values.map(() => 0), negative = positive.slice();
    const totals = positive.map((_, i) => series.reduce((sum, s) => sum + s.values[i], 0));
    return series.map(s => s.values.map((raw, i) => {
      const value = percent ? (totals[i] ? raw / totals[i] : 0) : raw;
      const running = value < 0 ? negative : positive;
      const low = running[i]; running[i] += value;
      return { low, high: running[i], raw };
    }));
  }

  function prepare(base, id, settings = {}) {
    const mode = definition(id), c = { ...base, mode: id, definition: mode, valueFormat: base.valueFormat || base.axes.left?.format || 'number' };
    c.legend = c.series.map(s => ({ name: s.name, color: s.color }));
    if (id === 'combo') return c;
    const values = c.series.flatMap(s => s.values);
    if ((mode.percent || (mode.native === 'area' && mode.stacked) || mode.radial || mode.native === 'radar') && values.some(v => v < 0)) {
      throw new Error('This chart style requires non-negative values. Use a line or grouped bar chart for negative values.');
    }
    if (mode.radial) {
      if (c.series.length !== 1) throw new Error('Select one numeric series for a pie or doughnut chart.');
      if (c.labels.length > 12) throw new Error('Use at most 12 categories for pie and doughnut charts.');
      if (!values.some(v => v > 0)) throw new Error('A pie or doughnut chart needs at least one positive value.');
      c.axes = {};
      c.legend = c.labels.map((name, i) => ({ name, color: settings.colors[i % settings.colors.length] }));
    } else {
      c.axes = { left: { ...D.axisScale(values), format: base.axes.left.format } };
    }
    if (mode.stacked) {
      c.segments = stack(c.series, mode.percent);
      c.axes.left = { ...D.axisScale(c.segments.flatMap(s => s.flatMap(p => [p.low, p.high]))), format: mode.percent ? 'percent' : base.axes.left.format };
      if (mode.percent) c.axes.left = { min: 0, max: 1, step: 0.2, format: 'percent' };
    }
    if (mode.native === 'radar' && (c.labels.length < 3 || c.labels.length > 12)) throw new Error('Radar charts need 3–12 categories.');
    if (mode.xy) {
      c.xValues = settings.xValues.map(D.numberCell);
      if (c.xValues.some(value => value === null)) throw new Error('Scatter and bubble charts need a numeric X column. Choose one above, or load an example.');
      c.xAxis = { ...D.axisScale(c.xValues), format: settings.xPercent ? 'percent' : 'number' };
      if (id === 'bubble') {
        c.sizes = settings.sizes.map(D.numberCell);
        if (c.sizes.some(v => v === null || v < 0) || !c.sizes.some(v => v > 0)) throw new Error('Choose a bubble-size column with non-negative numbers and at least one positive size. Bubble charts need X, Y, and size columns.');
        const paddedScale = values => {
          const min = Math.min(...values), max = Math.max(...values);
          const padding = Math.max(max - min, Math.abs(max) || 1) * 0.12;
          return D.axisScale([min - padding, max + padding]);
        };
        c.xAxis = { ...c.xAxis, ...paddedScale(c.xValues) };
        c.axes.left = { ...c.axes.left, ...paddedScale(values) };
      }
    }
    return c;
  }

  function nativeSpec(c, color) {
    const m = c.definition;
    let data = c.series.map(s => ({ name: s.name, labels: c.labels, values: s.values }));
    if (m.xy) data = [{ name: c.category, values: c.xValues }, ...c.series.map(s => ({ name: s.name, values: s.values, ...(c.mode === 'bubble' ? { sizes: c.sizes } : {}) }))];
    const options = { chartColors: (m.radial ? c.legend : c.series).map(s => color(s.color)),
      barDir: m.horizontal ? 'bar' : 'col',
      barGrouping: m.percent ? 'percentStacked' : m.stacked ? 'stacked' : m.native === 'bar' ? 'clustered' : 'standard',
      barOverlapPct: m.stacked ? 100 : 0,
      lineSize: c.mode === 'scatter' ? 0 : 2,
      lineDataSymbol: ['line-markers', 'scatter', 'scatter-lines', 'radar-markers'].includes(c.mode) ? 'circle' : 'none',
      lineDataSymbolSize: 5, lineSmooth: c.mode === 'smooth-line',
      radarStyle: c.mode === 'radar-filled' ? 'filled' : c.mode === 'radar-markers' ? 'marker' : 'standard',
      holeSize: 58, showPercent: m.radial, showValue: false,
      chartColorsOpacity: m.native === 'area' || c.mode === 'radar-filled' ? 40 : 100 };
    if (m.xy) Object.assign(options, { catAxisMinVal: c.xAxis.min, catAxisMaxVal: c.xAxis.max, catAxisMajorUnit: c.xAxis.step });
    return { type: m.native, data, options };
  }

  function example(id) {
    const mode = definition(id);
    if (mode.xy) return [['Spend', 'Sales', 'Audience size'], ['10', '25', '8'], ['20', '42', '15'], ['35', '35', '11'], ['45', '65', '25'], ['60', '78', '18']];
    if (mode.native === 'radar') return [['Metric', 'Team A', 'Team B'], ['Quality', '8', '6'], ['Speed', '6', '9'], ['Reach', '9', '7'], ['Value', '7', '8'], ['Support', '8', '7']];
    if (mode.radial) return [['Channel', 'Revenue'], ['Search', '42000'], ['Social', '28000'], ['Email', '18000'], ['Direct', '12000']];
    if (id === 'combo') return [['Month', 'Revenue', 'Conversion rate'], ['Jan', '24000', '2.4%'], ['Feb', '28500', '2.7%'], ['Mar', '27000', '2.5%'], ['Apr', '34000', '3.1%'], ['May', '38000', '3.4%'], ['Jun', '42500', '3.8%']];
    return [['Quarter', 'Product A', 'Product B', 'Product C'], ['Q1', '120', '85', '60'], ['Q2', '145', '95', '75'], ['Q3', '130', '120', '85'], ['Q4', '180', '135', '110']];
  }

  function randomStartup(random = Math.random) {
    const mode = MODES[Math.floor(random() * MODES.length)];
    const rows = example(mode.id);
    let x = 0;
    for (const row of rows.slice(1)) {
      for (let column = 0; column < row.length; column++) {
        if (mode.xy && column === 0) {
          x += 5 + Math.floor(random() * 21);
          row[column] = String(x);
        } else if (column > 0) {
          const value = D.numberCell(row[column]);
          if (row[column].endsWith('%')) row[column] = (1 + random() * 7).toFixed(2) + '%';
          else if (mode.native === 'radar') row[column] = String(1 + Math.floor(random() * 10));
          else row[column] = String(Math.max(1, Math.round(value * (0.55 + random() * 0.9))));
        }
      }
    }
    return { id: mode.id, title: mode.name + ' sample', rows };
  }

  function render(c, svg, token) {
    const NS = 'http://www.w3.org/2000/svg', chart = document.createDocumentFragment();
    const node = (tag, attrs = {}, text) => {
      const el = document.createElementNS(NS, tag);
      for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
      if (text !== undefined) el.textContent = text;
      return el;
    };
    const text = token('--text'), muted = token('--text-muted'), font = token('--font-body');
    const label = (value, attrs, parent = chart) => parent.appendChild(node('text', { fill: muted, 'font-family': font, 'font-size': 14, 'font-weight': 600, ...attrs }, value));
    const fmt = (v, mode = 'number') => new Intl.NumberFormat('en-US', mode === 'percent' ? { style: 'percent', maximumFractionDigits: 2 } : { maximumFractionDigits: 4, notation: Math.abs(v) >= 1e6 ? 'compact' : 'standard' }).format(v);
    const short = (s, n = 18) => s.length > n ? s.slice(0, n - 1) + '…' : s;
    const tip = (shape, value) => { shape.appendChild(node('title', {}, value)); chart.appendChild(shape); };
    const m = c.definition, L = 110, R = 990, T = 95, B = 460;
    const axis = c.axes.left;
    const scale = (v, a, start, end) => start + (v - a.min) / (a.max - a.min) * (end - start);
    const x = i => L + (i + 0.5) * (R - L) / c.labels.length;
    const y = v => scale(v, axis, B, T);
    chart.appendChild(node('title', {}, c.title));
    chart.appendChild(node('desc', {}, m.name + '. ' + c.series.map(s => s.name).join(', ')));
    const background = node('rect', { width: 1100, height: 620, fill: token('--surface-inset') });
    chart.appendChild(background);
    label(c.title, { x: 45, y: 42, fill: text, 'font-size': 25, 'font-weight': 700 });

    if (m.radial) {
      const values = c.series[0].values, total = values.reduce((a, b) => a + b, 0), cx = 550, cy = 285, radius = 175;
      let angle = -Math.PI / 2;
      values.forEach((value, i) => {
        if (!value) return;
        const span = value / total * Math.PI * 2, end = angle + Math.min(span, Math.PI * 2 - 1e-7);
        const point = (r, a) => `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
        const inner = m.native === 'doughnut' ? radius * 0.58 : 0, large = span > Math.PI ? 1 : 0;
        let d = `M ${point(radius, angle)} A ${radius} ${radius} 0 ${large} 1 ${point(radius, end)}`;
        d += inner ? ` L ${point(inner, end)} A ${inner} ${inner} 0 ${large} 0 ${point(inner, angle)} Z` : ` L ${cx} ${cy} Z`;
        const color = c.legend[i].color;
        tip(node('path', { d, fill: color, stroke: token('--surface-inset'), 'stroke-width': 2 }), `${c.labels[i]}: ${fmt(value)} (${fmt(value / total, 'percent')})`);
        if (span > 0.3) {
          const a = angle + span / 2, r = radius * (inner ? 0.79 : 0.65);
          label(fmt(value / total, 'percent'), { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) + 5, 'text-anchor': 'middle', fill: root.ChartColors ? root.ChartColors.foreground(color) : text });
        }
        angle += span;
      });
    } else if (m.native === 'radar') {
      const cx = 550, cy = 280, radius = 155;
      const point = (i, r) => [cx + r * Math.cos(i / c.labels.length * Math.PI * 2 - Math.PI / 2), cy + r * Math.sin(i / c.labels.length * Math.PI * 2 - Math.PI / 2)];
      for (let tick = 1; tick <= 5; tick++) {
        chart.appendChild(node('polygon', { points: c.labels.map((_, i) => point(i, radius * tick / 5).join(',')).join(' '), fill: 'none', stroke: text, 'stroke-opacity': 0.12 }));
        label(fmt(axis.max * tick / 5, axis.format), { x: cx + 8, y: cy - radius * tick / 5 });
      }
      c.labels.forEach((name, i) => {
        const p = point(i, radius), q = point(i, radius + 24);
        chart.appendChild(node('line', { x1: cx, y1: cy, x2: p[0], y2: p[1], stroke: text, 'stroke-opacity': 0.12 }));
        label(short(name), { x: q[0], y: q[1] + 5, 'text-anchor': q[0] < cx - 5 ? 'end' : q[0] > cx + 5 ? 'start' : 'middle' });
      });
      c.series.forEach(s => {
        const points = s.values.map((v, i) => point(i, v / axis.max * radius));
        tip(node('polygon', { points: points.map(p => p.join(',')).join(' '), fill: c.mode === 'radar-filled' ? s.color : 'none', 'fill-opacity': 0.25, stroke: s.color, 'stroke-width': 2 }), s.name);
        if (c.mode === 'radar-markers') points.forEach((p, i) => tip(node('circle', { cx: p[0], cy: p[1], r: 4, fill: s.color }), `${c.labels[i]} · ${s.name}: ${fmt(s.values[i], axis.format)}`));
      });
    } else {
      const horizontal = m.horizontal;
      for (let i = 0; i <= Math.round((axis.max - axis.min) / axis.step); i++) {
        const value = axis.min + i * axis.step, pos = horizontal ? scale(value, axis, L, R) : y(value);
        chart.appendChild(node('line', { x1: horizontal ? pos : L, x2: horizontal ? pos : R, y1: horizontal ? T : pos, y2: horizontal ? B : pos, stroke: text, 'stroke-opacity': 0.1 }));
        label(fmt(value, axis.format), { x: horizontal ? pos : L - 14, y: horizontal ? B + 26 : pos + 5, 'text-anchor': horizontal ? 'middle' : 'end' });
      }
      if (m.xy) {
        for (let i = 0; i <= Math.round((c.xAxis.max - c.xAxis.min) / c.xAxis.step); i++) {
          const value = c.xAxis.min + i * c.xAxis.step;
          label(fmt(value, c.xAxis.format), { x: scale(value, c.xAxis, L, R), y: B + 26, 'text-anchor': 'middle' });
        }
      } else {
        const skip = Math.max(1, Math.ceil(c.labels.length / 10));
        c.labels.forEach((name, i) => {
          if (i % skip && i !== c.labels.length - 1) return;
          label(short(name, horizontal ? 13 : 16), horizontal
            ? { x: L - 14, y: T + (i + 0.5) * (B - T) / c.labels.length + 5, 'text-anchor': 'end' }
            : { x: x(i), y: B + 26, 'text-anchor': 'middle' });
        });
      }
      c.series.forEach((s, si) => {
        if (m.native === 'bar') {
          const band = (horizontal ? B - T : R - L) / c.labels.length * 0.7;
          const width = band / (m.stacked ? 1 : c.series.length);
          s.values.forEach((value, i) => {
            const seg = m.stacked ? c.segments[si][i] : { low: 0, high: value };
            const low = scale(seg.low, axis, horizontal ? L : B, horizontal ? R : T), high = scale(seg.high, axis, horizontal ? L : B, horizontal ? R : T);
            const center = horizontal ? T + (i + 0.5) * (B - T) / c.labels.length : x(i);
            const offset = center - band / 2 + (m.stacked ? 0 : si * width);
            tip(node('rect', { x: horizontal ? Math.min(low, high) : offset, y: horizontal ? offset : Math.min(low, high), width: horizontal ? Math.abs(high - low) : Math.max(0.5, width - (m.stacked ? 0 : 2)), height: horizontal ? Math.max(0.5, width - (m.stacked ? 0 : 2)) : Math.abs(high - low), fill: s.color }), `${c.labels[i]} · ${s.name}: ${fmt(value, c.valueFormat)}${m.percent ? ' (' + fmt(seg.high - seg.low, 'percent') + ')' : ''}`);
          });
        } else {
          const points = s.values.map((v, i) => [m.xy ? scale(c.xValues[i], c.xAxis, L, R) : x(i), y(m.stacked ? c.segments[si][i].high : v)]);
          let d = points.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
          if (c.mode === 'smooth-line') d = points.reduce((path, p, i) => {
            if (!i) return `M${p[0]} ${p[1]}`;
            const prev = points[i - 1], dx = (p[0] - prev[0]) / 3;
            return path + ` C${prev[0] + dx} ${prev[1]} ${p[0] - dx} ${p[1]} ${p[0]} ${p[1]}`;
          }, '');
          if (m.native === 'area') {
            const lower = s.values.map((_, i) => [x(i), y(m.stacked ? c.segments[si][i].low : 0)]).reverse();
            chart.appendChild(node('path', { d: d + lower.map(p => ` L${p[0]} ${p[1]}`).join('') + ' Z', fill: s.color, 'fill-opacity': m.stacked ? 0.65 : 0.3 }));
          }
          if (c.mode !== 'scatter' && c.mode !== 'bubble') chart.appendChild(node('path', { d, fill: 'none', stroke: s.color, 'stroke-width': 3 }));
          if (['line-markers', 'scatter', 'scatter-lines', 'bubble'].includes(c.mode)) {
            const maxSize = c.mode === 'bubble' ? Math.max(...c.sizes) : 1;
            points.forEach((p, i) => {
              const r = c.mode === 'bubble' ? Math.sqrt(c.sizes[i] / maxSize) * 25 : 4;
              tip(node('circle', { cx: p[0], cy: p[1], r, fill: s.color, 'fill-opacity': c.mode === 'bubble' ? 0.55 : 1, stroke: s.color }), `${s.name}: X ${fmt(c.xValues ? c.xValues[i] : i + 1, c.xAxis ? c.xAxis.format : 'number')}, Y ${fmt(s.values[i], c.valueFormat)}${c.sizes ? ', size ' + fmt(c.sizes[i]) : ''}`);
            });
          }
        }
      });
    }

    const context = document.createElement('canvas').getContext('2d');
    context.font = `600 14px ${font}`;
    const rows = [[]], gap = 28;
    let used = 0;
    c.legend.forEach(s => {
      const name = short(s.name, 26), width = 19 + context.measureText(name).width;
      if (used && used + gap + width > R - L) { rows.push([]); used = 0; }
      rows[rows.length - 1].push({ ...s, name, width }); used += (used ? gap : 0) + width;
    });
    const legend = node('g', { 'data-chart-legend': '' });
    rows.forEach((items, index) => {
      const width = items.reduce((sum, item) => sum + item.width, 0) + gap * (items.length - 1);
      let lx = (L + R - width) / 2;
      const ly = 550 + index * 26, group = node('g', { 'data-legend-row': index });
      items.forEach(item => {
        group.appendChild(node('rect', { x: lx, y: ly - 10, width: 10, height: 10, fill: item.color }));
        label(item.name, { x: lx + 19, y: ly }, group); lx += item.width + gap;
      });
      legend.appendChild(group);
    });
    chart.appendChild(legend);
    const height = Math.max(620, 550 + (rows.length - 1) * 26 + 28);
    background.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 1100 ${height}`);
    svg.setAttribute('aria-label', c.title + '. ' + m.name + '. ' + c.legend.map(s => s.name).join(', '));
    svg.replaceChildren(chart);
  }

  const api = { MODES, definition, stack, prepare, nativeSpec, example, randomStartup, render };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChartModes = api;
})(typeof window !== 'undefined' ? window : globalThis);
