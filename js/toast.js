/* ==========================================================================
   toast.js — transient status messages

   The .toast element existed in the markup with no styles and nothing
   ever showing it. This wires it up and listens for an 'app:toast' event
   so any module can raise one without importing this file.
   ========================================================================== */

import { $ } from './util.js';

const VISIBLE = 'is-visible';
const DURATION = 3200;

export function init() {
  const toast = $('#toast');
  if (!toast) return;

  // Announce politely — it's status, not an alert.
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  let timer = null;

  function show(message) {
    if (!message) return;

    toast.textContent = message;
    toast.classList.add(VISIBLE);

    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => toast.classList.remove(VISIBLE), DURATION);
  }

  window.addEventListener('app:toast', (e) => show(e.detail?.message));
}
