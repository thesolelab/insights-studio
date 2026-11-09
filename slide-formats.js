(function (root) {
  'use strict';
  const formats = [
    {
      id: 'recommendation',
      name: 'Recommendation + three reasons',
      topics: ['decision'],
      why: 'Makes the proposed action clear, then gives the audience three supporting reasons.',
      layout: 'cards',
      structure: [
        'Top: one clear recommendation',
        'Middle: three supporting reasons',
        'Bottom: requested decision or next step',
      ],
    },
    {
      id: 'comparison',
      name: 'Side-by-side comparison',
      topics: ['compare'],
      why: 'Makes differences between two choices easy to scan without switching slides.',
      layout: 'split',
      structure: [
        'Top: the comparison question',
        'Left and right: the same criteria for each option',
        'Bottom: the meaningful difference',
      ],
    },
    {
      id: 'matrix',
      name: 'Options comparison matrix',
      topics: ['compare', 'decision'],
      why: 'Works when the audience needs to assess several options against consistent criteria.',
      layout: 'matrix',
      structure: [
        'Columns: options',
        'Rows: three to five decision criteria',
        'Bottom: recommended option and trade-off',
      ],
    },
    {
      id: 'trend',
      name: 'Trend chart + takeaway',
      topics: ['trend', 'metrics'],
      why: 'Shows how a metric changed over time, with the key interpretation next to the chart.',
      layout: 'chart',
      structure: [
        'Top: the message the trend supports',
        'Main area: line or column chart over time',
        'Side: one takeaway and an important caveat',
      ],
    },
    {
      id: 'before-after',
      name: 'Before → after',
      topics: ['change', 'compare'],
      why: 'Makes an improvement, change, or transformation tangible.',
      layout: 'split',
      structure: [
        'Left: original state or baseline',
        'Right: new state or target',
        'Bottom: what changed and why it matters',
      ],
    },
    {
      id: 'timeline',
      name: 'Timeline or roadmap',
      topics: ['process', 'change'],
      why: 'Explains a sequence of milestones and what comes next.',
      layout: 'timeline',
      structure: [
        'Top: destination or objective',
        'Middle: three to five milestones in order',
        'Bottom: next milestone, owner, or dependency',
      ],
    },
    {
      id: 'process',
      name: 'Three-step process',
      topics: ['process'],
      why: 'Breaks a workflow or approach into a small number of understandable steps.',
      layout: 'timeline',
      structure: [
        'Top: outcome the process delivers',
        'Middle: three numbered steps with short labels',
        'Bottom: handoffs or success criteria',
      ],
    },
    {
      id: 'scorecard',
      name: 'KPI scorecard',
      topics: ['metrics'],
      why: 'Provides a quick status view when several measures support the same message.',
      layout: 'cards',
      structure: [
        'Top: overall performance statement',
        'Middle: three to four metrics with baselines or targets',
        'Bottom: interpretation and action',
      ],
    },
    {
      id: 'bridge',
      name: 'What changed / why / next',
      topics: ['change', 'cause'],
      why: 'Connects a result to its explanation and the response it calls for.',
      layout: 'cards',
      structure: [
        'Left: what changed',
        'Middle: evidence explaining why',
        'Right: the response or next step',
      ],
    },
    {
      id: 'drivers',
      name: 'Result + contributing drivers',
      topics: ['cause', 'metrics'],
      why: 'Separates the headline result from the factors that explain it.',
      layout: 'chart',
      structure: [
        'Top: observed result',
        'Main area: contribution chart or ranked drivers',
        'Side: implications and limits of the evidence',
      ],
    },
    {
      id: 'problem',
      name: 'Problem → insight → action',
      topics: ['cause', 'decision'],
      why: 'Creates a short argument that ends with a practical response.',
      layout: 'cards',
      structure: [
        'Left: the problem and its consequence',
        'Middle: the insight or supporting evidence',
        'Right: the action you propose',
      ],
    },
    {
      id: 'impact',
      name: 'Impact versus effort grid',
      topics: ['decision'],
      why: 'Helps prioritize ideas when expected benefit and effort are the deciding factors.',
      layout: 'matrix',
      structure: [
        'Axes: impact and effort, clearly defined',
        'Main area: options placed on the grid',
        'Bottom: priority choice and its assumptions',
      ],
    },
    {
      id: 'story',
      name: 'Headline + evidence + implication',
      topics: ['general'],
      why: 'A flexible structure for one central message supported by evidence.',
      layout: 'chart',
      structure: [
        'Top: one-sentence message',
        'Main area: the strongest supporting evidence',
        'Side or bottom: why the audience should care',
      ],
    },
    {
      id: 'pyramid',
      name: 'One message, three supporting points',
      topics: ['general'],
      why: 'Keeps an explanatory slide focused while giving it a clear hierarchy.',
      layout: 'cards',
      structure: [
        'Top: the main message',
        'Middle: three distinct supporting points',
        'Bottom: conclusion or next step',
      ],
    },
    {
      id: 'summary',
      name: 'Executive summary',
      topics: ['general', 'decision'],
      why: 'Gives a busy audience the conclusion, evidence, and requested response in one view.',
      layout: 'split',
      structure: [
        'Left: conclusion and context',
        'Right: key evidence or trade-offs',
        'Bottom: requested action',
      ],
    },
  ];
  const rules = {
    compare:
      /\b(compar\w*|versus|vs\.?|options?|alternatives?|vendors?|competitors?|choos\w*|differences?)\b/i,
    trend:
      /\b(trends?|over time|month\w*|quarter\w*|year\w*|growth|declin\w*|histor\w*|performance)\b/i,
    change:
      /\b(before|after|improv\w*|transform\w*|chang\w*|shift\w*|new approach|current state|future state)\b/i,
    process:
      /\b(process\w*|steps?|roadmap|timeline|milestones?|launch\w*|schedule|rollout|workflow|phases?|plan\w*)\b/i,
    metrics:
      /\b(metrics?|kpis?|numbers?|results?|revenue|conversion|sales|roi|budget|costs?|spend|performance|targets?)\b/i,
    cause: /\b(why|caus\w*|drivers?|explain\w*|reason\w*|problem\w*|root cause|underperform\w*)\b/i,
    decision:
      /\b(recommend\w*|decid\w*|decision\w*|approv\w*|prioriti\w*|propos\w*|invest\w*|persuad\w*|convinc\w*|should|choos\w*)\b/i,
  };
  function suggest(brief) {
    brief = String(brief || '').trim();
    if (brief.length < 15)
      throw new Error(
        'Describe the message you want your audience to understand (at least 15 characters).'
      );
    if (brief.length > 5000) throw new Error('Keep the brief under 5,001 characters.');
    const matched = Object.keys(rules).filter((topic) => rules[topic].test(brief));
    const topics = matched.length ? matched : ['general'];
    return formats
      .map((format, index) => ({
        ...format,
        score:
          format.topics.reduce((n, t) => n + (topics.includes(t) ? 3 : 0), 0) +
          (format.topics.includes('general') ? 1 : 0),
        index,
      }))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, 5);
  }
  if (typeof module === 'object' && module.exports) {
    module.exports = { suggest };
    return;
  }
  root.SlideFormats = { suggest };
  const $ = (id) => document.getElementById('slide-' + id);
  function el(tag, text, cls) {
    const node = document.createElement(tag);
    node.textContent = text;
    if (cls) node.className = cls;
    return node;
  }
  let suggestions = [];
  $('brief').addEventListener('input', () => {
    $('results').replaceChildren();
    $('manual-copy').hidden = true;
    $('manual-copy').value = '';
    suggestions = [];
    $('status').textContent = 'Brief changed. Get recommendations again.';
  });
  $('form').addEventListener('submit', (event) => {
    event.preventDefault();
    $('results').replaceChildren();
    try {
      suggestions = suggest($('brief').value);
      suggestions.forEach((item, index) => {
        const card = el('article', '', 'slide-format-card');
        card.append(
          el('span', index === 0 ? 'Best match' : 'Alternative ' + index, 'slide-format-label'),
          el('h3', item.name)
        );
        const sketch = el('div', '', 'slide-wireframe');
        sketch.classList.add('wireframe-' + item.layout);
        sketch.setAttribute('aria-hidden', 'true');
        sketch.append(el('div', 'Headline', 'wireframe-title'));
        const blocks =
          item.layout === 'split'
            ? ['Option / state A', 'Option / state B']
            : item.layout === 'timeline'
              ? ['1 · Start', '2 · Develop', '3 · Deliver']
              : item.layout === 'matrix'
                ? ['Criteria', 'Option A', 'Option B', 'Evidence', 'Evidence', 'Evidence']
                : item.layout === 'chart'
                  ? ['Chart / evidence', 'Key takeaway']
                  : ['Point 1', 'Point 2', 'Point 3'];
        blocks.forEach((label) => sketch.append(el('div', label, 'wireframe-block')));
        card.append(sketch, el('p', item.why));
        const list = el('ul', '');
        item.structure.forEach((line) => list.append(el('li', line)));
        card.append(list);
        const copy = el('button', 'Copy this outline', 'slide-copy');
        copy.type = 'button';
        copy.addEventListener('click', async () => {
          const text =
            item.name +
            '\n\nMessage: ' +
            $('brief').value.trim() +
            '\n\n' +
            item.structure.map((line) => '• ' + line).join('\n');
          try {
            await navigator.clipboard.writeText(text);
            $('status').textContent = 'Slide outline copied.';
          } catch (error) {
            $('manual-copy').value = text;
            $('manual-copy').hidden = false;
            $('manual-copy').focus();
            $('manual-copy').select();
            $('status').textContent = 'Clipboard unavailable. Copy the selected outline manually.';
          }
        });
        card.append(copy);
        $('results').append(card);
      });
      $('status').setAttribute('role', 'status');
      $('status').textContent =
        'Five formats to consider. Choose based on the evidence you have and the audience’s needs.';
    } catch (error) {
      $('status').setAttribute('role', 'alert');
      $('status').textContent = error.message;
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
