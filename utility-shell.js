(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const groups = [
    ['data', 'Data', 'Clean, combine, compare, and reshape tables.'],
    ['presentations', 'Presentations', 'Charts, A/B tests, and editable PowerPoint decks.'],
    ['calculators', 'Calculators', 'Percentages, forecasts, pricing, and decision models.'],
    ['text', 'Text', 'Compare, clean, extract, and convert text.'],
    ['visuals', 'Visuals', 'Resize images, remove solid backgrounds, and check colors.'],
  ];
  const state = { datasets: [], slides: [], working: null };
  function el(tag, text, attrs = {}) {
    const n = document.createElement(tag);
    if (text !== null) n.textContent = text;
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  }
  function message(text, error = false) {
    $('utility-status').textContent = text;
    $('utility-status').setAttribute('role', error ? 'alert' : 'status');
  }
  async function safe(action) {
    try {
      return await action();
    } catch (error) {
      message(error.message || 'Unable to complete this operation.', true);
    }
  }
  function button(text, action, cls = '') {
    const n = el('button', text, { type: 'button', class: cls });
    n.addEventListener('click', () => safe(action));
    return n;
  }
  function field(parent, label, name, type = 'text', value = '', required = true) {
    const wrap = el('label', label, { class: 'console-field' }),
      n = el(type === 'textarea' ? 'textarea' : type === 'select' ? 'select' : 'input', null, {
        name,
      });
    if (!['textarea', 'select'].includes(type)) n.type = type;
    if (required) n.required = true;
    if (type === 'textarea') n.rows = 5;
    if (type === 'number') n.step = 'any';
    n.value = value;
    wrap.append(n);
    parent.append(wrap);
    return n;
  }
  function select(parent, label, name, options, value) {
    const n = field(parent, label, name, 'select');
    options.forEach((item) => {
      const [v, t] = Array.isArray(item) ? item : [item, item];
      n.append(el('option', t, { value: v }));
    });
    if (value !== undefined) n.value = value;
    return n;
  }
  function form(parent, title, action) {
    const n = el('form', null, { class: 'console-form' });
    if (title) n.append(el('h3', title));
    n.addEventListener('submit', (event) => {
      event.preventDefault();
      const submit = n.querySelector('[type=submit]');
      safe(async () => {
        submit.disabled = true;
        try {
          await action(Object.fromEntries(new FormData(n)), n);
        } finally {
          submit.disabled = false;
        }
      });
    });
    parent.append(n);
    return n;
  }
  function submit(parent, text) {
    parent.append(el('button', text, { type: 'submit', class: 'primary' }));
  }
  function panel(parent, title, detail) {
    const n = el('section', null, { class: 'panel console-panel' });
    n.append(el('h2', title));
    if (detail) n.append(el('p', detail, { class: 'note' }));
    parent.append(n);
    return n;
  }
  function download(content, name, type = 'text/plain') {
    const url = URL.createObjectURL(
        content instanceof Blob ? content : new Blob([content], { type })
      ),
      a = el('a', null, { href: url, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function table(parent, rows) {
    const wrap = el('div', null, {
        class: 'console-table',
        tabindex: '0',
        role: 'region',
        'aria-label': 'Table preview',
      }),
      t = el('table', null),
      head = el('thead', null),
      body = el('tbody', null),
      tr = el('tr', null);
    rows[0].forEach((v) => tr.append(el('th', v, { scope: 'col' })));
    head.append(tr);
    rows.slice(1, 31).forEach((r) => {
      const tr = el('tr', null);
      r.forEach((v) => tr.append(el('td', v)));
      body.append(tr);
    });
    t.append(head, body);
    wrap.append(t);
    parent.append(
      wrap,
      el('p', `${rows.length - 1} rows · ${rows[0].length} columns · Preview shows up to 30 rows`, {
        class: 'note',
      })
    );
    return wrap;
  }
  function actions(parent, ...buttons) {
    const n = el('div', null, { class: 'console-actions' });
    n.append(...buttons);
    parent.append(n);
    return n;
  }
  function navigate(id) {
    message('');
    for (const [g] of groups) {
      $('tool-' + g).hidden = g !== id;
      $('nav-' + g).setAttribute('aria-current', g === id ? 'page' : 'false');
    }
    const group = groups.find((g) => g[0] === id);
    $('utility-heading').textContent = group[1];
    $('utility-description').textContent = group[2];
    window.scrollTo(0, 0);
  }
  const main = document.querySelector('main.shell');
  main.classList.add('console-main');
  const shell = el('div', null, { class: 'console-shell' }),
    sidebar = el('aside', null, { class: 'console-sidebar', 'aria-label': 'Utility navigation' });
  main.before(shell);
  shell.append(sidebar, main);
  sidebar.append(
    el('div', 'SC / TOOLKIT', { class: 'console-brand' }),
    el('p', 'Less busywork. More output.', { class: 'note' })
  );
  const nav = el('nav', null, { 'aria-label': 'Tools' });
  sidebar.append(nav);
  groups.forEach(([id, name], i) => {
    const n = button(
      String(i + 1).padStart(2, '0') + '  ' + name,
      () => navigate(id),
      'console-nav'
    );
    n.id = 'nav-' + id;
    nav.append(n);
  });
  sidebar.append(
    button('Search tools · Ctrl/Cmd K', () => openCommands()),
    el('p', 'Files stay in your browser. Download outputs before closing this tab.', {
      class: 'note',
    })
  );
  // Preserve the old saved workspace without showing project-management controls.
  try {
    const legacy = localStorage.getItem('stat-console-projects-v1');
    if (legacy) {
      sidebar.append(
        button('Download previous workspace', () =>
          download(legacy, 'stat-console-previous-workspace.json', 'application/json')
        ),
        button('Recover previous tables & charts', () => U.recoverLegacy(legacy))
      );
    }
  } catch (error) {
    /* Storage is optional; utilities remain available. */
  }
  const tabs = document.querySelector('.workspace-tabs'),
    analysis = el('div', null, { id: 'analysis-tools' });
  tabs.before(analysis);
  analysis.append(tabs, $('studio-panel'), $('analyzer-panel'));
  const toolbar = el('div', null, { class: 'utility-heading' });
  toolbar.append(
    el('h2', '', { id: 'utility-heading' }),
    el('p', '', { id: 'utility-description', class: 'note' }),
    el('p', '', { id: 'utility-status', role: 'status', class: 'console-status' })
  );
  analysis.before(toolbar);
  for (const [id] of groups) {
    const view = el('div', null, { id: 'tool-' + id });
    analysis.before(view);
  }
  $('tool-presentations').append(analysis);
  const footer = document.querySelector('footer');
  footer.textContent = 'STAT CONSOLE · Everyday work utilities · Session-only inputs · v0.3.0';
  const dialog = el('dialog', null, {
      class: 'console-command',
      'aria-labelledby': 'command-title',
    }),
    search = el('input', null, {
      type: 'search',
      'aria-label': 'Search tools',
      placeholder: 'Find a tool…',
    }),
    results = el('div', null, { class: 'command-results' });
  dialog.append(
    el('h2', 'Find your next tool', { id: 'command-title' }),
    search,
    results,
    button('Close', () => dialog.close())
  );
  document.body.append(dialog);
  const commands = [];
  function command(label, group, target) {
    commands.push({ label, group, target });
  }
  groups.forEach(([id, name]) => command(name, id));
  function refreshCommands() {
    const matches = commands.filter((c) =>
      c.label.toLowerCase().includes(search.value.toLowerCase())
    );
    results.replaceChildren(
      ...matches.slice(0, 30).map((c) =>
        button(c.label, () => {
          dialog.close();
          navigate(c.group);
          if (c.target) {
            c.target.scrollIntoView({ block: 'start' });
            const focus = c.target.querySelector('input,textarea,button,select');
            focus?.focus({ preventScroll: true });
          }
        })
      )
    );
    if (!matches.length) results.append(el('p', 'No matching tools.'));
  }
  function openCommands() {
    search.value = '';
    refreshCommands();
    dialog.showModal();
    search.focus();
  }
  search.addEventListener('input', refreshCommands);
  dialog.addEventListener('keydown', (event) => {
    const list = [...results.querySelectorAll('button')],
      index = list.indexOf(document.activeElement);
    if (['ArrowDown', 'ArrowUp'].includes(event.key) && list.length) {
      event.preventDefault();
      list[
        index < 0
          ? event.key === 'ArrowDown'
            ? 0
            : list.length - 1
          : (index + (event.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length
      ].focus();
    }
    if (event.key === 'Enter' && document.activeElement === search && list.length) {
      event.preventDefault();
      list[0].click();
    }
  });
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      dialog.open ? dialog.close() : openCommands();
    }
  });
  const U = (window.Utilities = {
    $,
    el,
    button,
    field,
    select,
    form,
    submit,
    panel,
    download,
    table,
    actions,
    navigate,
    message,
    safe,
    state,
    command,
    libs: window.UtilityLibraries,
  });
  U.addDataset = (name, rows) => {
    const item = { id: window.ConsoleCore.id(), name, rows: window.ConsoleCore.table(rows) };
    state.datasets.push(item);
    document.dispatchEvent(new Event('datasets-changed'));
    return item;
  };
  U.addSlide = (item) => {
    if (state.slides.length >= 30) throw new Error('Use at most 30 slides per deck.');
    state.slides.push(item);
    document.dispatchEvent(new Event('slides-changed'));
    message('Added to your deck. Open Deck builder in Presentations.');
  };
  U.recoverLegacy = (text) => {
    if (text.length > 5 * 1024 * 1024) throw new Error('Previous workspace exceeds 5 MB.');
    const raw = JSON.parse(text);
    if (raw.version !== 1 || !Array.isArray(raw.projects) || raw.projects.length > 100)
      throw new Error('Unsupported previous workspace.');
    const old = raw.projects.map((project) =>
        window.ConsoleCore.importProject(JSON.stringify({ version: 1, project }))
      ),
      tables = old.flatMap((project) =>
        project.datasets.map((d) => ({ name: project.name + ' / ' + d.name, rows: d.rows }))
      ),
      charts = [];
    const original = window.ChartStudio.snapshot();
    try {
      for (const project of old)
        for (const chart of project.charts) {
          window.ChartStudio.restore(chart.snapshot);
          charts.push({
            type: 'chart',
            title: chart.name,
            config: window.ChartStudio.capture(),
            snapshot: chart.snapshot,
          });
        }
    } finally {
      window.ChartStudio.restore(original);
    }
    if (state.slides.length + charts.length > 30)
      throw new Error(
        'Recovery would exceed 30 deck slides. Download the previous workspace backup instead.'
      );
    tables.forEach((d) => U.addDataset(d.name, d.rows));
    charts.forEach((chart) => U.addSlide(chart));
    message(
      'Recovered ' +
        tables.length +
        ' tables and ' +
        charts.length +
        ' charts into this session. Previous storage is unchanged.'
    );
  };
  U.fileLimit = (file, max = 10) => {
    if (!file) throw new Error('Choose a file first.');
    if (file.size > max * 1024 * 1024) throw new Error(`Choose a file under ${max} MB.`);
  };
  U.renderers = [];
  window.DataTools.mount($('tool-data'), U);
  window.PresentationTools.mount($('tool-presentations'), U);
  window.PercentageCalculator.mount($('tool-calculators'));
  window.DecisionTools.mount($('tool-calculators'), U);
  window.TextTools.mount($('tool-text'), U);
  window.VisualTools.mount($('tool-visuals'), U);
  for (const [id] of groups) {
    const area = $('tool-' + id),
      links = el('nav', null, { class: 'utility-jumps', 'aria-label': id + ' tool shortcuts' });
    const sections =
      id === 'calculators'
        ? [...area.querySelectorAll('.percentage-intro, .console-panel')]
        : [...area.children].filter((n) => n.matches('section.panel, #analysis-tools'));
    for (const section of sections) {
      const heading = section.querySelector('h2');
      const label = section.id === 'analysis-tools' ? 'Charts & A/B tests' : heading?.textContent;
      if (label)
        links.append(
          button(label, () => {
            section.scrollIntoView({ block: 'start' });
          })
        );
    }
    area.prepend(links);
  }
  navigate('data');
})();
