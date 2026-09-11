/* ==========================================================================
   util.js — shared helpers
   ========================================================================== */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/** Live-evaluated so an OS-level change mid-session is respected. */
export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isFinePointer = () =>
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/**
 * Escapes text for safe interpolation into innerHTML.
 * Used on every field that comes back from the GitHub API.
 */
export function escapeHTML(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Coalesces bursty events (pointermove, scroll) to one call per frame. */
export function rafThrottle(fn) {
  let queued = false;
  let lastArgs;

  return function throttled(...args) {
    lastArgs = args;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      fn.apply(this, lastArgs);
    });
  };
}

/** Assigns --i to each element for CSS-driven stagger. */
export function setStaggerIndex(elements, start = 0) {
  elements.forEach((el, i) => el.style.setProperty('--i', String(i + start)));
}
