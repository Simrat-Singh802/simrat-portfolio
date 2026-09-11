/* ==========================================================================
   github.js — public repository fetcher

   Fixes carried over from the original:
     • every API-supplied field is escaped before innerHTML (repo.name,
       description and language were interpolated raw — an XSS surface)
     • ghStatus is included in the element guard (it was dereferenced on
       the empty-username path before being checked)
     • in-flight requests are superseded rather than racing
   ========================================================================== */

import { $, escapeHTML } from './util.js';

const PER_PAGE = 6;

function setStatus(el, message, state) {
  el.textContent = message;
  if (state) el.dataset.state = state;
  else delete el.dataset.state;
}

function repoMarkup(repo) {
  // Every interpolated value passes through escapeHTML.
  const name = escapeHTML(repo.name);
  const desc = escapeHTML(repo.description || 'No description provided.');
  const lang = escapeHTML(repo.language || 'Code');
  const stars = Number(repo.stargazers_count) || 0;

  const updated = repo.pushed_at
    ? new Date(repo.pushed_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : '—';

  return `
    <div class="repo-top">
      <span class="repo-title mono">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        ${name}
      </span>
      <span class="repo-stars mono">★ ${stars}</span>
    </div>
    <p class="repo-desc">${desc}</p>
    <div class="repo-footer mono">
      <span class="repo-lang"><span class="lang-circle"></span>${lang}</span>
      <span>Updated ${escapeHTML(updated)}</span>
    </div>
  `;
}

export function init() {
  const button = $('#ghLoadBtn');
  const input = $('#ghUsername');
  const status = $('#ghStatus');
  const grid = $('#repoGrid');

  // All four are required — status included, unlike the original.
  if (!button || !input || !status || !grid) return;

  let requestToken = 0;

  async function load() {
    const username = input.value.trim();

    if (!username) {
      setStatus(status, 'Enter a GitHub username to query.', 'error');
      grid.innerHTML = '';
      return;
    }

    const token = ++requestToken;

    setStatus(status, 'Querying api.github.com…', 'loading');
    button.disabled = true;
    grid.innerHTML = '';

    try {
      const response = await fetch(
        `https://api.github.com/users/${encodeURIComponent(username)}/repos` +
          `?sort=updated&per_page=${PER_PAGE}`,
        { headers: { Accept: 'application/vnd.github+json' } }
      );

      // A newer query started while this was in flight.
      if (token !== requestToken) return;

      if (!response.ok) {
        if (response.status === 404) throw new Error('User not found.');
        if (response.status === 403) {
          throw new Error('GitHub rate limit reached. Try again shortly.');
        }
        throw new Error(`GitHub responded with ${response.status}.`);
      }

      const repos = await response.json();
      if (token !== requestToken) return;

      if (!Array.isArray(repos) || repos.length === 0) {
        setStatus(status, 'No public repositories on this account.', null);
        return;
      }

      const fragment = document.createDocumentFragment();

      repos.forEach((repo, i) => {
        const card = document.createElement('a');
        card.className = 'glass-card repo-card';
        card.href = repo.html_url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.setAttribute('data-reveal', 'up');
        card.style.setProperty('--i', String(i));
        card.innerHTML = repoMarkup(repo);
        fragment.appendChild(card);
      });

      grid.appendChild(fragment);

      setStatus(
        status,
        `Showing ${repos.length} most recently updated ` +
          `${repos.length === 1 ? 'repository' : 'repositories'}.`,
        'success'
      );

      // Reveal the freshly-injected cards on the next frame.
      requestAnimationFrame(() => {
        grid.querySelectorAll('[data-reveal]').forEach((el) => {
          el.classList.add('is-revealed');
        });
      });
    } catch (err) {
      if (token !== requestToken) return;
      setStatus(status, err.message || 'Request failed.', 'error');
    } finally {
      if (token === requestToken) button.disabled = false;
    }
  }

  button.addEventListener('click', load);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      load();
    }
  });
}
