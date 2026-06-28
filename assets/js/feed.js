// assets/js/feed.js — RecentPanel + ArtifactPanel
// Replaces the old LogStreamPanel.
// RecentPanel: static 9-entry list with stagger fade-in.
// ArtifactPanel: deterministic daily-pick Log card with holo + detail view.

const SIGIL_CLASS = {
  wiki:    'feed-entry__sigil--wiki',
  studies: 'feed-entry__sigil--studies',
  log:     'feed-entry__sigil--log',
};

// ── Deterministic hash: maps a date string to an array index ──
function dateHash(key, length) {
  if (!length) return 0;
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % length;
}

// ─────────────────────────────────────────────────────────────
// RecentPanel
// Reads window.__RECENT_FEED__ (up to 15 entries pool),
// renders 5 visible entries with stagger fade-in.
// Auto-rotates every 8s: prepend new entry (.is-new), remove
// oldest (.is-fading). Pauses on hover. Respects reduced-motion.
// ─────────────────────────────────────────────────────────────
const VISIBLE_COUNT  = 5;
const ROTATE_INTERVAL = 8000; // ms

class RecentPanel {
  #container  = null;
  #reduced    = false;
  #pool       = [];   // full feed array
  #nextIdx    = 0;    // index into pool for next rotation entry
  #timer      = null;
  #paused     = false;

  constructor(containerId) {
    this.#container = document.getElementById(containerId);
    if (!this.#container) return;

    this.#reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const raw = window.__RECENT_FEED__;
    this.#pool = (Array.isArray(raw) && raw.length > 0) ? raw : [];
    if (this.#pool.length === 0) return;

    // Render initial VISIBLE_COUNT entries
    const initial = this.#pool.slice(0, VISIBLE_COUNT);
    this.#nextIdx = initial.length % this.#pool.length;

    initial.forEach((entry, i) => {
      const li = this.#makeEntry(entry);
      if (!this.#reduced) {
        li.classList.add('is-animating');
        li.style.animationDelay = `${i * 55}ms`;
        li.addEventListener('animationend', () => {
          li.classList.remove('is-animating');
          li.classList.add('is-visible');
        }, { once: true });
      } else {
        li.classList.add('is-visible');
      }
      this.#container.appendChild(li);
    });

    // Start auto-rotate (skip if reduced-motion or pool too small)
    if (!this.#reduced && this.#pool.length > VISIBLE_COUNT) {
      this.#startRotate();
      this.#bindHoverPause();
    }
  }

  #startRotate() {
    this.#timer = setInterval(() => {
      if (!this.#paused) this.#rotate();
    }, ROTATE_INTERVAL);
  }

  #rotate() {
    const items = this.#container.querySelectorAll('.feed-entry');
    if (items.length === 0) return;

    // Fade out the last (oldest) item
    const last = items[items.length - 1];
    last.classList.add('is-fading');
    last.addEventListener('animationend', () => last.remove(), { once: true });

    // Prepend new item at top
    const nextEntry = this.#pool[this.#nextIdx];
    this.#nextIdx   = (this.#nextIdx + 1) % this.#pool.length;

    const li = this.#makeEntry(nextEntry);
    li.classList.add('is-new');
    li.addEventListener('animationend', () => {
      li.classList.remove('is-new');
      li.classList.add('is-visible');
    }, { once: true });

