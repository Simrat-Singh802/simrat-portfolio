/* ==========================================================================
   nav.js — active link, scroll state, mobile drawer

   The active link is DERIVED from the URL, never hard-coded in markup.
   That is what keeps the nav block byte-identical across all five pages
   and stops the variant drift that broke about/contact.
   ========================================================================== */

import { $, $$, setStaggerIndex } from './util.js';

const MOBILE_QUERY = '(max-width: 768px)';

/* ---------- Active link ---------- */

function markActiveLink(nav) {
  // "" and "/" both mean index.html.
  const file = window.location.pathname.split('/').pop() || 'index.html';
  const current = file === '' ? 'index.html' : file;

  $$('.nav-item', nav).forEach((link) => {
    const target = link.getAttribute('href');
    if (target === current) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

/* ---------- Scroll state ---------- */

function initScrollState(nav) {
  const sentinel = $('.nav-sentinel');

  // Sentinel + observer instead of a scroll listener: no per-frame work.
  if (sentinel && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      ([entry]) => nav.classList.toggle('is-stuck', !entry.isIntersecting),
      { threshold: 1 }
    );
    observer.observe(sentinel);
    return;
  }

  // Fallback for no-IO browsers.
  const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------- Mobile drawer ---------- */

function initDrawer(nav) {
  const toggle = $('.nav-toggle', nav);
  const panel = $('.navlinks', nav);
  if (!toggle || !panel) return;

  const items = $$('li', panel);
  setStaggerIndex(items);

  const mobile = window.matchMedia(MOBILE_QUERY);
  let isOpen = false;
  let lastFocused = null;

  const focusables = () =>
    $$('a[href], button:not([disabled])', panel).filter(
      (el) => el.offsetParent !== null
    );

  function open() {
    isOpen = true;

    // Fall back to the toggle: when opened programmatically activeElement is
    // <body>, and returning focus there on close would lose the user's place.
    const active = document.activeElement;
    lastFocused =
      active instanceof HTMLElement && active !== document.body ? active : toggle;

    panel.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open');
    // Move focus into the drawer so the trap has somewhere to start.
    focusables()[0]?.focus();
  }

  function close({ restoreFocus = true } = {}) {
    isOpen = false;
    panel.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
    if (restoreFocus) (lastFocused instanceof HTMLElement ? lastFocused : toggle).focus();
  }

  toggle.addEventListener('click', () => (isOpen ? close() : open()));

  // Navigating away closes the drawer without stealing focus.
  panel.addEventListener('click', (e) => {
    if (isOpen && e.target.closest('a')) close({ restoreFocus: false });
  });

  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }

    if (e.key !== 'Tab') return;

    // Focus trap: cycle within the drawer.
    const list = focusables();
    if (!list.length) return;

    const first = list[0];
    const last = list[list.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // Resizing up to desktop must not leave the page scroll-locked.
  const onChange = () => {
    if (!mobile.matches && isOpen) close({ restoreFocus: false });
  };
  mobile.addEventListener?.('change', onChange);
}

/* ---------- Entry ---------- */

export function init() {
  const nav = $('nav');
  if (!nav) return;

  markActiveLink(nav);
  initScrollState(nav);
  initDrawer(nav);
}
