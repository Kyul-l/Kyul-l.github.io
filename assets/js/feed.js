// assets/js/feed.js

const SYSTEM_ENTRIES = [
  { text: 'signal: SECURE',      section: 'system' },
  { text: 'observer: active',    section: 'system' },
  { text: 'index: synchronized', section: 'system' },
  { text: 'uplink: stable',      section: 'system' },
  { text: 'cache: warm',         section: 'system' },
  { text: '⋆  standby  ⋆',      section: 'system' },
  { text: 'archive: live',       section: 'system' },
  { text: 'memory: intact',      section: 'system' },
  { text: 'seal: 𝕵',            section: 'system' },
];

const SIGILS   = { wiki: '✦', studies: '⌖', log: '✺', system: '·' };
const LABELS   = { wiki: 'wiki', studies: 'studies', log: 'log', system: 'sys' };

class FeedPanel {
  constructor(containerId) {
    this.el = document.getElementById(containerId);
    if (!this.el) return;

    this.posts  = (window.__FEED_POSTS__ || []).slice().reverse();
    this.queue  = this.#buildQueue();
    this.cursor = 0;
    this.MAX    = 14;

    this.#seed();

    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 7000 : 3200;
    setInterval(() => this.#tick(), delay);
  }

  #buildQueue() {
    const q  = [];
    let pi = 0, si = 0;
    // interleave: 2 sys, 1 post
    while (pi < this.posts.length || si < SYSTEM_ENTRIES.length) {
      if (si < SYSTEM_ENTRIES.length) q.push(SYSTEM_ENTRIES[si++]);
      if (si < SYSTEM_ENTRIES.length) q.push(SYSTEM_ENTRIES[si++]);
      if (pi < this.posts.length)     q.push(this.posts[pi++]);
    }
    return q.length ? q : [...SYSTEM_ENTRIES];
  }

  #seed() {
    const n = Math.min(9, this.queue.length);
    for (let i = 0; i < n; i++) this.#addEntry(this.queue[i], false);
    this.cursor = n % this.queue.length;
  }

  #tick() {
    this.#addEntry(this.queue[this.cursor], true);
    this.cursor = (this.cursor + 1) % this.queue.length;
  }

  #addEntry(entry, animate) {
    const el     = document.createElement('div');
    el.className = 'feed-entry' + (animate ? ' feed-entry--in' : '');

    const section = entry.section || 'system';
    const sigil   = SIGILS[section]  || '·';
    const label   = LABELS[section]  || 'sys';
    const sigilCls = `feed-sigil--${section}`;
    const time    = this.#ts();

    el.innerHTML =
      `<div class="feed-entry__top">` +
        `<span class="feed-entry__sigil ${sigilCls}">${sigil}</span>` +
        `<span class="feed-entry__title">${this.#esc(entry.text)}</span>` +
      `</div>` +
      `<div class="feed-entry__meta">${label} · ${time}</div>`;

    this.el.appendChild(el);

    const all = this.el.querySelectorAll('.feed-entry');
    if (all.length > this.MAX) {
      const old = all[0];
      old.classList.add('feed-entry--out');
      setTimeout(() => old.remove(), 360);
    }
  }

  #ts() {
    return new Date().toTimeString().slice(0, 8);
  }

  #esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

new FeedPanel('feed-body');