    this.#container.insertBefore(li, this.#container.firstChild);
  }

  #bindHoverPause() {
    const panel = this.#container.closest('.feed-panel--recent');
    if (!panel) return;
    panel.addEventListener('mouseenter', () => { this.#paused = true; });
    panel.addEventListener('mouseleave', () => { this.#paused = false; });
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

// ─────────────────────────────────────────────────────────────
// ArtifactPanel
// Reads window.__LOG_ARTIFACTS__ + window.__TODAY_KEY__,
// picks one card deterministically (same card all day),
// renders full Phase 1 Log card DOM, binds holo + detail view
// using log-deck.js handlers already loaded on the page.
// ─────────────────────────────────────────────────────────────

const SIGIL_MAP = {
  moment:  '◇',
  food:    '✦',
  thought: '⊹',
  object:  '⊹',
  signal:  '◇',
};

const TYPE_RARITY_FALLBACK = {
  moment:  'rare',
  food:    'uncommon',
  thought: 'rare',
  object:  'uncommon',
  signal:  'legendary',
};

const CORNER_SIGILS = ['✦', '⊹', '✦', '⊹'];
const TILT_MAX_DEG  = 12;

class ArtifactPanel {
  #slot    = null;
  #reduced = false;

  constructor(slotId) {
    this.#slot    = document.getElementById(slotId);
    if (!this.#slot) return;

    this.#reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const artifacts = window.__LOG_ARTIFACTS__;
    if (!Array.isArray(artifacts) || artifacts.length === 0) {
      this.#renderEmpty();
      return;
    }

    const key  = window.__TODAY_KEY__ || new Date().toISOString().slice(0, 10);
    const idx  = dateHash(key, artifacts.length);
    const data = artifacts[idx];

    this.#renderCard(data);
  }

  #resolveRarity(data) {
    const r = (data.rarity || '').trim().toLowerCase();
    if (r === 'common' || r === 'uncommon' || r === 'rare' || r === 'legendary') return r;
    return TYPE_RARITY_FALLBACK[data.type] || 'uncommon';
  }

  #renderCard(data) {
    const type   = data.type   || 'moment';
    const rarity = this.#resolveRarity(data);
    const sigil  = SIGIL_MAP[type] || '◇';
    const num    = '#' + (data.number || '001');
    const title  = data.title    || '';
    const period = data.period   || '';
    const frag   = data.fragment || '';

    // Outer card element
    const card = document.createElement('div');
    card.className = `log-card log-card--${type} log-card--holo-${rarity}`;
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Open card: ' + title);

    // Corner ornament
    const ornament = document.createElement('div');
    ornament.className = 'log-card__ornament';
    ornament.setAttribute('aria-hidden', 'true');
    CORNER_SIGILS.forEach((s, ci) => {
      const pos  = ['tl', 'tr', 'bl', 'br'][ci];
      const span = document.createElement('span');
      span.className = `log-card__corner log-card__corner--${pos}`;
      span.textContent = s;
      ornament.appendChild(span);
    });
    card.appendChild(ornament);

    // Inner (flip wrapper — kept for CSS compatibility with log-cards.scss)
    const inner = document.createElement('div');
    inner.className = 'log-card__inner';

    // Front face
    const front = document.createElement('div');
    front.className = 'log-card__front';

    // Shine overlay (legacy, common cards)
    const shine = document.createElement('div');
    shine.className = 'log-card__shine';
    front.appendChild(shine);

    // Header: type label left + sigil/number right
    const header = document.createElement('div');
    header.className = 'log-card__header';

    const typeLabel = document.createElement('span');
    typeLabel.className = 'log-card__type-label';
    typeLabel.innerHTML = `<span aria-hidden="true">${sigil}</span> ${type.toUpperCase()}`;

    const badge = document.createElement('div');
    badge.className = 'log-card__badge';

    const sigilEl = document.createElement('span');
    sigilEl.className = 'log-card__sigil';
    sigilEl.setAttribute('aria-hidden', 'true');
    sigilEl.textContent = sigil;

    const numEl = document.createElement('span');
    numEl.className = 'log-card__number';
    numEl.textContent = num;

    badge.appendChild(sigilEl);
    badge.appendChild(numEl);
    header.appendChild(typeLabel);
    header.appendChild(badge);

    // Photo slot (moment / food / object)
    let photoWrap = null;
    if (type === 'moment' || type === 'food' || type === 'object') {
      photoWrap = document.createElement('div');
      photoWrap.className = 'log-card__photo';

      const placeholder = document.createElement('div');
      placeholder.className = 'log-card__photo-placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.textContent = sigil;
      photoWrap.appendChild(placeholder);

      if (data.photo) {
        const img = document.createElement('img');
        img.src     = data.photo;
        img.alt     = title + ' photo';
        img.loading = 'lazy';
        img.addEventListener('error', () => img.classList.add('is-error'));
        img.addEventListener('load',  () => { placeholder.style.opacity = '0'; });
        photoWrap.appendChild(img);
      }
    }

    // Body: title + period + fragment
    const bodyEl = document.createElement('div');
    bodyEl.className = 'log-card__body';

    const titleEl = document.createElement('p');
    titleEl.className = 'log-card__title';
    titleEl.textContent = title;
    bodyEl.appendChild(titleEl);

    if (period) {
      const periodEl = document.createElement('p');
      periodEl.className = 'log-card__period';
      periodEl.textContent = period;
      bodyEl.appendChild(periodEl);
    }

    if (frag) {
      const fragEl = document.createElement('p');
      fragEl.className = 'log-card__flavor';
      fragEl.textContent = frag;
      bodyEl.appendChild(fragEl);
    }

    // Footer
    const footer = document.createElement('div');
    footer.className = 'log-card__footer';
    const footerLabel = document.createElement('span');
    footerLabel.className = 'log-card__type-label';
    footerLabel.innerHTML = `<span aria-hidden="true">${sigil}</span> ${type.toUpperCase()}`;

    // Period dot indicator (right side of footer)
    const dateDot = document.createElement('span');
    dateDot.className = 'log-card__date';
    dateDot.textContent = period;

    footer.appendChild(footerLabel);
    footer.appendChild(dateDot);

    // Back face (minimal — detail view modal is the full experience)
    const back = document.createElement('div');
    back.className = 'log-card__back';

    const backBody = document.createElement('p');
    backBody.className = 'log-card__back-body';
    backBody.textContent = frag;

    const backFooter = document.createElement('div');
    backFooter.className = 'log-card__back-footer';

    const hint = document.createElement('span');
    hint.className = 'log-card__back-hint';
    hint.textContent = '↑ tap to flip back';

    const link = document.createElement('a');
    link.className = 'log-card__back-link';
    link.href = data.url || '#';
    link.textContent = 'read full →';

    backFooter.appendChild(hint);
    backFooter.appendChild(link);
    back.appendChild(backBody);
    back.appendChild(backFooter);

    // Assemble
    front.appendChild(header);
    if (photoWrap) front.appendChild(photoWrap);
    front.appendChild(bodyEl);
    front.appendChild(footer);

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);

    this.#slot.appendChild(card);

    // Bind holo + tilt (same algorithm as log-deck.js bindCardHolo)
    this.#bindHolo(card);

    // Bind click → detail view modal (log-deck.js openDetail is IIFE-scoped,
    // so we dispatch a custom event that a shim below forwards to openDetail).
    this.#bindClick(card, data);

    // Keyboard
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.#openDetailFallback(data);
      }
    });
  }

  #bindHolo(el) {
    if (this.#reduced) return;

    let rafPending = false;
    let pendingX = 0, pendingY = 0;

    el.addEventListener('pointermove', (e) => {
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
          rafPending = false;
          this.#applyHolo(el, pendingX, pendingY);
        });
      }
    });

    el.addEventListener('pointerleave', () => {
      rafPending = false;
      el.style.setProperty('--cursor-rx', '0deg');
      el.style.setProperty('--cursor-ry', '0deg');
      el.style.setProperty('--holo-tx', '0');
      el.style.setProperty('--holo-ty', '0');
      el.style.setProperty('--cursor-x', '50%');
      el.style.setProperty('--cursor-y', '50%');
      el.style.transform = '';
      el.classList.remove('is-holo-active');
    });

    el.addEventListener('pointerenter', () => {
      el.classList.add('is-holo-active');
    });
  }

  #applyHolo(el, clientX, clientY) {
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const nx  = (clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2);
    const ny  = (clientY - (rect.top  + rect.height / 2)) / (rect.height / 2);
    const cnx = Math.max(-1, Math.min(1, nx));
    const cny = Math.max(-1, Math.min(1, ny));

    const rotX    = (-cny * TILT_MAX_DEG).toFixed(2) + 'deg';
    const rotY    = ( cnx * TILT_MAX_DEG).toFixed(2) + 'deg';
    const holoTx  = (cnx * 40).toFixed(1);
    const holoTy  = (cny * 40).toFixed(1);
    const cursorX = ((cnx + 1) / 2 * 100).toFixed(1) + '%';
    const cursorY = ((cny + 1) / 2 * 100).toFixed(1) + '%';

    el.style.setProperty('--cursor-rx', rotX);
    el.style.setProperty('--cursor-ry', rotY);
    el.style.setProperty('--holo-tx',   holoTx);
    el.style.setProperty('--holo-ty',   holoTy);
    el.style.setProperty('--cursor-x',  cursorX);
    el.style.setProperty('--cursor-y',  cursorY);

    el.style.transform =
      `perspective(700px) rotateX(${rotX}) rotateY(${rotY}) translateY(-3px)`;
  }

  #bindClick(el, data) {
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('log-card__back-link')) return;
      // Attempt to use the detail overlay already in the DOM (same as log-deck.js).
      // log-deck.js is loaded as a plain script (non-module, IIFE), its openDetail
      // is not exported. We replicate the overlay build inline here so the home
      // page card has the same experience without touching log-deck.js.
      this.#openDetailFallback(data);
    });
  }

  // ── Inline detail view (mirrors log-deck.js openDetail) ──────
  // Kept here because log-deck.js openDetail is IIFE-private.
  // Shares the same overlay element #log-detail-overlay and all CSS.
  #openDetailFallback(data) {
    const overlayEl = document.getElementById('log-detail-overlay');
    if (!overlayEl) return;

    overlayEl.innerHTML = '';
    overlayEl.removeAttribute('hidden');

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className   = 'log-detail-close';
    closeBtn.textContent = '✕ close';
    closeBtn.setAttribute('aria-label', 'Close detail view');
    overlayEl.appendChild(closeBtn);

    // Wrapper (perspective container)
    const wrapper = document.createElement('div');
    wrapper.className = 'log-detail-wrapper';
    overlayEl.appendChild(wrapper);

    // Hint
    const hint = document.createElement('p');
    hint.className = 'log-detail-overlay__hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.textContent = 'click card to flip · esc or click outside to close';
    overlayEl.appendChild(hint);

    // Build detail card
    const detailCard = this.#buildDetailCard(data);
    wrapper.appendChild(detailCard);

    requestAnimationFrame(() => {
      overlayEl.classList.add('is-visible');
    });

    this.#bindDetailHolo(detailCard);

    detailCard.addEventListener('click', (e) => {
      if (e.target.classList.contains('log-detail-card__back-link')) return;
      detailCard.classList.toggle('is-flipped');
    });

    const close = () => {
      overlayEl.classList.remove('is-visible');
      document.removeEventListener('keydown', onKeydown);
      setTimeout(() => {
        overlayEl.innerHTML = '';
        overlayEl.setAttribute('hidden', '');
      }, 320);
    };

    const onKeydown = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab') {
        const focusable = overlayEl.querySelectorAll(
          'button, [href], [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
        }
      }
    };

    overlayEl.addEventListener('click', (e) => {
      if (e.target === overlayEl || e.target === hint) close();
    });

    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', onKeydown);
    closeBtn.focus();
  }

  #buildDetailCard(data) {
    const type   = data.type || 'moment';
    const rarity = this.#resolveRarity(data);
    const sigil  = SIGIL_MAP[type] || '◇';
    const title  = data.title    || '';
    const frag   = data.fragment || '';
    const period = data.period   || '';
    const body   = data.body     || '';

    const card = document.createElement('div');
    card.className = `log-detail-card log-card--${type} log-card--holo-${rarity}`;
    card.dataset.rarity = rarity;
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Card: ${title}. Click to flip.`);

    // Corner ornament
    const ornament = document.createElement('div');
    ornament.className = 'log-card__ornament';
    ornament.setAttribute('aria-hidden', 'true');
    [{ cls: 'tl', s: '✦' }, { cls: 'tr', s: '⊹' }, { cls: 'bl', s: '✦' }, { cls: 'br', s: '⊹' }]
      .forEach(c => {
        const span = document.createElement('span');
        span.className = `log-card__corner log-card__corner--${c.cls}`;
        span.textContent = c.s;
        ornament.appendChild(span);
      });
    card.appendChild(ornament);

    // Front face
    const front = document.createElement('div');
    front.className = 'log-detail-card__front';
    front.style.cssText = 'display:flex;flex-direction:column;height:100%;position:relative;overflow:hidden;';

    // Photo slot
    const photoWrap = document.createElement('div');
    photoWrap.className = 'log-card__photo';
    photoWrap.style.height = '55%';

    const placeholder = document.createElement('div');
    placeholder.className = 'log-card__photo-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.textContent = sigil;
    photoWrap.appendChild(placeholder);

    if (data.photo) {
      const img = document.createElement('img');
      img.src = data.photo;
      img.alt = title + ' photo';
      img.addEventListener('error', () => img.classList.add('is-error'));
      img.addEventListener('load',  () => { placeholder.style.opacity = '0'; });
      photoWrap.appendChild(img);
    }

    // Header overlay on photo
    const header = document.createElement('div');
    header.className = 'log-card__header';
    header.style.cssText =
      'position:absolute;top:0;left:0;right:0;z-index:3;' +
      'background:linear-gradient(180deg,rgba(18,19,24,.7) 0%,transparent 100%);' +
      'padding:.9rem 1.1rem .6rem;';

    const titleEl = document.createElement('span');
    titleEl.className   = 'log-card__title';
    titleEl.style.fontSize = '1.05rem';
    titleEl.textContent = title;

    const badge   = document.createElement('div');
    badge.className = 'log-card__badge';
    const sigilEl = document.createElement('span');
    sigilEl.className = 'log-card__sigil';
    sigilEl.setAttribute('aria-hidden', 'true');
    sigilEl.textContent = sigil;
    const numEl   = document.createElement('span');
    numEl.className   = 'log-card__number';
    numEl.textContent = '#' + (data.number || '001');
    badge.appendChild(sigilEl);
    badge.appendChild(numEl);
    header.appendChild(titleEl);
    header.appendChild(badge);
    photoWrap.appendChild(header);

    // Body area
    const bodyArea = document.createElement('div');
    bodyArea.className  = 'log-card__body';
    bodyArea.style.flex = '1';

    if (period) {
      const periodEl = document.createElement('p');
      periodEl.className   = 'log-card__period';
      periodEl.textContent = period;
      bodyArea.appendChild(periodEl);
    }

    if (frag) {
      const fragEl = document.createElement('p');
      fragEl.className   = 'log-card__flavor';
      fragEl.style.fontSize = '.92rem';
      fragEl.textContent = frag;
      bodyArea.appendChild(fragEl);
    }

    // Footer
    const footer = document.createElement('div');
    footer.className = 'log-card__footer';
    const typeLabel = document.createElement('span');
    typeLabel.className = 'log-card__type-label';
    typeLabel.innerHTML = `<span aria-hidden="true">${sigil}</span> ${type.toUpperCase()}`;
    footer.appendChild(typeLabel);

    front.appendChild(photoWrap);
    front.appendChild(bodyArea);
    front.appendChild(footer);
    card.appendChild(front);

    // Back face
    const back = document.createElement('div');
    back.className = 'log-detail-card__back';

    const backHeader = document.createElement('div');
    backHeader.className = 'log-detail-card__back-header';
    const backTitle = document.createElement('span');
    backTitle.className   = 'log-detail-card__back-title';
    backTitle.textContent = title;
    const backSigil = document.createElement('span');
    backSigil.className = 'log-detail-card__back-sigil';
    backSigil.setAttribute('aria-hidden', 'true');
    backSigil.textContent = sigil;
    backHeader.appendChild(backTitle);
    backHeader.appendChild(backSigil);

    const backBody = document.createElement('div');
    backBody.className = 'log-detail-card__back-body';
    if (body) {
      backBody.innerHTML = body;
    } else if (frag) {
      const p = document.createElement('p');
      p.textContent = frag;
      backBody.appendChild(p);
    }

    const backFooter = document.createElement('div');
    backFooter.className = 'log-detail-card__back-footer';
    const backHint = document.createElement('span');
    backHint.className   = 'log-detail-card__back-hint';
    backHint.textContent = '↑ click to flip back';
    const backLink = document.createElement('a');
    backLink.className   = 'log-detail-card__back-link';
    backLink.href        = data.url || '#';
    backLink.textContent = 'read full →';
    backFooter.appendChild(backHint);
    backFooter.appendChild(backLink);

    back.appendChild(backHeader);
    back.appendChild(backBody);
    back.appendChild(backFooter);
    card.appendChild(back);

    return card;
  }

  #bindDetailHolo(el) {
    if (this.#reduced) return;

    const DETAIL_TILT = 8;
    let rafPending = false;
    let pendingX = 0, pendingY = 0;

    el.addEventListener('pointermove', (e) => {
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
          rafPending = false;
          this.#applyDetailHolo(el, pendingX, pendingY, DETAIL_TILT);
        });
      }
    });

    el.addEventListener('pointerleave', () => {
      rafPending = false;
      el.style.setProperty('--cursor-rx', '0deg');
      el.style.setProperty('--cursor-ry', '0deg');
      el.style.setProperty('--holo-tx',   '0');
      el.style.setProperty('--holo-ty',   '0');
      el.style.setProperty('--cursor-x',  '50%');
      el.style.setProperty('--cursor-y',  '50%');
    });
  }

  #applyDetailHolo(el, clientX, clientY, maxTilt) {
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const nx  = (clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2);
    const ny  = (clientY - (rect.top  + rect.height / 2)) / (rect.height / 2);
    const cnx = Math.max(-1, Math.min(1, nx));
    const cny = Math.max(-1, Math.min(1, ny));

    el.style.setProperty('--cursor-rx', (-cny * maxTilt).toFixed(2) + 'deg');
    el.style.setProperty('--cursor-ry', ( cnx * maxTilt).toFixed(2) + 'deg');
    el.style.setProperty('--holo-tx',   (cnx * 40).toFixed(1));
    el.style.setProperty('--holo-ty',   (cny * 40).toFixed(1));
    el.style.setProperty('--cursor-x',  ((cnx + 1) / 2 * 100).toFixed(1) + '%');
    el.style.setProperty('--cursor-y',  ((cny + 1) / 2 * 100).toFixed(1) + '%');
  }

  #renderEmpty() {
    const msg = document.createElement('div');
    msg.className   = 'artifact-slot__empty';
    msg.textContent = '~ no artifacts yet ~';
    this.#slot.appendChild(msg);
  }
}

// ── Shared escape helper ──────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  new RecentPanel('recent-body');
  new ArtifactPanel('artifact-slot');
});
