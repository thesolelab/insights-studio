(function () {
  'use strict';
  // One lazy request per library across all tools. Keep URLs and SRI together.
  const sources = {
    excel: {
      src: 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js',
      integrity:
        'sha384-EnyY0/GSHQGSxSgMwaIPzSESbqoOLSexfnSMN2AP+39Ckmn92stwABZynq1JyzdT',
      ready: () => window.XLSX,
    },
    powerpoint: {
      src: 'https://cdn.jsdelivr.net/npm/pptxgenjs@4.0.1/dist/pptxgen.bundle.js',
      integrity:
        'sha384-qb0Xhi7LLYpvW1HCK6oMrmDLSY9sy7vwm6ZlV6KjtrlL9yg30+YN4neTwnmX+Kp8',
      ready: () => window.PptxGenJS && window.JSZip && window.PptxGenJS,
    },
  };
  const pending = new Map();
  window.ToolLibraries = {
    load(name) {
      if (!Object.hasOwn(sources, name))
        return Promise.reject(new Error('Unknown library.'));
      if (pending.has(name)) return pending.get(name);
      const source = sources[name];
      if (source.ready()) return Promise.resolve(source.ready());
      const promise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = source.src;
        script.integrity = source.integrity;
        script.crossOrigin = 'anonymous';
        const timer = setTimeout(failed, 30000);
        function cleanup() {
          clearTimeout(timer);
          script.onload = script.onerror = null;
        }
        function failed() {
          cleanup();
          script.remove();
          pending.delete(name);
          reject(
            new Error(
              'Unable to load the ' + name + ' tool. Check your connection and try again.'
            )
          );
        }
        script.onload = () => {
          if (!source.ready()) {
            failed();
            return;
          }
          cleanup();
          resolve(source.ready());
        };
        script.onerror = failed;
        document.head.appendChild(script);
      });
      pending.set(name, promise);
      return promise;
    },
  };
})();
