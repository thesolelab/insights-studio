(function () {
  'use strict';
  window.DataTools = {
    mount(root, U) {
      const { el, panel, form, field, select, submit, button, actions, message, state } = U,
        C = window.ConsoleCore,
        D = window.ChartData,
        K = window.UtilityCore;
      let working = null,
        steps = [],
        recipes = [],
        revision = 0;
      const intro = panel(
        root,
        'Data workbench',
        'Load spreadsheets, clean and reshape data, then download the result or turn it into a chart. Tables support 10,000 rows, 100 columns, and 200,000 cells.'
      );
      U.command('Import CSV Excel JSON · combine compare pivot clean data', 'data', intro);
      const paste = form(intro, 'Paste a table', (data) => {
        const rows = C.table(D.splitDelimited(data.table));
        working = { name: data.name.trim() || 'Pasted table', rows };
        steps = [];
        draw();
        message('Table loaded.');
      });
      field(paste, 'Table name', 'name', 'text', 'My table');
      field(paste, 'CSV or tab-separated data with headers', 'table', 'textarea', '');
      submit(paste, 'Load pasted table');
      const files = field(
        intro,
        'Upload CSV, TSV, Excel, or JSON tables (up to 20 files, 5 MB each)',
        'files',
        'file',
        '',
        false
      );
      files.multiple = true;
      files.accept = '.csv,.tsv,.xlsx,.xls,.json';
      files.addEventListener('change', () =>
        U.safe(async () => {
          if (files.files.length > 20) throw new Error('Choose at most 20 files.');
          const request = ++revision;
          files.disabled = true;
          try {
            const pending = [];
            for (const file of files.files) {
              U.fileLimit(file, 5);
              if (/\.xlsx?$/i.test(file.name)) {
                const X = await U.libs.load('excel'),
                  book = X.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
                for (const name of book.SheetNames) {
                  const rows = X.utils.sheet_to_json(book.Sheets[name], {
                    header: 1,
                    raw: false,
                    defval: '',
                    blankrows: false,
                  });
                  if (rows.length > 1)
                    pending.push({ name: file.name + ' / ' + name, rows: C.table(rows) });
                }
              } else if (/\.json$/i.test(file.name)) {
                const raw = JSON.parse(await file.text());
                let rows;
                if (Array.isArray(raw) && raw.length && Array.isArray(raw[0])) rows = raw;
                else if (
                  Array.isArray(raw) &&
                  raw.length &&
                  raw.every((r) => r && typeof r === 'object' && !Array.isArray(r))
                ) {
                  const keys = Object.keys(raw[0]);
                  if (raw.some((r) => JSON.stringify(Object.keys(r)) !== JSON.stringify(keys)))
                    throw new Error('JSON records need identical keys.');
                  rows = [keys, ...raw.map((r) => keys.map((k) => r[k] ?? ''))];
                } else throw new Error('JSON must contain an array of rows or records.');
                pending.push({ name: file.name, rows: C.table(rows) });
              } else if (/\.(csv|tsv)$/i.test(file.name))
                pending.push({
                  name: file.name,
                  rows: C.table(D.splitDelimited(await file.text())),
                });
              else throw new Error('Use CSV, TSV, Excel, or JSON files.');
            }
            if (!pending.length) throw new Error('No nonempty tables found.');
            if (request !== revision) {
              message(
                'Import finished, but a newer working table was kept. Import again to load these files.'
              );
              return;
            }
            pending.forEach((item) => U.addDataset(item.name, item.rows));
            working = structuredClone(pending[0]);
            steps = [];
            draw();
            message(
              pending.length +
                ' tables imported. Every nonempty Excel sheet is available in Session tables.'
            );
          } finally {
            files.disabled = false;
            files.value = '';
          }
        })
      );
      actions(
        intro,
        button('Load sample table', () => {
          working = {
            name: 'Channel results',
            rows: [
              ['Channel', 'Spend', 'Leads'],
              ['Search', '12000', '480'],
              ['Social', '8000', '260'],
              ['Partners', '5000', '150'],
              ['Social', '8000', '260'],
            ],
          };
          steps = [];
          draw();
        })
      );
      const library = panel(
        root,
        'Session tables',
        'Keep snapshots here to compare, combine, join, or reuse. Download files before closing the tab.'
      );
      const tableList = el('div', null);
      library.append(tableList);
      const result = el('div', null, { id: 'data-result' });
      root.append(result);
      function libraryDraw() {
        tableList.replaceChildren();
        if (!state.datasets.length)
          tableList.append(
            el('p', 'No tables yet. Import a file or keep a working snapshot.', {
              class: 'console-empty',
            })
          );
        state.datasets.forEach((item) => {
          const row = el('div', null, { class: 'console-record' });
          row.append(el('div', item.name + ' · ' + (item.rows.length - 1) + ' rows'));
          actions(
            row,
            button('Open', () => {
              working = structuredClone(item);
              steps = [];
              draw();
            }),
            button('Remove', () => {
              state.datasets = state.datasets.filter((x) => x.id !== item.id);
              document.dispatchEvent(new Event('datasets-changed'));
            })
          );
          tableList.append(row);
        });
        if (state.datasets.length > 1)
          actions(
            tableList,
            button('Combine all matching tables', () => {
              working = {
                name: 'Combined tables',
                rows: K.append(state.datasets.map((x) => x.rows)),
              };
              steps = [];
              draw();
              message('All session tables combined. Headers must match exactly.');
            })
          );
      }
      document.addEventListener('datasets-changed', libraryDraw);
      libraryDraw();
      function setResult(name, rows) {
        working = { name, rows: C.table(rows) };
        steps = [];
        draw();
      }
      function draw() {
        revision++;
        result.replaceChildren();
        state.working = working;
        if (!working) return;
        const view = panel(
          result,
          working.name,
          'Working copy. Transformations leave session-table snapshots unchanged.'
        );
        U.table(view, working.rows);
        actions(
          view,
          button(
            'Keep table snapshot',
            () => {
              U.addDataset(working.name, structuredClone(working.rows));
              message('Snapshot added to Session tables.');
            },
            'primary'
          ),
          button(working.rows.length > 201 ? 'Chart first 200 rows' : 'Create chart', () => {
            window.ChartStudio.loadRows(working.rows.slice(0, 201), working.name);
            U.navigate('presentations');
            window.AnalysisTabs.activate('studio-tab');
            message(
              working.rows.length > 201
                ? 'First 200 rows loaded. Full table remains in Data.'
                : 'Table loaded in Chart Studio.'
            );
          }),
          button('Add table to deck', () => {
            if (working.rows.length > 16 || working.rows[0].length > 8)
              throw new Error(
                'Slide tables support up to 15 data rows and 8 columns. Pivot or trim the data first.'
              );
            U.addSlide({ type: 'table', title: working.name, rows: structuredClone(working.rows) });
          })
        );
        const exportForm = form(view, 'Convert & download', async (data) => {
          const snapshot = structuredClone(working.rows);
          const name = working.name.replace(/[^\w-]+/g, '-').slice(0, 60) || 'table';
          if (data.format === 'csv') U.download(C.csv(snapshot), name + '.csv', 'text/csv');
          if (data.format === 'tsv') {
            const safe = D.splitDelimited(C.csv(snapshot));
            U.download(
              safe
                .map((r) => r.map((v) => '"' + v.replace(/"/g, '""') + '"').join('\t'))
                .join('\n'),
              name + '.tsv',
              'text/tab-separated-values'
            );
          }
          if (data.format === 'json')
            U.download(JSON.stringify(snapshot, null, 2), name + '.json', 'application/json');
          if (data.format === 'xlsx') {
            const X = await U.libs.load('excel'),
              book = X.utils.book_new(),
              sheet = X.utils.aoa_to_sheet(snapshot);
            X.utils.book_append_sheet(book, sheet, 'Data');
            X.writeFile(book, name + '.xlsx');
          }
        });
        select(exportForm, 'Output format', 'format', ['csv', 'tsv', 'json', 'xlsx']);
        submit(exportForm, 'Download table');
        const tools = panel(result, 'Clean, calculate, and pivot');
        actions(
          tools,
          button('Trim & remove duplicate rows', () => {
            working.rows = C.clean(working.rows);
            steps.push({ type: 'clean' });
            draw();
            message('Whitespace, blank rows, and exact duplicates removed.');
          })
        );
        const duplicate = form(tools, 'Find duplicate keys', (data) => {
          const rows = K.duplicates(working.rows, data.key);
          if (rows.length === 1) {
            message('No duplicate keys found.');
            return;
          }
          setResult(working.name + ' duplicates', rows);
        });
        select(duplicate, 'Key column', 'key', working.rows[0]);
        submit(duplicate, 'Find duplicates');
        const derive = form(tools, 'Calculate a column', (data) => {
          const spec = { type: 'derive', ...data };
          working.rows = C.derive(working.rows, spec);
          steps.push(spec);
          draw();
        });
        select(derive, 'Column A', 'a', working.rows[0]);
        select(derive, 'Operation', 'op', [
          ['difference', 'A − B'],
          ['sum', 'A + B'],
          ['product', 'A × B'],
          ['ratio', 'A ÷ B'],
          ['change', 'Change (A − B) ÷ |B|'],
        ]);
        select(derive, 'Column B', 'b', working.rows[0]);
        field(derive, 'New column name', 'name');
        submit(derive, 'Calculate column');
        const pivot = form(tools, 'Pivot / summarize', (data) =>
          setResult(
            working.name + ' summary',
            K.pivot(working.rows, data.group, data.value, data.operation)
          )
        );
        select(pivot, 'Group by', 'group', working.rows[0]);
        select(pivot, 'Value column', 'value', working.rows[0]);
        select(pivot, 'Aggregate', 'operation', ['sum', 'mean', 'count', 'min', 'max']);
        submit(pivot, 'Create summary');
        if (state.datasets.length) {
          const join = form(tools, 'Compare or join another table', (data) => {
            const other = state.datasets.find((x) => x.id === data.other);
            if (data.operation === 'append')
              setResult('Combined table', K.append([working.rows, other.rows]));
            else if (data.operation === 'join')
              setResult(
                working.name + ' + ' + other.name,
                C.join(working.rows, other.rows, data.key)
              );
            else {
              const rows = C.compare(working.rows, other.rows, data.key);
              if (rows.length === 1) {
                message('No changes found.');
                return;
              }
              setResult('Version differences', rows);
            }
          });
          select(
            join,
            'Other table',
            'other',
            state.datasets.map((x) => [x.id, x.name])
          );
          select(join, 'Operation', 'operation', [
            ['compare', 'Compare versions'],
            ['join', 'Left join columns'],
            ['append', 'Append rows'],
          ]);
          select(join, 'Shared unique key (compare/join)', 'key', working.rows[0]);
          submit(join, 'Apply');
          tools.append(
            el(
              'p',
              'Compare requires identical headers. Joins retain every working row and leave unmatched cells blank. Both operations require unique nonblank keys.',
              { class: 'note' }
            )
          );
        }
        if (steps.length)
          actions(
            tools,
            button('Keep reusable recipe', () => {
              recipes.push({
                name: 'Recipe ' + (recipes.length + 1),
                steps: structuredClone(steps),
              });
              draw();
              message('Recipe kept for this session. Open another table and replay it below.');
            }),
            button('Download recipe', () =>
              U.download(
                JSON.stringify({ version: 1, steps }, null, 2),
                'stat-console-recipe.json',
                'application/json'
              )
            )
          );
        const recipe = panel(
          result,
          'Reusable cleanup recipes',
          'Replay cleanup and calculated-column steps on a fresh working table. No scripts or external actions run.'
        );
        const recipeFile = field(recipe, 'Import recipe JSON', 'recipe', 'file', '', false);
        recipeFile.accept = '.json';
        recipeFile.addEventListener('change', () =>
          U.safe(async () => {
            const file = recipeFile.files[0];
            U.fileLimit(file, 1);
            const data = JSON.parse(await file.text());
            if (data.version !== 1) throw new Error('Unsupported recipe.');
            C.run(working.rows, data.steps);
            recipes.push({ name: file.name, steps: data.steps });
            draw();
            message('Recipe validated against the current table and added.');
          })
        );
        recipes.forEach((r) =>
          actions(
            recipe,
            button('Run ' + r.name, () => {
              working.rows = C.run(working.rows, r.steps);
              steps = structuredClone(r.steps);
              draw();
              message('Recipe applied. Review before downloading.');
            })
          )
        );
      }
      U.openData = (name, rows) => {
        setResult(name, rows);
        U.navigate('data');
      };
    },
  };
})();
