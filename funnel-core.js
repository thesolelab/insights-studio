(function (root) {
  'use strict';
  function count(value, label = 'Count') {
    const text = String(value ?? '').trim();
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(text))
      throw new Error(label + ': enter a non-negative whole count.');
    const n = Number(text.replace(/,/g, ''));
    if (!Number.isSafeInteger(n) || n > 1e12)
      throw new Error(label + ': use a count no larger than 1 trillion.');
    return n;
  }
  const number = (n) => n.toLocaleString('en-US');
  function decimal(n) {
    const text = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      useGrouping: false,
    }).format(n);
    return text === '-0.0' ? '0.0' : text;
  }
  const percent = (n) => (n === null ? 'N/A' : decimal(n * 100) + '%');
  function signed(n, suffix = '') {
    if (n === null) return 'N/A';
    const text = decimal(n);
    return (Number(text) > 0 ? '+' : '') + text + suffix;
  }
  function funnel(input) {
    if (!Array.isArray(input) || input.some((row) => !Array.isArray(row)))
      throw new Error('Paste two columns: step and users.');
    let rows = input.filter((row) => row.some((v) => String(v ?? '').trim()));
    if (rows.some((row) => row.length !== 2))
      throw new Error('Use exactly two columns: step and users.');
    if (
      rows.length &&
      /^(?:users|count|visitors|unique visitors|unique users|sessions|people)$/i.test(
        String(rows[0][1]).trim()
      )
    )
      rows = rows.slice(1);
    if (rows.length < 2 || rows.length > 8)
      throw new Error('Use 2–8 ordered funnel steps.');
    const steps = rows.map((row, i) => {
      const label = String(row[0]).trim();
      if (!label || label.length > 80)
        throw new Error('Each step needs a label of 1–80 characters.');
      return { label, count: count(row[1], label), index: i };
    });
    if (!steps[0].count) throw new Error('The first step must have at least one user.');
    for (let i = 1; i < steps.length; i++)
      if (steps[i].count > steps[i - 1].count)
        throw new Error(
          'Step ' +
            (i + 1) +
            ' exceeds the previous step. Use counts from the same audience moving through ordered steps.'
        );
    const first = steps[0].count;
    steps.forEach((step, i) => {
      const previous = i ? steps[i - 1].count : null;
      step.overall = step.count / first;
      step.conversion =
        previous === null || previous === 0 ? null : step.count / previous;
      step.lost = previous === null ? null : previous - step.count;
      step.dropoff =
        previous === null || previous === 0 ? null : (previous - step.count) / previous;
    });
    const biggest = Math.max(...steps.slice(1).map((s) => s.lost));
    const largest = biggest > 0 ? steps.slice(1).filter((s) => s.lost === biggest) : [];
    const last = steps[steps.length - 1],
      recap =
        `Of ${number(first)} users at “${steps[0].label}”, ${number(last.count)} reached “${last.label}” (${percent(last.overall)} overall conversion).` +
        (largest.length
          ? '\nLargest numerical drop' +
            (largest.length > 1 ? ' (tied)' : '') +
            ': ' +
            largest
              .map(
                (s) =>
                  `${number(s.lost)} (${percent(s.dropoff)}) from “${steps[s.index - 1].label}” to “${s.label}”`
              )
              .join('; ') +
            '.'
          : '\nNo numerical drop is shown between the supplied steps.');
    return {
      mode: 'funnel',
      steps,
      largest,
      overall: last.overall,
      recap,
      visual: steps.map((s, i) => ({
        label: s.label,
        share: s.overall,
        value: `${number(s.count)} · ${percent(s.overall)} of start`,
        detail: i ? 'From previous: ' + percent(s.conversion) : 'Starting audience',
        loss: i ? `Lost ${number(s.lost)} · ${percent(s.dropoff)} drop-off` : '',
      })),
    };
  }
  function adoption(values) {
    const a = {
        eligible: count(values.eligibleA, 'Period A eligible users'),
        adopted: count(values.adoptedA, 'Period A adopted users'),
        label: String(values.labelA || 'Previous period').trim() || 'Previous period',
      },
      b = {
        eligible: count(values.eligibleB, 'Period B eligible users'),
        adopted: count(values.adoptedB, 'Period B adopted users'),
        label: String(values.labelB || 'Current period').trim() || 'Current period',
      };
    for (const p of [a, b]) {
      if (!p.eligible)
        throw new Error('Eligible users must be greater than zero in each period.');
      if (p.adopted > p.eligible)
        throw new Error('Adopted users cannot exceed eligible users.');
      if (p.label.length > 80)
        throw new Error('Period labels can use up to 80 characters.');
      p.rate = p.adopted / p.eligible;
    }
    const pp = (b.rate - a.rate) * 100,
      relative = a.rate === 0 ? null : (b.rate - a.rate) / a.rate;
    const recap = `Adoption in ${a.label}: ${percent(a.rate)} (${number(a.adopted)} of ${number(a.eligible)} eligible users).\nAdoption in ${b.label}: ${percent(b.rate)} (${number(b.adopted)} of ${number(b.eligible)} eligible users).\nChange: ${signed(pp)} percentage points. Relative change: ${relative === null ? 'not defined because the baseline adoption rate is 0%' : signed(relative * 100, '%')}.`;
    return {
      mode: 'adoption',
      a,
      b,
      pp,
      relative,
      recap,
      visual: [a, b].map((p) => ({
        label: p.label,
        share: p.rate,
        value: percent(p.rate) + ' adoption',
        detail: `${number(p.adopted)} / ${number(p.eligible)} eligible users`,
        loss: '',
      })),
    };
  }
  const api = { count, number, percent, signed, funnel, adoption };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FunnelMath = api;
})(typeof window !== 'undefined' ? window : globalThis);
