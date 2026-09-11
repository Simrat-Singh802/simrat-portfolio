/* ==========================================================================
   reveal.js — scroll-reveal engine

   One IntersectionObserver for the whole page. Toggles exactly one class
   (.is-revealed) and sets --i for stagger; all timing lives in CSS.

   Content must NEVER be left invisible, so there are three safety nets:
     1. Elements already in view at load are revealed immediately.
     2. A 3s timeout force-reveals everything still pending.
     3. No IntersectionObserver support → reveal all, synchronously.
   ========================================================================== */

import { $$, prefersReducedMotion, setStaggerIndex } from './util.js';

const REVEALED = 'is-revealed';
const SAFETY_TIMEOUT = 3000;

function revealAll(elements) {
  elements.forEach((el) => el.classList.add(REVEALED));
}

export function init(root = document) {
  const targets = $$('[data-reveal]', root);
  if (!targets.length) return;

  // Stagger children within each declared group.
  $$('[data-reveal-group]', root).forEach((group) => {
    const children = $$('[data-reveal]', group).filter(
      (child) => child.closest('[data-reveal-group]') === group
    );
    setStaggerIndex(children);
  });

  // Motion off, or no observer support: show everything now.
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    revealAll(targets);
    return;
  }

  const pending = new Set(targets);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add(REVEALED);
        pending.delete(entry.target);
        observer.unobserve(entry.target);
      });
    },
    {
      // Fires slightly before the element reaches the viewport bottom.
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.15,
    }
  );

  targets.forEach((el) => {
    // Anything already on screen (above the fold, or a short page that
    // can't scroll) would never trigger the observer — reveal it now.
    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight * 0.92 && rect.bottom > 0;

    if (inView) {
      el.classList.add(REVEALED);
      pending.delete(el);
      return;
    }
    observer.observe(el);
  });

  // Last-resort net: nothing stays hidden longer than SAFETY_TIMEOUT.
  window.setTimeout(() => {
    if (!pending.size) return;
    revealAll(Array.from(pending));
    pending.forEach((el) => observer.unobserve(el));
    pending.clear();
  }, SAFETY_TIMEOUT);
}
