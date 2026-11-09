(function () {
  'use strict';
  const sources = {
    zip: {
      url: 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
      integrity: 'sha384-+mbV2IY1Zk/X1p/nWllGySJSUN8uMs+gUAN10Or95UBH0fpj6GfKgPmgC5EXieXG',
    },
    excel: {
      url: 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js',
      integrity: 'sha384-EnyY0/GSHQGSxSgMwaIPzSESbqoOLSexfnSMN2AP+39Ckmn92stwABZynq1JyzdT',
    },
    powerpoint: {
      url: 'https://cdn.jsdelivr.net/npm/pptxgenjs@4.0.1/dist/pptxgen.bundle.js',
      integrity: 'sha384-qb0Xhi7LLYpvW1HCK6oMrmDLSY9sy7vwm6ZlV6KjtrlL9yg30+YN4neTwnmX+Kp8',
    },
  };
  const loaded = new Map();
  window.UtilityLibraries = {
    async load(name) {
      const globals = { excel: 'XLSX', powerpoint: 'PptxGenJS', zip: 'JSZip' };
      if (globals[name] && window[globals[name]]) return window[globals[name]];
      if (loaded.has(name)) return loaded.get(name);
      const source = sources[name];
      if (!source) throw new Error('Unknown library.');
      const promise = (async () => {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = source.url;
          script.integrity = source.integrity;
          script.crossOrigin = 'anonymous';
          const timeout = setTimeout(failed, 30000);
          function failed() {
            clearTimeout(timeout);
            script.remove();
            reject(new Error('Unable to load ' + name + '. Check your connection and try again.'));
          }
          script.onerror = failed;
          script.onload = () => {
            clearTimeout(timeout);
            if (!window[globals[name]]) failed();
            else resolve(window[globals[name]]);
          };
          document.head.append(script);
        });
      })().catch((error) => {
        loaded.delete(name);
        throw error;
      });
      loaded.set(name, promise);
      return promise;
    },
  };
})();
