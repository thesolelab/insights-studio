(function () {
  'use strict';
  window.VisualTools = {
    mount(root, U) {
      const { el, panel, form, field, select, submit, button, actions } = U,
        K = window.UtilityCore;
      const editor = panel(
        root,
        'Image studio',
        'Resize, compress, convert, and remove a solid-color background. Transparent PNG/WebP exports preserve cutouts. Background removal uses color tolerance, not subject recognition.'
      );
      U.command(
        'Resize compress convert image remove solid background PNG JPG WebP',
        'visuals',
        editor
      );
      const file = field(
        editor,
        'Upload PNG, JPEG, or WebP (up to 10 MB)',
        'image',
        'file',
        '',
        false
      );
      file.accept = 'image/png,image/jpeg,image/webp';
      const preview = el('div', null, { class: 'visual-preview' }),
        canvas = el('canvas', null, { 'aria-label': 'Image preview', role: 'img' });
      preview.append(canvas);
      preview.hidden = true;
      editor.append(preview);
      let original = null,
        output = null,
        version = 0,
        loadedName = 'image';
      const f = form(editor, 'Output settings', async (data) => {
        if (!original) throw new Error('Upload an image first.');
        const request = ++version;
        let width = Number(data.width),
          height = Number(data.height);
        if (
          !Number.isInteger(width) ||
          !Number.isInteger(height) ||
          width < 1 ||
          height < 1 ||
          width > 8192 ||
          height > 8192 ||
          width * height > 32000000
        )
          throw new Error('Use whole dimensions from 1–8,192 px, with at most 32 million pixels.');
        if (lock.checked) {
          height = Math.round((width * original.height) / original.width);
          heightInput.value = height;
          if (height < 1 || height > 8192 || width * height > 32000000)
            throw new Error('Locked dimensions exceed the supported size.');
        }
        const c = document.createElement('canvas');
        c.width = width;
        c.height = height;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(original, 0, 0, width, height);
        if (remove.checked) {
          const pixels = ctx.getImageData(0, 0, width, height),
            color = window.ChartColors.normalize(data.background);
          if (!color) throw new Error('Choose a valid background color.');
          const rgb = color
              .slice(1)
              .match(/../g)
              .map((s) => parseInt(s, 16)),
            tolerance = Number(data.tolerance);
          if (tolerance < 0 || tolerance > 150) throw new Error('Use tolerance from 0 to 150.');
          const threshold = tolerance * tolerance;
          for (let i = 0; i < pixels.data.length; i += 4) {
            const red = pixels.data[i] - rgb[0];
            const green = pixels.data[i + 1] - rgb[1];
            const blue = pixels.data[i + 2] - rgb[2];
            if (red * red + green * green + blue * blue <= threshold) pixels.data[i + 3] = 0;
          }
          ctx.putImageData(pixels, 0, 0);
        }
        if (data.format === 'image/jpeg') {
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.globalCompositeOperation = 'source-over';
        }
        const quality = Number(data.quality);
        if (quality < 0.1 || quality > 1) throw new Error('Use quality from 0.1 to 1.');
        const blob = await new Promise((resolve) => c.toBlob(resolve, data.format, quality));
        if (!blob) throw new Error('Unable to encode this format.');
        if (request !== version) return;
        output = { blob, width, height, type: blob.type };
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(c, 0, 0);
        download.disabled = deck.disabled = false;
        info.textContent = `${width} × ${height} px · ${(blob.size / 1024).toFixed(1)} KB · ${blob.type}`;
        U.message('Image ready.');
      });
      const widthInput = field(f, 'Width (px)', 'width', 'number', '1200'),
        heightInput = field(f, 'Height (px)', 'height', 'number', '675');
      const preset = select(f, 'Export size', 'preset', [
        ['custom', 'Custom'],
        ['slide', 'Slide · 1920 × 1080'],
        ['square', 'Square · 1080 × 1080'],
        ['wide', 'Wide · 1200 × 630'],
      ]);
      const lockLabel = el('label', null, { class: 'console-check' }),
        lock = el('input', null, { type: 'checkbox' });
      lock.checked = true;
      lockLabel.append(lock, document.createTextNode('Keep aspect ratio (width controls height)'));
      f.append(lockLabel);
      preset.addEventListener('change', () => {
        const sizes = { slide: [1920, 1080], square: [1080, 1080], wide: [1200, 630] };
        if (sizes[preset.value]) {
          [widthInput.value, heightInput.value] = sizes[preset.value];
          lock.checked = false;
        }
      });
      select(f, 'File format', 'format', [
        ['image/png', 'PNG · lossless / transparent'],
        ['image/jpeg', 'JPEG · white background'],
        ['image/webp', 'WebP · compression / transparency'],
      ]);
      field(f, 'JPEG/WebP quality (0.1–1)', 'quality', 'number', '0.85');
      const removeLabel = el('label', null, { class: 'console-check' }),
        remove = el('input', null, { type: 'checkbox' });
      removeLabel.append(remove, document.createTextNode('Remove matching background color'));
      f.append(removeLabel);
      field(f, 'Background color', 'background', 'color', '#ffffff');
      field(f, 'Color tolerance (0–150)', 'tolerance', 'number', '30');
      submit(f, 'Apply image settings');
      const info = el('p', 'Upload an image to begin.', { class: 'note' });
      editor.append(info);
      const download = button('Download image', () => {
          if (!output) throw new Error('Apply settings first.');
          const extension =
            output.type === 'image/jpeg' ? 'jpg' : output.type === 'image/webp' ? 'webp' : 'png';
          U.download(output.blob, loadedName + '.' + extension);
        }),
        deck = button('Add image to deck', async () => {
          if (!output) throw new Error('Apply settings first.');
          if (output.type === 'image/webp')
            throw new Error(
              'Choose PNG or JPEG for PowerPoint compatibility, then apply settings again.'
            );
          const snapshot = output;
          const data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Unable to read image output.'));
            reader.readAsDataURL(snapshot.blob);
          });
          U.addSlide({
            type: 'image',
            title: loadedName,
            data,
            width: snapshot.width,
            height: snapshot.height,
          });
        });
      download.disabled = deck.disabled = true;
      actions(editor, download, deck);
      function invalidate() {
        version++;
        output = null;
        download.disabled = deck.disabled = true;
        info.textContent = original
          ? 'Settings changed. Apply settings to refresh the output.'
          : 'Upload an image to begin.';
      }
      f.addEventListener('input', invalidate);
      f.addEventListener('change', invalidate);
      file.addEventListener('change', () =>
        U.safe(async () => {
          const selected = file.files[0];
          if (!selected) return;
          invalidate();
          U.fileLimit(selected, 10);
          if (!['image/png', 'image/jpeg', 'image/webp'].includes(selected.type))
            throw new Error('Use PNG, JPEG, or WebP.');
          const request = ++version,
            bitmap = await createImageBitmap(selected);
          if (request !== version) {
            bitmap.close();
            return;
          }
          if (bitmap.width * bitmap.height > 32000000) {
            bitmap.close();
            throw new Error('Source image exceeds 32 million pixels.');
          }
          original?.close();
          original = bitmap;
          preview.hidden = false;
          loadedName = selected.name.replace(/\.[^.]+$/, '');
          widthInput.value = bitmap.width;
          heightInput.value = bitmap.height;
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          canvas.getContext('2d').drawImage(bitmap, 0, 0);
          output = null;
          download.disabled = deck.disabled = true;
          info.textContent = `Original: ${bitmap.width} × ${bitmap.height} px · ${(selected.size / 1024).toFixed(1)} KB. Apply settings to create output.`;
        })
      );
      const colors = panel(
        root,
        'Color picker & contrast',
        'Pick colors with HEX or the color wheel. WCAG contrast: 4.5:1 for normal text and 3:1 for large text (AA).'
      );
      U.command('Color picker HEX wheel contrast accessibility', 'visuals', colors);
      let foreground = '#F2F5F9',
        background = '#151A22';
      const sample = el('div', 'Readable text preview', { class: 'contrast-preview' }),
        ratio = el('p', '', { role: 'status' });
      const fg = window.ChartColors.control(
          'Foreground',
          foreground,
          (color) => {
            foreground = color;
            update();
          },
          'Foreground color'
        ),
        bg = window.ChartColors.control(
          'Background',
          background,
          (color) => {
            background = color;
            update();
          },
          'Background color'
        );
      colors.append(fg.element, bg.element, sample, ratio);
      function update() {
        const value = K.contrast(foreground, background);
        sample.style.color = foreground;
        sample.style.backgroundColor = background;
        ratio.textContent =
          value.toFixed(2) +
          ':1 · Normal text AA: ' +
          (value >= 4.5 ? 'Pass' : 'Fail') +
          ' · Large text AA: ' +
          (value >= 3 ? 'Pass' : 'Fail') +
          ' · Normal text AAA: ' +
          (value >= 7 ? 'Pass' : 'Fail');
      }
      update();
      const batch = panel(
        root,
        'Batch resize & consistent exports',
        'Convert multiple PNG/JPEG/WebP images into a ZIP of consistently sized visuals. Images fit inside the target canvas without stretching; PNG letterboxing is transparent. Up to 20 images, 10 MB each.'
      );
      U.command('Batch resize compress images consistent export sizes', 'visuals', batch);
      const bf = form(batch, '', async (data) => {
        const selected = [...batchFiles.files];
        if (!selected.length || selected.length > 20) throw new Error('Choose 1–20 images.');
        const width = Number(data.width),
          height = Number(data.height);
        if (
          !Number.isInteger(width) ||
          !Number.isInteger(height) ||
          width < 1 ||
          height < 1 ||
          width > 4096 ||
          height > 4096
        )
          throw new Error('Use whole dimensions from 1–4,096 px.');
        if (width * height * selected.length > 64000000)
          throw new Error(
            'Batch output is limited to 64 million total pixels. Use smaller dimensions or fewer images.'
          );
        const Zip = await U.libs.load('zip'),
          zip = new Zip();
        for (let i = 0; i < selected.length; i++) {
          const file = selected[i];
          U.fileLimit(file, 10);
          if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
            throw new Error('Batch conversion supports PNG, JPEG, and WebP.');
          const image = await createImageBitmap(file);
          try {
            if (image.width * image.height > 32000000)
              throw new Error('Source image exceeds 32 million pixels.');
            const c = document.createElement('canvas');
            c.width = width;
            c.height = height;
            const ctx = c.getContext('2d');
            if (data.format === 'image/jpeg') {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, width, height);
            }
            const scale = Math.min(width / image.width, height / image.height),
              w = image.width * scale,
              h = image.height * scale;
            ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
            const blob = await new Promise((resolve) => c.toBlob(resolve, data.format, 0.85));
            if (!blob) throw new Error('Image encoding failed.');
            zip.file(
              String(i + 1).padStart(3, '0') +
                '-' +
                file.name.replace(/\.[^.]+$/, '').replace(/[^\w-]/g, '-') +
                (data.format === 'image/png' ? '.png' : '.jpg'),
              await blob.arrayBuffer()
            );
          } finally {
            image.close();
          }
        }
        U.download(
          await zip.generateAsync({ type: 'blob' }),
          'stat-console-visuals.zip',
          'application/zip'
        );
        U.message('Batch image ZIP downloaded.');
      });
      const batchFiles = field(bf, 'Images', 'images', 'file', '', true);
      batchFiles.multiple = true;
      batchFiles.accept = 'image/png,image/jpeg,image/webp';
      field(bf, 'Canvas width', 'width', 'number', '1920');
      field(bf, 'Canvas height', 'height', 'number', '1080');
      select(bf, 'Output', 'format', [
        ['image/png', 'PNG'],
        ['image/jpeg', 'JPEG'],
      ]);
      submit(bf, 'Download image ZIP');
    },
  };
})();
