(function (root) {
  'use strict';
  const PALETTES = {
    signal: { name: 'Signal', colors: ['#36D6ED', '#A78BFA', '#FBBF24', '#FB7185', '#34D399', '#60A5FA'] },
    arcade: { name: 'Arcade', colors: ['#C084FC', '#F472B6', '#22D3EE', '#FACC15', '#4ADE80', '#FB923C'] },
    spectrum: { name: 'Spectrum', colors: ['#60A5FA', '#FB923C', '#4ADE80', '#F87171', '#C084FC', '#FBBF24'] }
  };
  function normalize(value) {
    let text = String(value).trim();
    if (/^#?[a-f\d]{3}$/i.test(text)) text = '#' + text.replace('#', '').split('').map(c => c + c).join('');
    else if (/^[a-f\d]{6}$/i.test(text)) text = '#' + text;
    return /^#[a-f\d]{6}$/i.test(text) ? text.toUpperCase() : null;
  }
  function rgb(h, s, v) {
    const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
    return [f(5), f(3), f(1)].map(n => Math.round(n * 255));
  }
  function hex(h, s, v) { return '#' + rgb(h, s, v).map(n => n.toString(16).padStart(2, '0')).join('').toUpperCase(); }
  function hsv(value) {
    const color = normalize(value);
    if (!color) throw new Error('Use a valid HEX color.');
    const [r, g, b] = color.slice(1).match(/../g).map(n => parseInt(n, 16) / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
    let h = !delta ? 0 : max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
    return { h: (h * 60 + 360) % 360, s: max ? delta / max : 0, v: max };
  }
  function foreground(color) {
    const channels = normalize(color).slice(1).match(/../g).map(n => {
      const v = parseInt(n, 16) / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722 > 0.179 ? '#11151B' : '#F2F5F9';
  }

  let dialog, canvas, fields, active, state, cached, cachedValue = -1, nextId = 0;
  function element(tag, attrs = {}, text) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function drawWheel() {
    const ctx = canvas.getContext('2d'), radius = 120, center = 128;
    if (!cached || cachedValue !== state.v) {
      cached = ctx.createImageData(256, 256); cachedValue = state.v;
      for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
        const dx = x - center, dy = y - center, saturation = Math.hypot(dx, dy) / radius;
        if (saturation > 1) continue;
        const hue = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
        const values = rgb(hue, saturation, state.v), i = (y * 256 + x) * 4;
        cached.data.set([...values, 255], i);
      }
    }
    ctx.putImageData(cached, 0, 0);
    const x = center + radius * state.s * Math.cos(state.h * Math.PI / 180);
    const y = center + radius * state.s * Math.sin(state.h * Math.PI / 180);
    const tokens = getComputedStyle(document.documentElement);
    for (const [width, color] of [[5, tokens.getPropertyValue('--on-accent')], [2, tokens.getPropertyValue('--text')]]) {
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.lineWidth = width; ctx.strokeStyle = color; ctx.stroke();
    }
  }
  function refresh() {
    fields.h.value = Math.round(state.h); fields.s.value = Math.round(state.s * 100); fields.v.value = Math.round(state.v * 100);
    fields.hex.value = hex(state.h, state.s, state.v);
    fields.hex.setAttribute('aria-invalid', 'false'); fields.error.textContent = '';
    fields.preview.style.backgroundColor = fields.hex.value;
    fields.apply.disabled = false;
    drawWheel();
  }
  function createDialog() {
    dialog = element('dialog', { class: 'color-dialog', 'aria-labelledby': 'color-dialog-title' });
    const title = element('h2', { id: 'color-dialog-title' });
    const description = element('p', { class: 'note' }, 'Choose on the wheel, use the sliders, or enter a HEX color.');
    canvas = element('canvas', { width: 256, height: 256, 'aria-hidden': 'true', class: 'color-wheel' });
    fields = {};
    const sliders = element('div', { class: 'color-sliders' });
    for (const [key, name, max] of [['h', 'Hue', 360], ['s', 'Saturation', 100], ['v', 'Brightness', 100]]) {
      const label = element('label', {}, name);
      const input = element('input', { type: 'range', min: 0, max, step: 1, 'aria-label': name });
      fields[key] = input; label.appendChild(input); sliders.appendChild(label);
      input.addEventListener('input', () => { state[key] = Number(input.value) / (key === 'h' ? 1 : 100); refresh(); });
    }
    const line = element('div', { class: 'dialog-hex-row' });
    fields.preview = element('span', { class: 'color-preview', 'aria-hidden': 'true' });
    const hexLabel = element('label', { class: 'builder-label' }, 'HEX color');
    fields.hex = element('input', { type: 'text', maxlength: 7, spellcheck: 'false', 'aria-label': 'Selected HEX color', 'aria-describedby': 'color-dialog-error' });
    hexLabel.appendChild(fields.hex); line.append(fields.preview, hexLabel);
    fields.error = element('p', { id: 'color-dialog-error', class: 'color-error', role: 'status' });
    fields.hex.addEventListener('input', () => {
      const color = normalize(fields.hex.value);
      fields.hex.setAttribute('aria-invalid', String(!color));
      fields.error.textContent = color ? '' : 'Enter a HEX color such as #36D6ED.';
      fields.apply.disabled = !color;
      if (color) { state = hsv(color); fields.preview.style.backgroundColor = color; drawWheel(); }
    });
    fields.hex.addEventListener('blur', () => { if (normalize(fields.hex.value)) refresh(); });
    const actions = element('div', { class: 'dialog-actions export' });
    const cancel = element('button', { type: 'button' }, 'Cancel');
    fields.apply = element('button', { type: 'button', class: 'primary' }, 'Apply color');
    actions.append(cancel, fields.apply);
    cancel.addEventListener('click', () => dialog.close());
    fields.apply.addEventListener('click', () => {
      const color = normalize(fields.hex.value);
      if (!color) return;
      active.commit(color); dialog.close();
    });
    dialog.addEventListener('close', () => active.button.focus());
    const point = event => {
      const box = canvas.getBoundingClientRect(), x = (event.clientX - box.left) * 256 / box.width - 128, y = (event.clientY - box.top) * 256 / box.height - 128;
      state.h = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
      state.s = Math.min(1, Math.hypot(x, y) / 120); refresh();
    };
    canvas.addEventListener('pointerdown', event => { event.preventDefault(); canvas.setPointerCapture(event.pointerId); point(event); });
    canvas.addEventListener('pointermove', event => { if (canvas.hasPointerCapture(event.pointerId)) point(event); });
    canvas.addEventListener('pointerup', event => { if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId); });
    dialog.append(title, description, canvas, sliders, line, fields.error, actions); document.body.appendChild(dialog);
  }

  function control(name, initial, onChange, labelText = name) {
    let color = normalize(initial);
    if (!color) throw new Error('Use a valid initial color.');
    const root = element('div', { class: 'color-control' });
    const label = element('span', { class: 'color-control-label' }, labelText);
    const line = element('div', { class: 'color-fields' });
    const button = element('button', { type: 'button', class: 'color-swatch', 'aria-label': 'Choose ' + name + ' color', 'aria-haspopup': 'dialog' });
    const errorId = 'color-error-' + ++nextId;
    const input = element('input', { type: 'text', class: 'hex-input', maxlength: 7, spellcheck: 'false', 'aria-label': name + ' HEX color', 'aria-describedby': errorId });
    const error = element('span', { id: errorId, class: 'color-error', role: 'status' });
    const setColor = value => {
      color = normalize(value); input.value = color; button.style.backgroundColor = color;
      button.setAttribute('title', 'Choose ' + name + ' color (' + color + ')');
      input.setAttribute('aria-invalid', 'false'); error.textContent = '';
    };
    const commit = value => { setColor(value); onChange(color); };
    input.addEventListener('input', () => {
      const next = normalize(input.value);
      input.setAttribute('aria-invalid', String(!next));
      error.textContent = next ? '' : 'Use #RRGGBB';
      if (next) { color = next; button.style.backgroundColor = next; onChange(next); }
    });
    input.addEventListener('blur', () => { if (normalize(input.value)) setColor(input.value); });
    button.addEventListener('click', () => {
      if (!dialog) createDialog();
      active = { commit, button }; state = hsv(color);
      dialog.querySelector('h2').textContent = name + ' color'; refresh(); dialog.showModal();
    });
    line.append(button, input); root.append(label, line, error); setColor(color);
    return { element: root, setColor };
  }

  const api = { PALETTES, normalize, rgb, hex, hsv, foreground, control };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChartColors = api;
})(typeof window !== 'undefined' ? window : globalThis);
