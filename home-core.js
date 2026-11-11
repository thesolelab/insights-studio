(function (root) {
  'use strict';
  // Original, curated messages; no attribution or network request is needed.
  const messages = [
    [
      'Make room for the work that matters.',
      'One useful step is enough to build momentum.',
    ],
    ['Start small. Keep moving.', 'Progress grows from the next practical step.'],
    ['Give your attention a clear direction.', 'Choose one thing worth finishing today.'],
    ['Make the next step easier.', 'A little preparation can clear a lot of friction.'],
    ['Your pace can still be progress.', 'Steady effort counts, even on a busy day.'],
    ['Clear a little space to think.', 'A calmer start can lead to better work.'],
    ['Useful beats complicated.', 'Look for the simplest way to move things forward.'],
    ['Begin with what you have.', 'You can make the next version better as you go.'],
    [
      'A focused hour can change the day.',
      'Give one meaningful task some uninterrupted room.',
    ],
    [
      'Leave things a little clearer.',
      'A helpful note or clean handoff can make a difference.',
    ],
    [
      'Build momentum, not pressure.',
      'Choose a step that feels manageable and worthwhile.',
    ],
    [
      'Make time for a better question.',
      'Clarity often starts with a moment of curiosity.',
    ],
    ['Small improvements add up.', 'One less repetitive step is time you get back.'],
    [
      'Let the tools carry the busywork.',
      'Save your energy for the decisions that need you.',
    ],
    [
      'Keep the important thing in view.',
      'A clear purpose makes the next choice easier.',
    ],
    ['You can simplify the next step.', 'Less friction leaves more room for good work.'],
    [
      'Take a breath. Find your starting point.',
      'You do not have to solve everything at once.',
    ],
    [
      'Give good ideas a little room.',
      'A short pause can help the right approach emerge.',
    ],
    ['Finish one useful thing.', 'A small completed step is something to build on.'],
    ['Keep learning as you go.', 'A thoughtful adjustment is progress too.'],
    [
      'Make the handoff a little smoother.',
      'Clear information helps everyone move forward.',
    ],
    ['There is value in steady work.', 'Consistency does not have to look dramatic.'],
    ['Choose clarity over clutter.', 'Keep what helps and give the rest less attention.'],
    [
      'Move one good idea into action.',
      'A rough first step can be enough to get started.',
    ],
    [
      'Make today a little easier.',
      'A useful shortcut can free you for something better.',
    ],
    [
      'Protect a moment for your priorities.',
      'Your attention deserves a deliberate destination.',
    ],
    [
      'Notice what is already working.',
      'Build on a small success instead of starting over.',
    ],
    ['Leave room to recharge.', 'Rest can be part of making tomorrow work better.'],
    [
      'Turn a little effort into something useful.',
      'A clear result does not need a complicated process.',
    ],
    [
      'Work with intention, one step at a time.',
      'Pick the next thing you can make clearer or easier.',
    ],
    [
      'Make space for a fresh perspective.',
      'A different angle can reveal a simpler path.',
    ],
  ];
  function forDate(date = new Date()) {
    if (!(date instanceof Date) || !Number.isFinite(date.getTime()))
      throw new Error('Use a valid date.');
    // Calendar components avoid elapsed-hour and daylight-saving drift.
    const day = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
    const epoch = Date.UTC(2026, 10, 11) / 86400000;
    const index = (((day - epoch) % messages.length) + messages.length) % messages.length;
    return { headline: messages[index][0], detail: messages[index][1] };
  }
  const api = { forDate };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DailySpark = api;
})(typeof window !== 'undefined' ? window : globalThis);
