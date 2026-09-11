/* ==========================================================================
   motion.js — word reveal, card tilt, cursor spotlight, counters

   Each initializer is independent and no-ops when its anchor is absent.
   ========================================================================== */

import {
  $, $$, clamp, prefersReducedMotion, rafThrottle, isFinePointer,
} from './util.js';

/* ---------- Hero word reveal ==========================================
   Splits on WORDS, never characters: per-character wrapping turns the
   heading into unreadable noise for screen readers. The accessible name
   is preserved via aria-label on the container.
   ======================================================================== */

export function initWordReveal(root = document) {
  const targets = $$('[data-split-words]', root);
  if (!targets.length) return;

  targets.forEach((el) => {
    const text = el.textContent.trim();
    if (!text) return;

    // Preserve the original string for assistive tech, then hide the
    // fragmented markup from it.
    el.setAttribute('aria-label', text);

    const words = text.split(/\s+/);
    const fragment = document.createDocumentFragment();

    words.forEach((word, i) => {
      const outer = document.createElement('span');
      outer.className = 'word';
      outer.setAttribute('aria-hidden', 'true');

      const inner = document.createElement('span');
      inner.className = 'word-inner';
      inner.textContent = word;
      inner.style.setProperty('--i', String(i));

      outer.appendChild(inner);
      fragment.appendChild(outer);

      if (i < words.length - 1) {
        fragment.appendChild(document.createTextNode(' '));
      }
    });

    el.textContent = '';
    el.appendChild(fragment);

    if (prefersReducedMotion()) {
      el.classList.add('words-in');
      return;
    }

    // Next frame, so the initial transform is painted before it animates.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add('words-in'));
    });
  });
}

/* ---------- Cursor spotlight on cards ---------- */

export function initSpotlight(root = document) {
  const cards = $$('.spotlight-card', root);
  if (!cards.length || !isFinePointer() || prefersReducedMotion()) return;

  cards.forEach((card) => {
    const onMove = rafThrottle((e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });

    card.addEventListener('pointermove', onMove, { passive: true });
  });
}

/* ---------- Tilt ======================================================
   Applied to .tilt-inner, which is a plain wrapper — never to the
   .glass-card itself. Transform-animating a backdrop-filter element
   recomposites the blur every frame and craters the framerate.
   ======================================================================== */

export function initTilt(root = document) {
  const wraps = $$('.tilt-wrap', root);
  if (!wraps.length || !isFinePointer() || prefersReducedMotion()) return;

  const MAX = 6; // degrees

  wraps.forEach((wrap) => {
    const inner = $('.tilt-inner', wrap);
    if (!inner) return;

    const onMove = rafThrottle((e) => {
      const rect = wrap.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      const ry = clamp((px - 0.5) * 2 * MAX, -MAX, MAX);
      const rx = clamp((0.5 - py) * 2 * MAX, -MAX, MAX);

      inner.style.setProperty('--tilt-y', `${ry}deg`);
      inner.style.setProperty('--tilt-x', `${rx}deg`);
    });

    wrap.addEventListener('pointermove', onMove, { passive: true });

    wrap.addEventListener('pointerleave', () => {
      inner.style.setProperty('--tilt-y', '0deg');
      inner.style.setProperty('--tilt-x', '0deg');
    });
  });
}

/* ---------- Counters ---------- */

export function initCounters(root = document) {
  const counters = $$('[data-count-to]', root);
  if (!counters.length) return;

  const render = (el, value, decimals) => {
    el.textContent = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const run = (el) => {
    const target = parseFloat(el.dataset.countTo);
    if (Number.isNaN(target)) return;

    const decimals = parseInt(el.dataset.countDecimals ?? '0', 10);
    const suffix = el.dataset.countSuffix ?? '';
    const duration = parseInt(el.dataset.countDuration ?? '1400', 10);

    const finish = () => {
      render(el, target, decimals);
      if (suffix) el.textContent += suffix;
    };

    if (prefersReducedMotion()) {
      finish();
      return;
    }

    const start = performance.now();

    const frame = (now) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

      render(el, target * eased, decimals);
      if (suffix) el.textContent += suffix;

      if (t < 1) requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  };

  if (!('IntersectionObserver' in window)) {
    counters.forEach(run);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => observer.observe(el));
}

/* ---------- Placeholder links ==========================================
   Links whose real URL isn't known yet. Marked in the markup with
   .is-placeholder; this suppresses navigation and explains why.
   ======================================================================== */

export function initPlaceholderLinks(root = document) {
  const links = $$('a.is-placeholder', root);
  if (!links.length) return;

  links.forEach((link) => {
    link.setAttribute('aria-disabled', 'true');
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const what = link.dataset.placeholderLabel || 'This link';
      window.dispatchEvent(
        new CustomEvent('app:toast', {
          detail: { message: `${what} isn't published yet.` },
        })
      );
    });
  });
}

export function init(root = document) {
  initWordReveal(root);
  initSpotlight(root);
  initTilt(root);
  initCounters(root);
  initPlaceholderLinks(root);
}
