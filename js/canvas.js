/* ==========================================================================
   canvas.js — particle mesh background

   Rewritten from the original for:
     • a no-op init() when #bg-canvas is absent (the crash that killed all
       JS on about.html and contact.html)
     • devicePixelRatio scaling (was blurry on retina)
     • a spatial grid instead of the O(n²) neighbour loop
     • pausing on document.hidden and when scrolled off-screen
     • density scaled to viewport area, disabled on small/low-power devices
     • prefers-reduced-motion gating
   ========================================================================== */

import { $, prefersReducedMotion, rafThrottle, isFinePointer } from './util.js';

const CONFIG = {
  density: 0.000055,     // particles per px² of viewport
  maxParticles: 70,
  minParticles: 18,
  speed: 0.4,
  linkDistance: 130,
  cursorRadius: 150,
  cursorForce: 0.03,
  baseColor: '56, 189, 248',
  lineColor: '129, 140, 248',
  disableBelowWidth: 640,
};

export function init() {
  const canvas = $('#bg-canvas');
  if (!canvas) return;                 // ← the structural fix

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Bail out where the effect isn't wanted or would cost too much.
  const lowPower =
    (navigator.hardwareConcurrency || 8) <= 4 &&
    window.innerWidth < 1024;

  if (
    prefersReducedMotion() ||
    window.innerWidth < CONFIG.disableBelowWidth ||
    lowPower
  ) {
    canvas.remove();
    return;
  }

  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let rafId = null;
  let running = false;
  let visible = true;

  const mouse = { x: -9999, y: -9999, active: false };

  /* ---------- Sizing ---------- */

  function resize() {
    // Cap DPR at 2 — beyond that the fill cost outweighs the sharpness.
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Draw in CSS pixels; the transform handles the device scaling.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function targetCount() {
    const byArea = Math.round(width * height * CONFIG.density);
    return Math.max(
      CONFIG.minParticles,
      Math.min(CONFIG.maxParticles, byArea)
    );
  }

  function createParticles() {
    const count = targetCount();
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * CONFIG.speed,
      vy: (Math.random() - 0.5) * CONFIG.speed,
      r: Math.random() * 1.5 + 1,
      a: Math.random() * 0.4 + 0.2,
    }));
  }

  /* ---------- Spatial grid ==============================================
     Bucketing by link distance means each particle only tests its own
     and adjacent cells, replacing the original all-pairs comparison.
     ==================================================================== */

  function buildGrid() {
    const cell = CONFIG.linkDistance;
    const cols = Math.max(1, Math.ceil(width / cell));
    const rows = Math.max(1, Math.ceil(height / cell));
    const buckets = new Map();

    particles.forEach((p, index) => {
      const cx = Math.min(cols - 1, Math.max(0, Math.floor(p.x / cell)));
      const cy = Math.min(rows - 1, Math.max(0, Math.floor(p.y / cell)));
      const key = cy * cols + cx;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(index);
    });

    return { buckets, cols, rows, cell };
  }

  /* ---------- Frame ---------- */

  function step() {
    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      // Keep strays inside the viewport after a resize.
      p.x = Math.min(width, Math.max(0, p.x));
      p.y = Math.min(height, Math.max(0, p.y));

      if (mouse.active) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < CONFIG.cursorRadius && dist > 0.01) {
          const force = (1 - dist / CONFIG.cursorRadius) * CONFIG.cursorForce;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }

      // Cap velocity so cursor pushes can't accumulate indefinitely.
      p.vx = Math.max(-1.2, Math.min(1.2, p.vx));
      p.vy = Math.max(-1.2, Math.min(1.2, p.vy));
    }

    // Links between neighbouring particles.
    const { buckets, cols, rows, cell } = buildGrid();
    ctx.lineWidth = 1;

    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const own = buckets.get(cy * cols + cx);
        if (!own) continue;

        for (let ny = cy; ny <= cy + 1; ny++) {
          for (let nx = cx - 1; nx <= cx + 1; nx++) {
            if (ny === cy && nx < cx) continue;   // avoid double-testing
            if (nx < 0 || nx >= cols || ny >= rows) continue;

            const other = buckets.get(ny * cols + nx);
            if (!other) continue;
            const same = nx === cx && ny === cy;

            for (let i = 0; i < own.length; i++) {
              for (let j = same ? i + 1 : 0; j < other.length; j++) {
                const a = particles[own[i]];
                const b = particles[other[j]];
                const dist = Math.hypot(a.x - b.x, a.y - b.y);
                if (dist >= CONFIG.linkDistance) continue;

                const opacity = (1 - dist / CONFIG.linkDistance) * 0.25;
                ctx.strokeStyle = `rgba(${CONFIG.lineColor}, ${opacity})`;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
              }
            }
          }
        }
      }
    }

    // Particles, plus their link to the cursor.
    for (const p of particles) {
      if (mouse.active) {
        const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (dist < CONFIG.cursorRadius) {
          const opacity = (1 - dist / CONFIG.cursorRadius) * 0.45;
          ctx.strokeStyle = `rgba(${CONFIG.baseColor}, ${opacity})`;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${CONFIG.baseColor}, ${p.a})`;
      ctx.fill();
    }

    rafId = requestAnimationFrame(step);
  }

  /* ---------- Lifecycle ---------- */

  function start() {
    if (running || !visible || document.hidden) return;
    running = true;
    rafId = requestAnimationFrame(step);
  }

  function stop() {
    running = false;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  resize();
  createParticles();
  start();

  window.addEventListener(
    'resize',
    rafThrottle(() => {
      resize();
      createParticles();
    })
  );

  // Don't burn cycles on a backgrounded tab.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  // Or when the hero has scrolled well out of view.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { rootMargin: '100px' }
    );
    observer.observe(canvas);
  }

  /* ---------- Pointer ---------- */

  if (isFinePointer()) {
    const spotlight = $('#spotlight');

    window.addEventListener(
      'pointermove',
      rafThrottle((e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;

        if (spotlight) {
          spotlight.classList.add('is-active');
          spotlight.style.transform =
            `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
        }
      }),
      { passive: true }
    );

    document.addEventListener('pointerleave', () => {
      mouse.active = false;
      $('#spotlight')?.classList.remove('is-active');
    });
  }
}
