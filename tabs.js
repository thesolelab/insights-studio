(function () {
  'use strict';
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function activate(tab) {
    for (const item of tabs) {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    }
    document.body.classList.toggle('home-active', tab.id === 'home-tab');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  window.AnalysisTabs = {
    activate(id, { focusPanel = false } = {}) {
      const tab = tabs.find((item) => item.id === id);
      if (!tab) return;
      activate(tab);
      if (focusPanel) {
        const panel = document.getElementById(tab.getAttribute('aria-controls'));
        panel.focus({ preventScroll: true });
      }
    },
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
      if (event.key === 'ArrowLeft') next = tabs[(index + tabs.length - 1) % tabs.length];
      if (event.key === 'Home') next = tabs[0];
      if (event.key === 'End') next = tabs[tabs.length - 1];
      if (!next) return;
      event.preventDefault();
      activate(next);
      next.focus();
    });
  });
})();
