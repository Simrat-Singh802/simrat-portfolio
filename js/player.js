/* ==========================================================================
   player.js — opt-in background audio

   Deliberately conservative for a portfolio:
     • never autoplays (browsers block it, and unexpected sound on a page a
       recruiter just opened is worse than no sound at all)
     • starts paused at a low volume
     • remembers the last choice per viewer via localStorage, so someone who
       paused it doesn't get it again on the next page
     • hides itself entirely if the audio file is missing, so a repo clone
       without the (gitignored) track shows no broken control
   ========================================================================== */

import { $, prefersReducedMotion } from './util.js';

const STORE_KEY = 'portfolio:audio';
const DEFAULT_VOLUME = 0.35;

export function init() {
  const wrap = $('#audioPlayer');
  const audio = $('#bgAudio');
  const button = $('#audioToggle');
  const label = $('#audioLabel');

  if (!wrap || !audio || !button || !label) return;

  /* ---------- Missing-file guard ------------------------------------
     The track is gitignored, so a fresh clone won't have it, and showing a
     control that silently does nothing is worse than showing none.

     The <audio> element can't tell us this on its own: preload="none" means
     the browser never requests the file, so no 'error' event ever fires.
     A HEAD request settles it without downloading the audio. */

  const src = audio.querySelector('source')?.getAttribute('src');

  const hide = (reason) => {
    wrap.remove();
    console.info(
      `[player] ${reason} — control hidden. ` +
        `Drop a file at ${src || 'audio/track.mp3'} to enable it.`
    );
  };

  if (!src) {
    hide('No audio source declared');
    return;
  }

  // Belt-and-braces: also catch a decode failure on a file that does exist.
  audio.addEventListener('error', () => hide('Audio failed to load'), {
    once: true,
  });

  /* Probe with HEAD so a missing file removes the control instead of
     leaving a dead button. Deliberately NOT cached across loads: the file
     can appear at any time, and a stale "missing" verdict would keep the
     control hidden after you add it.

     The 404 this logs when no file is present is unavoidable — it is the
     detection. It only ever happens on the one page carrying the player. */
  fetch(src, { method: 'HEAD', cache: 'no-store' })
    .then((res) => {
      if (!res.ok) hide(`No audio file at ${src} (${res.status})`);
    })
    .catch(() => hide(`Could not reach ${src}`));

  audio.volume = DEFAULT_VOLUME;
  audio.loop = true;

  /* ---------- State ---------- */

  let playing = false;

  const setState = (isPlaying) => {
    playing = isPlaying;
    wrap.classList.toggle('is-playing', isPlaying);
    button.setAttribute('aria-pressed', String(isPlaying));
    button.setAttribute(
      'aria-label',
      isPlaying ? 'Pause background music' : 'Play background music'
    );
    label.textContent = isPlaying ? 'Pause' : 'Play';
  };

  const remember = (value) => {
    try {
      localStorage.setItem(STORE_KEY, value);
    } catch {
      /* private mode or blocked storage — not worth surfacing */
    }
  };

  async function play() {
    try {
      await audio.play();
      setState(true);
      remember('on');
    } catch {
      // Autoplay policy or a decode failure; leave the UI paused.
      setState(false);
    }
  }

  function pause() {
    audio.pause();
    setState(false);
    remember('off');
  }

  button.addEventListener('click', () => (playing ? pause() : play()));

  // Keep the UI honest if playback stops for any other reason.
  audio.addEventListener('pause', () => setState(false));
  audio.addEventListener('play', () => setState(true));

  setState(false);

  /* ---------- Resume across pages ----------------------------------
     Only ever resumes for a viewer who already chose to play. It still
     needs a real user gesture, so the play() call may be rejected — which
     is fine, the button simply stays in its paused state. */
  let stored = null;
  try {
    stored = localStorage.getItem(STORE_KEY);
  } catch {
    /* ignore */
  }

  if (stored === 'on' && !prefersReducedMotion()) {
    play();
  }
}
