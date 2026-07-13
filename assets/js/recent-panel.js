// assets/js/recent-panel.js — RecentPanel
// Static list of recent entries with per-collection sigil coloring.

const SIGIL_CLASS = {
  wiki:    'feed-entry__sigil--wiki',
  studies: 'feed-entry__sigil--studies',
  log:     'feed-entry__sigil--log',
};

const VISIBLE_COUNT = 5;

class RecentPanel {
  #container = null;
  #pool      = [];

  constructor(containerId) {
    this.#container = document.getElementById(containerId);
    if (!this.#container) return;

    const raw = window.__RECENT_FEED__;
    this.#pool = (Array.isArray(raw) && raw.length > 0) ? raw : [];
    if (this.#pool.length === 0) return;

    const initial = this.#pool.slice(0, VISIBLE_COUNT);
    initial.forEach((entry) => {
      const li = this.#makeEntry(entry);
      li.classList.add('is-visible');
      this.#container.appendChild(li);
    });
  }

  #makeEntry(entry) {
    const section  = entry.section || 'log';
    const sigilCls = SIGIL_CLASS[section] || SIGIL_CLASS.log;

    const li = document.createElement('li');
    li.className = 'feed-entry';

    const topEl = document.createElement('div');
    topEl.className = 'feed-entry__top';

    const sigilEl = document.createElement('span');
    sigilEl.className = `feed-entry__sigil ${sigilCls}`;
    sigilEl.setAttribute('aria-hidden', 'true');
    sigilEl.textContent = entry.sigil || '·';

    const titleEl = document.createElement('span');
    titleEl.className = 'feed-entry__title';

    if (entry.url) {
      const a = document.createElement('a');
      a.href = esc(entry.url);
      a.textContent = entry.title || '';
      titleEl.appendChild(a);
    } else {
      titleEl.textContent = entry.title || '';
    }

    topEl.appendChild(sigilEl);
    topEl.appendChild(titleEl);

    const metaParts = [section];
    if (entry.time) metaParts.push(entry.time);

    const metaEl = document.createElement('div');
    metaEl.className = 'feed-entry__meta';
    metaEl.textContent = metaParts.join(' · ');

    li.appendChild(topEl);
    li.appendChild(metaEl);
    return li;
  }
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', () => {
  new RecentPanel('recent-body');
});
