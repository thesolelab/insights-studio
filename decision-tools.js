(function () {
  'use strict';
  window.DecisionTools = {
    mount(root, U) {
      const K = window.UtilityCore,
        { el, panel, form, field, submit, button, actions } = U;
      function tool(title, detail, fields, compute) {
        const box = panel(root, title, detail);
        U.command(title, 'calculators', box);
        const output = el('div', null);
        let current = null;
        const f = form(box, '', (data) => {
          current = compute(data);
          output.replaceChildren();
          U.table(output, current);
          actions(
            output,
            button('Download CSV', () =>
              U.download(
                window.ConsoleCore.csv(current),
                title.toLowerCase().replace(/\W+/g, '-') + '.csv',
                'text/csv'
              )
            ),
            button('Open result in Data', () => U.openData(title, current))
          );
        });
        for (const [label, name, value, type = 'number'] of fields)
          field(f, label, name, type, value);
        submit(f, 'Calculate');
        f.addEventListener('input', () => {
          current = null;
          output.replaceChildren();
        });
        box.append(output);
        return box;
      }
      tool(
        'Budget check',
        'Compare an actual spend with a planned budget. Remaining is planned minus spent.',
        [
          ['Planned budget', 'planned', '10000'],
          ['Actual spend', 'spent', '8500'],
        ],
        (d) => {
          const a = K.numeric(d.planned),
            b = K.numeric(d.spent);
          if (a <= 0 || b < 0) throw new Error('Use a positive budget and nonnegative spend.');
          return [
            ['Metric', 'Value'],
            ['Budget', String(a)],
            ['Spent', String(b)],
            ['Remaining', String(a - b)],
            ['Used %', String((b / a) * 100)],
          ];
        }
      );
      tool(
        'ROI calculator',
        'Return means total proceeds, including the original investment. ROI = (return − investment) ÷ investment.',
        [
          ['Total return', 'gain', '15000'],
          ['Investment', 'cost', '10000'],
        ],
        (d) => {
          const r = K.roi(d.gain, d.cost);
          return [
            ['Metric', 'Value'],
            ['Net return', String(r.net)],
            ['ROI %', String(r.roi)],
          ];
        }
      );
      tool(
        'Pricing & margin',
        'Calculate a selling price from unit cost and target gross margin. Margin differs from markup.',
        [
          ['Cost per unit', 'cost', '30'],
          ['Target margin %', 'margin', '40'],
        ],
        (d) => {
          const price = K.price(d.cost, d.margin);
          return [
            ['Metric', 'Value'],
            ['Selling price', String(price)],
            ['Profit per unit', String(price - Number(d.cost))],
            ['Target margin %', d.margin],
          ];
        }
      );
      tool(
        'Break-even & unit economics',
        'Assumes every unit sells at a constant price and variable cost. Enter all costs in the same currency.',
        [
          ['Units', 'units', '1000'],
          ['Price per unit', 'price', '50'],
          ['Variable cost per unit', 'variable', '20'],
          ['Fixed cost', 'fixed', '10000'],
        ],
        (d) => {
          const r = K.economics(d);
          return [
            ['Metric', 'Value'],
            ['Revenue', String(r.revenue)],
            ['Total cost', String(r.cost)],
            ['Profit', String(r.profit)],
            ['Margin %', r.margin === null ? 'Undefined' : String(r.margin * 100)],
            ['Break-even units', r.breakEven === null ? 'Unavailable' : String(r.breakEven)],
          ];
        }
      );
      tool(
        'Growth forecast',
        'Compound growth per period, with no seasonality or uncertainty model. Up to 120 periods.',
        [
          ['Starting value', 'base', '10000'],
          ['Growth per period %', 'growth', '5'],
          ['Number of periods', 'periods', '12'],
        ],
        (d) => K.forecast(d.base, d.growth, d.periods)
      );
      tool(
        'Sensitivity analysis',
        'Compare profit as demand varies from −20% to +20%. Price and costs stay fixed. Fractional units are rounded.',
        [
          ['Base units', 'units', '1000'],
          ['Price per unit', 'price', '50'],
          ['Variable cost per unit', 'variable', '20'],
          ['Fixed cost', 'fixed', '10000'],
        ],
        (d) => {
          K.economics(d);
          return [
            ['Demand change %', 'Units', 'Profit'],
            ...[-20, -10, 0, 10, 20].map((change) => {
              const units = Math.round(Number(d.units) * (1 + change / 100));
              return [String(change), String(units), String(K.economics({ ...d, units }).profit)];
            }),
          ];
        }
      );
      tool(
        'Weighted decision scorecard',
        'Paste Criterion, Weight, then one score column per option. Use a consistent scoring scale with higher scores meaning better outcomes. Weights are normalized to their total.',
        [
          [
            'Criteria table',
            'scores',
            'Criterion,Weight,Option A,Option B\nCost,40,8,6\nEase of use,35,6,9\nFit,25,9,7',
            'textarea',
          ],
        ],
        (d) => K.weighted(window.ChartData.splitDelimited(d.scores))
      );
      U.command(
        'Percentage calculator · percent of proportion increase decrease',
        'calculators',
        root.querySelector('.percentage-intro')
      );
    },
  };
})();
