(function () {
  'use strict';
  let timer;
  function refresh() {
    clearTimeout(timer);
    const now = new Date(),
      message = window.DailySpark.forDate(now);
    const split = message.headline.lastIndexOf(' '),
      emphasis = document.createElement('span');
    emphasis.className = 'home-emphasis';
    emphasis.textContent = message.headline.slice(split + 1);
    document
      .getElementById('home-message')
      .replaceChildren(
        document.createTextNode(message.headline.slice(0, split + 1)),
        emphasis
      );
    document.getElementById('home-detail').textContent = message.detail;
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    timer = setTimeout(refresh, Math.max(1000, midnight.getTime() - now.getTime() + 100));
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refresh();
  });
  window.addEventListener('focus', refresh);
  document.querySelectorAll('[data-open-tool]').forEach((button) => {
    button.addEventListener('click', () => {
      window.AnalysisTabs.activate(button.dataset.openTool, { focusPanel: true });
    });
  });
  refresh();
})();
