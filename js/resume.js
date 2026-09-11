/* ==========================================================================
   resume.js — local PDF preview sandbox

   Fixes carried over from the original:
     • the previous object URL is revoked before a new one is created
       (the original leaked one per file)
     • feedback uses state classes instead of inline style assignments
     • the dropzone is a real <button> in the markup, so keyboard
       activation needs no extra wiring
   ========================================================================== */

import { $, escapeHTML } from './util.js';

export function init() {
  const dropzone = $('#dropzone');
  const input = $('#resumeInput');
  const feedback = $('#pdfFeedback');

  if (!dropzone || !input || !feedback) return;

  let activeUrl = null;

  function releaseUrl() {
    if (activeUrl) {
      URL.revokeObjectURL(activeUrl);
      activeUrl = null;
    }
  }

  function fail(message) {
    releaseUrl();
    feedback.hidden = false;
    feedback.dataset.state = 'error';
    feedback.textContent = message;
  }

  function handleFile(file) {
    if (!file) return;

    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      fail('Not a PDF. Please choose a .pdf file.');
      return;
    }

    // Revoke the previous URL before minting a new one.
    releaseUrl();
    activeUrl = URL.createObjectURL(file);

    const sizeKB = (file.size / 1024).toFixed(1);

    feedback.hidden = false;
    feedback.dataset.state = 'success';
    feedback.innerHTML =
      `<strong>Loaded:</strong> ${escapeHTML(file.name)} (${sizeKB} KB)<br>` +
      `<a href="${activeUrl}" target="_blank" rel="noopener noreferrer">` +
      `Open preview in a new tab →</a>`;
  }

  dropzone.addEventListener('click', () => input.click());

  ['dragenter', 'dragover'].forEach((name) => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'dragend'].forEach((name) => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('dragover');
    handleFile(e.dataTransfer?.files?.[0]);
  });

  input.addEventListener('change', (e) => {
    handleFile(e.target.files?.[0]);
    // Allow re-selecting the same file.
    e.target.value = '';
  });

  // Don't leak the blob across a navigation.
  window.addEventListener('pagehide', releaseUrl);
}
