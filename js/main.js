/* ==========================================================================
   main.js — entry point

   Every module's init() no-ops when its anchor element is absent, so one
   bundle serves all five pages and a missing element can never throw.
   That is the structural fix for the original script.js, where an
   unguarded canvas.getContext() killed all JS on about and contact.
   ========================================================================== */

import * as nav from './nav.js';
import * as reveal from './reveal.js';
import * as canvas from './canvas.js';
import * as motion from './motion.js';
import * as toast from './toast.js';
import * as github from './github.js';
import * as resume from './resume.js';

const MODULES = [nav, toast, canvas, motion, reveal, github, resume];

function boot() {
  // Modules are running, so the CSS force-show fallback can stand down.
  document.documentElement.classList.remove('no-js');

  for (const mod of MODULES) {
    // One failing module must not stop the others.
    try {
      mod.init();
    } catch (err) {
      console.error('[init failed]', err);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
