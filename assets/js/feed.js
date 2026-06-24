// assets/js/feed.js — Refactored for split // recent + // now panels

const SIGILS = { wiki: '✦', studies: '⌖', log: '✺', system: '·' };
const LABELS = { wiki: 'wiki', studies: 'studies', log: 'log', system: 'sys' };

// ── // recent panel ───────────────────────────────────────────
class RecentPanel {
  constructor(containerId) {
    this.el = document.getElementById(containerId);
    if (!this.el) return;
    this.#render();
  }

  #render() {
    const entries = window.__FEED_RECENT__ || [];
    if (!entries.length) {
      this.el.innerHTML =
        '<div class="feed-entry"><div class="feed-entry__top">' +
        '<span class="feed-entry__sigil feed-sigil--system">·</span>' +
        '<span class="feed-entry__title">no entries yet</span>' +
        '</div></div>';
      return;
    }

    entries.forEach((entry, i) => {
      const el = document.createElement('div');
      el.className = 'feed-entry feed-entry--in';
      el.style.animationDelay = `${i * 60}ms`;

      const section = entry.section || 'system';
      const sigil   = SIGILS[section] || '·';
      const label   = LABELS[section] || 'sys';
      const sigilCls = `feed-sigil--${section}`;
      const time    = entry.date || '';

      const titleHtml = entry.url
        ? `<a href="${this.#esc(entry.url)}" class="feed-entry__title-link">${this.#esc(entry.title)}</a>`
        : `<span>${this.#esc(entry.title)}</span>`;

      el.innerHTML =
        `<div class="feed-entry__top">` +
          `<span class="feed-entry__sigil ${sigilCls}">${sigil}</span>` +
          `<span class="feed-entry__title">${titleHtml}</span>` +
        `</div>` +
        `<div class="feed-entry__meta">${label}${time ? ' · ' + time : ''}</div>`;

      this.el.appendChild(el);
    });
  }

  #esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// ── // constellation panel ────────────────────────────────────
class ConstellationPanel {
  // Asymmetric positions (left%, top%) — observatory scatter feel
  static #POSITIONS = [
    [18, 22],
    [58, 14],
    [38, 48],
    [72, 38],
    [22, 68],
    [62, 70],
    [80, 55],
    [10, 82],
  ];

  constructor(containerId) {
    this.el      = document.getElementById(containerId);
    this.domains = window.__WIKI_DOMAINS__ || [];
    if (!this.el || !this.domains.length) return;

    this.#render();
    this.#startTwinkle();
  }

  #render() {
    const wrap = document.createElement('div');
    wrap.className = 'feed-constellation';

    this.domains.forEach((domain, i) => {
      const pos = ConstellationPanel.#POSITIONS[i] || [50, 50];
      const a   = document.createElement('a');
      a.className  = 'feed-constellation__star';
      a.href       = domain.href;
      a.style.left = `${pos[0]}%`;
      a.style.top  = `${pos[1]}%`;
      a.setAttribute('aria-label', domain.label);

      a.innerHTML =
        `<span class="feed-constellation__sigil">${domain.sigil}</span>` +
        `<span class="feed-constellation__label">${this.#esc(domain.label)}</span>`;

      wrap.appendChild(a);
    });

    this.el.appendChild(wrap);
    this.stars = Array.from(wrap.querySelectorAll('.feed-constellation__star'));
  }

  #startTwinkle() {
    if (!this.stars || !this.stars.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    setInterval(() => {
      const star = this.stars[Math.floor(Math.random() * this.stars.length)];
      star.classList.add('is-twinkling');
      setTimeout(() => star.classList.remove('is-twinkling'), 800);
    }, 60000);
  }

  #esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// ── Boot ──────────────────────────────────────────────────────
new RecentPanel('feed-recent');
new ConstellationPanel('constellation-body');
