(function () {
  'use strict';
  const fileDrag = (event) => [...(event.dataTransfer?.types || [])].includes('Files');
  // Avoid navigating away from unsaved work when a file misses its drop area.
  for (const type of ['dragover', 'drop'])
    window.addEventListener(type, (event) => {
      if (fileDrag(event)) event.preventDefault();
    });
  window.FileUploads = {
    bind(input, onFile, onError) {
      const zone = input.closest('[data-file-drop]');
      const filename = zone.querySelector('[data-upload-filename]');
      let depth = 0,
        selection = 0;
      function resetDrag() {
        depth = 0;
        zone.classList.remove('is-dragging');
      }
      async function select(files) {
        resetDrag();
        if (files.length !== 1) {
          const error = new Error('Choose one file at a time.');
          filename.textContent = error.message;
          onError(error);
          return;
        }
        const file = files[0],
          request = ++selection;
        filename.textContent = 'Selected: ' + file.name;
        zone.setAttribute('aria-busy', 'true');
        try {
          await onFile(file);
        } catch (error) {
          if (request === selection) onError(error);
        } finally {
          if (request === selection) {
            input.value = '';
            zone.removeAttribute('aria-busy');
          }
        }
      }
      input.addEventListener('change', () => {
        if (input.files.length) select([...input.files]);
      });
      zone.addEventListener('dragenter', (event) => {
        if (!fileDrag(event)) return;
        event.preventDefault();
        depth++;
        zone.classList.add('is-dragging');
      });
      zone.addEventListener('dragover', (event) => {
        if (!fileDrag(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      });
      zone.addEventListener('dragleave', (event) => {
        event.preventDefault();
        if (--depth <= 0) resetDrag();
      });
      zone.addEventListener('drop', (event) => {
        if (!fileDrag(event)) return;
        event.preventDefault();
        event.stopPropagation();
        resetDrag();
        if (!event.dataTransfer.files.length) {
          onError(new Error('Drop a file, not a folder.'));
          return;
        }
        select([...event.dataTransfer.files]);
      });
      window.addEventListener('dragend', resetDrag);
      window.addEventListener('drop', resetDrag);
      window.addEventListener('blur', resetDrag);
    },
  };
})();
