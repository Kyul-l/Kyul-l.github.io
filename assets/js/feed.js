// assets/js/feed.js — LogStreamPanel (replaces RecentPanel + ConstellationPanel)

const SIGIL_CLASS = {
  wiki:    'log-stream__entry__sigil--wiki',
  studies: 'log-stream__entry__sigil--studies',
  log:     'log-stream__entry__sigil--log',
  system:  'log-stream__entry__sigil--system',
};

const FALLBACK_ENTRIES = [
  { sigil: '⊹', title: 'STATUS · OPERATIONAL', section: 'system', time: '', url: '' },
  { sigil: '⊹', title: 'uptime · stable',       section: 'system', time: '', url: '' },
  { sigil: '⊹', title: 'archive · online',       section: 'system', time: '', url: '' },
];

class LogStreamPanel {
  #container = null;
  #entries    = [];
  #cursor     = 0;         // next index to inject (cycles)
  #maxVisible = 8;
  #interval   = 8000;      // ms between rotations
  #timer      = null;
  #reduced    = false;

  constructor(containerId) {
    this.#container = document.getElementById(containerId);
    if (!this.#container) return;

    this.#reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const raw = window.__LOG_STREAM__;
    this.#entries = (Array.isArray(raw) && raw.length > 0) ? raw : FALLBACK_ENTRIES;

    // Cursor starts after the initial batch so rotation continues from where
    // the visible list leaves off.
    this.#cursor = Math.min(this.#maxVisible, this.#entries.length) % this.#entries.length;

    this.#renderInitial();

    if (!this.#reduced && this.#entries.length > 1) {
      this.#startRotation();
    }
  }

  // ── Initial render: stagger-fade the first N entries ────────
  #renderInitial() {
    const slice = this.#entries.slice(0, this.#maxVisible);
    slice.forEach((entry, i) => {
      const el = this.#makeEntry(entry);
      if (!this.#reduced) {
        el.style.opacity = '0';
        el.style.animationDelay = `${i * 80}ms`;
        el.classList.add('is-new');
      }
      this.#container.appendChild(el);
    });
  }

  // ── Rotation: prepend newest at top, fade+remove oldest ─────
  #startRotation() {
    this.#timer = setInterval(() => {
      const entry = this.#entries[this.#cursor];
      this.#cursor = (this.#cursor + 1) % this.#entries.length;

      // Prepend new entry
      const newEl = this.#makeEntry(entry);
      newEl.classList.add('is-new');
      this.#container.prepend(newEl);

      // Count visible entries; fade+remove if over limit
      const all = Array.from(this.#container.children);
      if (all.length > this.#maxVisible) {
        const oldest = all[all.length - 1];
        oldest.classList.add('is-fading');
        setTimeout(() => oldest.remove(), 420);
      }
    }, this.#interval);
  }

  // ── Build a single entry element ─────────────────────────────
  #makeEntry(entry) {
    const section   = entry.section || 'system';
    const sigilCls  = SIGIL_CLASS[section] || SIGIL_CLASS.system;

    const el = document.createElement('div');
    el.className = 'log-stream__entry';

    const topEl = document.createElement('div');
    topEl.className = 'log-stream__entry__top';

    const sigilEl = document.createElement('span');
    sigilEl.className = `log-stream__entry__sigil ${sigilCls}`;
    sigilEl.textContent = entry.sigil || '·';

    const textEl = document.createElement('span');
    textEl.className = 'log-stream__entry__text';

    if (entry.url) {
      const a = document.createElement('a');
      a.href = this.#esc(entry.url);
      a.textContent = entry.title || '';
      textEl.appendChild(a);
    } else {
      textEl.textContent = entry.title || '';
    }

    topEl.appendChild(sigilEl);
    topEl.appendChild(textEl);

    const metaParts = [section];
    if (entry.time) metaParts.push(entry.time);

    const metaEl = document.createElement('div');
    metaEl.className = 'log-stream__entry__meta';
    metaEl.textContent = metaParts.join(' · ');

    el.appendChild(topEl);
    el.appendChild(metaEl);
    return el;
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
new LogStreamPanel('log-stream-body');
