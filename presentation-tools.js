(function () {
  'use strict';
  window.PresentationTools = {
    mount(root, U) {
      const { el, panel, form, field, submit, button, actions, state } = U;
      U.command(
        'Chart Studio editable PowerPoint dual axis A/B test analyzer',
        'presentations',
        root.querySelector('#analysis-tools')
      );
      const add = document.getElementById('builder-add-deck');
      add.textContent = 'Add chart to deck';
      add.addEventListener('click', () =>
        U.safe(() =>
          U.addSlide({
            type: 'chart',
            title: window.ChartStudio.snapshot().title,
            config: window.ChartStudio.capture(),
            snapshot: window.ChartStudio.snapshot(),
          })
        )
      );
      document.getElementById('builder-to-workbench').textContent = 'Send to Data';
      document.getElementById('builder-to-workbench').addEventListener('click', () =>
        U.safe(() => {
          const snapshot = window.ChartStudio.snapshot();
          U.openData(snapshot.title, snapshot.rows);
        })
      );
      const deck = panel(
        root,
        'Deck builder',
        'Assemble native editable charts, editable tables, and images into one 16:9 PowerPoint. Charts keep their data, colors, and export fixes. Add visuals from Visuals or tables from Data. Up to 30 slides.'
      );
      deck.id = 'deck-builder';
      U.command('Deck builder assemble slides editable PowerPoint tables', 'presentations', deck);
      const f = form(deck, 'Add an editable slide table', (data) => {
        const rows = window.ConsoleCore.table(window.ChartData.splitDelimited(data.data));
        if (rows.length > 16 || rows[0].length > 8)
          throw new Error('Use up to 15 data rows and 8 columns for slide tables.');
        U.addSlide({ type: 'table', title: data.title, rows });
      });
      field(f, 'Slide title', 'title', 'text', 'Summary');
      field(f, 'Table with headers (CSV / TSV)', 'data', 'textarea');
      submit(f, 'Add table slide');
      const list = el('div', null),
        controls = el('div', null, { class: 'console-actions' });
      deck.append(list, controls);
      const title = field(
        deck,
        'Deck title / filename',
        'deck-title',
        'text',
        'Stat Console deck',
        false
      );
      let exporting = false;
      const exportButton = button(
        'Download PowerPoint deck',
        async () => {
          if (exporting) return;
          if (!state.slides.length) throw new Error('Add at least one chart, table, or image.');
          const slides = structuredClone(state.slides);
          exporting = true;
          exportButton.disabled = true;
          try {
            U.message('Preparing editable PowerPoint deck…');
            const P = await U.libs.load('powerpoint'),
              pptx = new P();
            pptx.layout = 'LAYOUT_WIDE';
            pptx.author = 'Stat Console';
            pptx.title = title.value || 'Stat Console deck';
            const charts = [];
            const token = (name) =>
              getComputedStyle(document.documentElement)
                .getPropertyValue(name)
                .trim()
                .replace('#', '');
            for (const item of slides) {
              const slide = pptx.addSlide();
              if (item.type === 'chart') {
                window.ChartStudio.addNativeChart(pptx, slide, item.config);
                charts.push(item.config);
                continue;
              }
              slide.background = { color: token('--bg') };
              slide.addText(item.title, {
                x: 0.6,
                y: 0.3,
                w: 12.1,
                h: 0.55,
                fontFace: 'Arial',
                fontSize: 26,
                bold: true,
                color: token('--text'),
                margin: 0,
              });
              if (item.type === 'table')
                slide.addTable(
                  item.rows.map((r, i) =>
                    r.map((text) => ({
                      text: String(text),
                      options: {
                        bold: i === 0,
                        fill: i === 0 ? token('--border') : token('--surface-inset'),
                        color: token('--text'),
                      },
                    }))
                  ),
                  {
                    x: 0.6,
                    y: 1.15,
                    w: 12.1,
                    h: 5.5,
                    fontFace: 'Arial',
                    fontSize: Math.max(10, 18 - item.rows.length / 2),
                    border: { type: 'solid', color: token('--border'), pt: 1 },
                    margin: 0.08,
                    autoPage: false,
                  }
                );
              else if (item.type === 'image') {
                const maxW = 12.1,
                  maxH = 5.5,
                  ratio = item.width / item.height,
                  w = Math.min(maxW, maxH * ratio),
                  h = w / ratio;
                slide.addImage({
                  data: item.data,
                  x: (13.333 - w) / 2,
                  y: 1.15 + (maxH - h) / 2,
                  w,
                  h,
                });
              }
            }
            U.download(
              await window.ChartStudio.deckBlob(pptx, charts),
              (title.value.replace(/[^\w-]+/g, '-') || 'stat-console-deck') + '.pptx',
              'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            );
            U.message('Deck downloaded. Charts and tables are editable in PowerPoint.');
          } finally {
            exporting = false;
            exportButton.disabled = false;
          }
        },
        'primary'
      );
      controls.append(exportButton);
      function draw() {
        list.replaceChildren();
        if (!state.slides.length)
          list.append(
            el(
              'p',
              'Your deck is empty. Add a chart above, paste a table, or send an image from Visuals.',
              { class: 'console-empty' }
            )
          );
        state.slides.forEach((item, i) => {
          const row = el('div', null, { class: 'console-record' });
          row.append(el('div', i + 1 + '. ' + item.title + ' · ' + item.type));
          const up = button('Move up', () => {
            [state.slides[i - 1], state.slides[i]] = [state.slides[i], state.slides[i - 1]];
            draw();
          });
          up.disabled = i === 0;
          const down = button('Move down', () => {
            [state.slides[i], state.slides[i + 1]] = [state.slides[i + 1], state.slides[i]];
            draw();
          });
          down.disabled = i === state.slides.length - 1;
          actions(
            row,
            up,
            down,
            button('Remove', () => {
              state.slides.splice(i, 1);
              draw();
            })
          );
          if (item.type === 'chart')
            actions(
              row,
              button('Reopen chart', () => {
                window.ChartStudio.restore(item.snapshot);
                window.AnalysisTabs.activate('studio-tab');
                document.getElementById('analysis-tools').scrollIntoView();
              })
            );
          list.append(row);
        });
      }
      document.addEventListener('slides-changed', draw);
      draw();
      const capture = panel(
        root,
        'A/B chart to deck',
        'Add the current A/B distribution as an image slide. The statistical inputs remain in the A/B tab; native editable charts are created in Chart Studio.'
      );
      actions(
        capture,
        button('Add current A/B distribution', () => {
          document.getElementById('test-form').requestSubmit();
          if (document.getElementById('error').textContent.trim())
            throw new Error('Calculate a valid A/B result first.');
          const source =
            'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(window.svgText())));
          U.addSlide({
            type: 'image',
            title: 'A/B test distribution',
            data: source,
            width: 1100,
            height: 510,
          });
        })
      );
    },
  };
})();
