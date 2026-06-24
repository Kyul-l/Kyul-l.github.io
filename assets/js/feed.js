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

// ── // now panel ──────────────────────────────────────────────
class NowPanel {
  constructor({ stateId, glossaryId }) {
    this.stateEl    = document.getElementById(stateId);
    this.glossaryEl = document.getElementById(glossaryId);
    this.entries    = window.__WIKI_ENTRIES__ || [];
    this.current    = 0;

    if (this.stateEl)    this.#renderState();
    if (this.glossaryEl) this.#renderGlossary();

    if (this.entries.length > 1) {
      const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 60000 : 30000;
      setInterval(() => this.#rotateGlossary(), delay);
    }
  }

  #renderState() {
    // Hardcoded placeholders — replace with site.data.now or JS when available
    const rows = [
      { key: 'current', val: 'ARCANA' },
      { key: 'zone',    val: 'cloud · offensive' },
      { key: 'uptime',  val: this.#uptime() },
    ];

    this.stateEl.innerHTML = rows.map(r =>
      `<div class="feed-state-row">` +
        `<span class="feed-state-row__key">${this.#esc(r.key)}</span>` +
        `<span class="feed-state-row__val">${this.#esc(r.val)}</span>` +
      `</div>`
    ).join('');
  }

  #renderGlossary() {
    if (!this.entries.length) {
      this.glossaryEl.innerHTML =
        '<span class="feed-glossary__eyebrow">✦ random · Wiki</span>' +
        '<span class="feed-glossary__title">no wiki entries yet</span>';
      return;
    }

    const entry = this.entries[this.current];
    const excerpt = (entry.excerpt || '').slice(0, 100).trim();
    const ellipsis = (entry.excerpt || '').length > 100 ? '…' : '';

    this.glossaryEl.innerHTML =
      `<span class="feed-glossary__eyebrow">✦ random · Wiki</span>` +
      `<span class="feed-glossary__title">${this.#esc(entry.title)}</span>` +
      (excerpt
        ? `<span class="feed-glossary__excerpt">${this.#esc(excerpt)}${ellipsis}</span>`
        : '') +
      (entry.url
        ? `<a href="${this.#esc(entry.url)}" class="feed-glossary__link">read more →</a>`
        : '');
  }

  #rotateGlossary() {
    if (!this.glossaryEl || !this.entries.length) return;

    this.glossaryEl.classList.add('is-fading');
    setTimeout(() => {
      this.current = (this.current + 1) % this.entries.length;
      this.#renderGlossary();
      this.glossaryEl.classList.remove('is-fading');
    }, 400);
  }

  #uptime() {
    // Simple uptime display — days since 2026-06-11 launch
    const launch = new Date('2026-06-11T00:00:00Z');
    const now    = new Date();
    const days   = Math.floor((now - launch) / 86400000);
    const hours  = Math.floor(((now - launch) % 86400000) / 3600000);
    return `${days}d · ${hours}h`;
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
new NowPanel({ stateId: 'feed-state', glossaryId: 'feed-glossary' });
