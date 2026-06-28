// ─────────────────────────────────────────────────────────────
// log-deck.js  ·  Cabinet Drawer deck engine
// Phase 1 chrome preserved: holo foil, 3D tilt, detail view modal
// ─────────────────────────────────────────────────────────────

(function () {
  'use strict';

  // ── Sigil + rarity maps ──────────────────────────────────────
  const SIGIL_MAP = {
    moment:  '◇',
    food:    '✦',
    thought: '⊹',
    object:  '⊹',
    signal:  '◇',
  };

  // Rarity derived from type when frontmatter rarity is absent
  const TYPE_RARITY_MAP = {
    moment:  'rare',
    food:    'uncommon',
    thought: 'rare',
    object:  'uncommon',
    signal:  'legendary',
  };

  const CORNER_SIGILS = ['✦', '⊹', '✦', '⊹'];

  const TILT_MAX_DEG = 12;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── State ────────────────────────────────────────────────────
  const state = {
    activeFilter: 'all',
    detailOpen:   false,
    detailCard:   null,
  };

  // ── DOM refs ─────────────────────────────────────────────────
  let drawersEl, filterRow, shuffleBtn, overlayEl;

  // ── Init ─────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    const data = window.__LOG_DRAWERS__;
    if (!data || !data.collections || !data.collections.length) return;

    drawersEl  = document.getElementById('log-drawers');
    filterRow  = document.querySelector('.log-toolbar__filters');
    shuffleBtn = document.querySelector('.log-shuffle');
    overlayEl  = document.getElementById('log-detail-overlay');

    if (!drawersEl) return;

    bindFilterChips();
    if (shuffleBtn) shuffleBtn.addEventListener('click', shuffleAllCards);

    renderDrawers();
  });

  // ── Rarity resolver ──────────────────────────────────────────
  function resolveRarity(cardData) {
    const r = (cardData.rarity || '').trim().toLowerCase();
    if (r === 'common' || r === 'uncommon' || r === 'rare' || r === 'legendary') return r;
    return TYPE_RARITY_MAP[cardData.type] || 'uncommon';
  }

  // ─────────────────────────────────────────────────────────────
  // DRAWER RENDER
  // ─────────────────────────────────────────────────────────────

  function renderDrawers() {
    drawersEl.innerHTML = '';
    const data = window.__LOG_DRAWERS__;

    data.collections.forEach(function (col, colIdx) {
      const drawer = buildDrawer(col, colIdx === 0);
      drawersEl.appendChild(drawer);
    });
  }

  function buildDrawer(col, openByDefault) {
    const drawer = document.createElement('div');
    drawer.className = 'log-drawer' + (openByDefault ? ' is-open' : '');
    drawer.dataset.collection = col.name;

    // ── Header ───────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'log-drawer__header';
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.setAttribute('aria-expanded', openByDefault ? 'true' : 'false');
    header.setAttribute('aria-controls', 'drawer-body-' + sanitizeId(col.name));

    const arrow = document.createElement('span');
    arrow.className = 'log-drawer__arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '▸';

    const name = document.createElement('span');
    name.className = 'log-drawer__name';
    name.textContent = col.name;

    const meta = document.createElement('span');
    meta.className = 'log-drawer__meta';

    const dots = document.createElement('span');
    dots.className = 'log-drawer__dots';
    const dotCount = Math.min(col.cards.length, 8);
    for (let d = 0; d < dotCount; d++) {
      const dot = document.createElement('span');
      dot.className = 'log-drawer__dot';
      dots.appendChild(dot);
    }

    const count = document.createElement('span');
    count.className = 'log-drawer__count';
    count.textContent = col.cards.length + ' card' + (col.cards.length !== 1 ? 's' : '');

    meta.appendChild(dots);
    meta.appendChild(count);

    header.appendChild(arrow);
    header.appendChild(name);
    header.appendChild(meta);

    // ── Body ─────────────────────────────────────────────────
    const body = document.createElement('div');
    body.className = 'log-drawer__body';
    body.id = 'drawer-body-' + sanitizeId(col.name);

    const grid = document.createElement('div');
    grid.className = 'log-drawer__grid';
    grid.dataset.collection = col.name;

    if (col.cards.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'log-drawer__empty';
      empty.textContent = '~ no cards yet ~';
      grid.appendChild(empty);
    } else {
      col.cards.forEach(function (card, i) {
        const el = buildCard(card, i);
        grid.appendChild(el);
      });
    }

    body.appendChild(grid);

    drawer.appendChild(header);
    drawer.appendChild(body);

    // ── Toggle interaction ────────────────────────────────────
    function toggleDrawer() {
      const isOpen = drawer.classList.contains('is-open');
      if (isOpen) {
        drawer.classList.remove('is-open');
        header.setAttribute('aria-expanded', 'false');
      } else {
        drawer.classList.add('is-open');
        header.setAttribute('aria-expanded', 'true');
        // Stagger-in cards when opening
        staggerCards(grid);
      }
    }

    header.addEventListener('click', toggleDrawer);
    header.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleDrawer();
      }
    });

    // Stagger cards on first open (default open drawer)
    if (openByDefault) {
      requestAnimationFrame(function () { staggerCards(grid); });
    }

    return drawer;
  }

  function staggerCards(grid) {
    const cards = grid.querySelectorAll('.log-card--mini');
    cards.forEach(function (el, i) {
      el.style.setProperty('--stagger-i', i);
      // Reset animation so it re-runs on re-open
      el.style.animation = 'none';
      el.offsetHeight; // reflow
      el.style.animation = '';
    });
  }

  function sanitizeId(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  }

  // ─────────────────────────────────────────────────────────────
  // CARD BUILDER (mini — drawer variant)
  // ─────────────────────────────────────────────────────────────

  function buildCard(data, indexInDrawer) {
    const type    = data.type || 'moment';
    const rarity  = resolveRarity(data);
    const sigil   = SIGIL_MAP[type] || '◇';
    const num     = '#' + (data.number || '001');
    const fragment = data.fragment || '';
    const period  = data.period || '';
    const tags    = data.tags || '';
    const title   = data.title || '';

    const wrap = document.createElement('div');
    wrap.className = 'log-card log-card--' + type + ' log-card--holo-' + rarity + ' log-card--mini';
    wrap.dataset.type       = type;
    wrap.dataset.collection = data.collection || '';
    wrap.dataset.rarity     = rarity;
    wrap.dataset.index      = indexInDrawer;
    wrap.style.setProperty('--stagger-i', indexInDrawer);
    wrap.setAttribute('tabindex', '0');
    wrap.setAttribute('role', 'button');
    wrap.setAttribute('aria-label', 'Open card: ' + title);

    // ── Corner ornament ──────────────────────────────────────
    const ornament = document.createElement('div');
    ornament.className = 'log-card__ornament';
    ornament.setAttribute('aria-hidden', 'true');
    CORNER_SIGILS.forEach(function (s, ci) {
      const pos = ['tl', 'tr', 'bl', 'br'][ci];
      const span = document.createElement('span');
      span.className = 'log-card__corner log-card__corner--' + pos;
      span.textContent = s;
      ornament.appendChild(span);
    });
    wrap.appendChild(ornament);

    // ── Inner (flip wrapper) ─────────────────────────────────
    const inner = document.createElement('div');
    inner.className = 'log-card__inner';

    // ── Front face ───────────────────────────────────────────
    const front = document.createElement('div');
    front.className = 'log-card__front';

    // Header: type label (left) + sigil+number (right)
    const header = document.createElement('div');
    header.className = 'log-card__header';

    const typeLabel = document.createElement('span');
    typeLabel.className = 'log-card__type-label';
    typeLabel.innerHTML = '<span aria-hidden="true">' + sigil + '</span> ' + type.toUpperCase();

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

    // Photo slot (moment / food / object only)
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
        img.src = data.photo;
        img.alt = title + ' photo';
        img.loading = 'lazy';
        img.addEventListener('error', function () { img.classList.add('is-error'); });
        img.addEventListener('load', function () { placeholder.style.opacity = '0'; });
        photoWrap.appendChild(img);
      }
    }

    // Body: title + period + fragment + tags
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

    if (fragment) {
      const fragmentEl = document.createElement('p');
      fragmentEl.className = 'log-card__flavor';
      fragmentEl.textContent = fragment;
      bodyEl.appendChild(fragmentEl);
    }

    if (tags) {
      const tagsEl = document.createElement('p');
      tagsEl.className = 'log-card__tags';
      tagsEl.textContent = tags;
      bodyEl.appendChild(tagsEl);
    }

    // Shine overlay (legacy — visible on common)
    const shine = document.createElement('div');
    shine.className = 'log-card__shine';
    front.appendChild(shine);

    front.appendChild(header);
    if (photoWrap) front.appendChild(photoWrap);
    front.appendChild(bodyEl);

    // ── Back face ─────────────────────────────────────────────
    const back = document.createElement('div');
    back.className = 'log-card__back';

    const backBody = document.createElement('p');
    backBody.className = 'log-card__back-body';
    backBody.textContent = fragment;

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

    inner.appendChild(front);
    inner.appendChild(back);
    wrap.appendChild(inner);

    // ── Bind chrome ──────────────────────────────────────────
    bindCardHolo(wrap);
    bindCardClick(wrap, data);

    // Keyboard open detail
    wrap.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDetail(data);
      }
    });

    return wrap;
  }

  // ─────────────────────────────────────────────────────────────
  // TYPE FILTER
  // ─────────────────────────────────────────────────────────────

  function bindFilterChips() {
    if (!filterRow) return;
    filterRow.querySelectorAll('.log-filter-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyTypeFilter(btn.dataset.filter);
      });
    });
  }

  function applyTypeFilter(filter) {
    if (filter === state.activeFilter) return;
    state.activeFilter = filter;

    // Update chip active state
    filterRow.querySelectorAll('.log-filter-chip').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.dataset.filter === filter);
    });

    // Show/hide cards across all drawers
    document.querySelectorAll('.log-drawer__grid .log-card--mini').forEach(function (el) {
      const cardType = el.dataset.type || '';
      const visible = filter === 'all' || cardType === filter;
      el.style.display = visible ? '' : 'none';
    });

    // Update drawer counts to reflect visible cards
    document.querySelectorAll('.log-drawer').forEach(function (drawer) {
      const grid = drawer.querySelector('.log-drawer__grid');
      const countEl = drawer.querySelector('.log-drawer__count');
      if (!grid || !countEl) return;

      const visibleCards = grid.querySelectorAll('.log-card--mini:not([style*="display: none"])');
      const n = visibleCards.length;
      countEl.textContent = n + ' card' + (n !== 1 ? 's' : '');

      // Update dot strip
      const dotsEl = drawer.querySelector('.log-drawer__dots');
      if (dotsEl) {
        dotsEl.innerHTML = '';
        const dotCount = Math.min(n, 8);
        for (let d = 0; d < dotCount; d++) {
          const dot = document.createElement('span');
          dot.className = 'log-drawer__dot';
          dotsEl.appendChild(dot);
        }
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // SHUFFLE
  // ─────────────────────────────────────────────────────────────

  function shuffleAllCards() {
    document.querySelectorAll('.log-drawer__grid').forEach(function (grid) {
      const cards = Array.from(grid.querySelectorAll('.log-card--mini'));
      if (cards.length < 2) return;

      // Fisher-Yates shuffle
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        if (i !== j) {
          grid.insertBefore(cards[j], cards[i]);
          grid.insertBefore(cards[i], cards[j].nextSibling);
        }
      }

      // Re-stagger after shuffle
      const drawer = grid.closest('.log-drawer');
      if (drawer && drawer.classList.contains('is-open')) {
        staggerCards(grid);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // HOLOGRAPHIC FOIL + TILT (preserved from Phase 1)
  // ─────────────────────────────────────────────────────────────

  function bindCardHolo(el) {
    if (prefersReducedMotion) return;

    let rafPending = false;
    let pendingX = 0, pendingY = 0;

    el.addEventListener('pointermove', function (e) {
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(function () {
          rafPending = false;
          applyHolo(el, pendingX, pendingY);
        });
      }
    });

    el.addEventListener('pointerleave', function () {
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

    el.addEventListener('pointerenter', function () {
      el.classList.add('is-holo-active');
    });
  }

  function applyHolo(el, clientX, clientY) {
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const nx  = (clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2);
    const ny  = (clientY - (rect.top  + rect.height / 2)) / (rect.height / 2);
    const cnx = Math.max(-1, Math.min(1, nx));
    const cny = Math.max(-1, Math.min(1, ny));

    const rotX   = (-cny * TILT_MAX_DEG).toFixed(2) + 'deg';
    const rotY   = ( cnx * TILT_MAX_DEG).toFixed(2) + 'deg';
    const holoTx = (cnx * 40).toFixed(1);
    const holoTy = (cny * 40).toFixed(1);
    const cursorX = ((cnx + 1) / 2 * 100).toFixed(1) + '%';
    const cursorY = ((cny + 1) / 2 * 100).toFixed(1) + '%';

    el.style.setProperty('--cursor-rx', rotX);
    el.style.setProperty('--cursor-ry', rotY);
    el.style.setProperty('--holo-tx', holoTx);
    el.style.setProperty('--holo-ty', holoTy);
    el.style.setProperty('--cursor-x', cursorX);
    el.style.setProperty('--cursor-y', cursorY);

    // 3D tilt — mini cards in grid use relative positioning
    el.style.transform = 'perspective(700px) rotateX(' + rotX + ') rotateY(' + rotY + ') translateY(-3px)';
  }

  // ─────────────────────────────────────────────────────────────
  // DETAIL VIEW (preserved from Phase 1)
  // ─────────────────────────────────────────────────────────────

  function bindCardClick(el, data) {
    el.addEventListener('click', function (e) {
      if (e.target.classList.contains('log-card__back-link')) return;
      openDetail(data);
    });
  }

  function openDetail(data) {
    if (!overlayEl) return;
    state.detailOpen = true;

    overlayEl.innerHTML = '';
    overlayEl.removeAttribute('hidden');

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'log-detail-close';
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

    // Build the detail card
    const detailCard = buildDetailCard(data);
    wrapper.appendChild(detailCard);
    state.detailCard = detailCard;

    requestAnimationFrame(function () {
      overlayEl.classList.add('is-visible');
    });

    bindDetailHolo(detailCard);

    detailCard.addEventListener('click', function (e) {
      if (e.target.classList.contains('log-detail-card__back-link')) return;
      detailCard.classList.toggle('is-flipped');
    });

    overlayEl.addEventListener('click', function (e) {
      if (e.target === overlayEl || e.target === hint) closeDetail();
    });

    closeBtn.addEventListener('click', closeDetail);
    document.addEventListener('keydown', onDetailKeydown);
    closeBtn.focus();
  }

  function buildDetailCard(data) {
    const type    = data.type || 'moment';
    const rarity  = resolveRarity(data);
    const sigil   = SIGIL_MAP[type] || '◇';
    const title   = data.title || '';
    const fragment = data.fragment || '';
    const period  = data.period || '';
    const body    = data.body || '';

    const card = document.createElement('div');
    card.className = 'log-detail-card log-card--' + type + ' log-card--holo-' + rarity;
    card.dataset.rarity = rarity;
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Card: ' + title + '. Click to flip.');

    // Corner ornament
    const ornament = document.createElement('div');
    ornament.className = 'log-card__ornament';
    ornament.setAttribute('aria-hidden', 'true');
    [{ cls: 'tl', s: '✦' }, { cls: 'tr', s: '⊹' }, { cls: 'bl', s: '✦' }, { cls: 'br', s: '⊹' }]
      .forEach(function (c) {
        const span = document.createElement('span');
        span.className = 'log-card__corner log-card__corner--' + c.cls;
        span.textContent = c.s;
        ornament.appendChild(span);
      });
    card.appendChild(ornament);

    // ── Front face ───────────────────────────────────────────
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
      img.addEventListener('error', function () { img.classList.add('is-error'); });
      img.addEventListener('load', function () { placeholder.style.opacity = '0'; });
      photoWrap.appendChild(img);
    }

    // Header overlay on photo
    const header = document.createElement('div');
    header.className = 'log-card__header';
    header.style.cssText = 'position:absolute;top:0;left:0;right:0;z-index:3;background:linear-gradient(180deg,rgba(18,19,24,.7) 0%,transparent 100%);padding:.9rem 1.1rem .6rem;';

    const titleEl = document.createElement('span');
    titleEl.className = 'log-card__title';
    titleEl.style.fontSize = '1.05rem';
    titleEl.textContent = title;

    const badge = document.createElement('div');
    badge.className = 'log-card__badge';
    const sigilEl = document.createElement('span');
    sigilEl.className = 'log-card__sigil';
    sigilEl.setAttribute('aria-hidden', 'true');
    sigilEl.textContent = sigil;
    const numEl = document.createElement('span');
    numEl.className = 'log-card__number';
    numEl.textContent = '#' + (data.number || '001');
    badge.appendChild(sigilEl);
    badge.appendChild(numEl);
    header.appendChild(titleEl);
    header.appendChild(badge);

    photoWrap.appendChild(header);

    // Body area
    const bodyArea = document.createElement('div');
    bodyArea.className = 'log-card__body';
    bodyArea.style.flex = '1';

    if (period) {
      const periodEl = document.createElement('p');
      periodEl.className = 'log-card__period';
      periodEl.textContent = period;
      bodyArea.appendChild(periodEl);
    }

    if (fragment) {
      const fragmentEl = document.createElement('p');
      fragmentEl.className = 'log-card__flavor';
      fragmentEl.style.fontSize = '.92rem';
      fragmentEl.textContent = fragment;
      bodyArea.appendChild(fragmentEl);
    }

    // Footer: type label (no date shown)
    const footer = document.createElement('div');
    footer.className = 'log-card__footer';
    const typeLabel = document.createElement('span');
    typeLabel.className = 'log-card__type-label';
    typeLabel.innerHTML = '<span aria-hidden="true">' + sigil + '</span> ' + type.toUpperCase();
    footer.appendChild(typeLabel);

    front.appendChild(photoWrap);
    front.appendChild(bodyArea);
    front.appendChild(footer);

    card.appendChild(front);

    // ── Back face ────────────────────────────────────────────
    const back = document.createElement('div');
    back.className = 'log-detail-card__back';

    const backHeader = document.createElement('div');
    backHeader.className = 'log-detail-card__back-header';
    const backTitle = document.createElement('span');
    backTitle.className = 'log-detail-card__back-title';
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
    } else if (fragment) {
      const p = document.createElement('p');
      p.textContent = fragment;
      backBody.appendChild(p);
    }

    const backFooter = document.createElement('div');
    backFooter.className = 'log-detail-card__back-footer';
    const backHint = document.createElement('span');
    backHint.className = 'log-detail-card__back-hint';
    backHint.textContent = '↑ click to flip back';
    const backLink = document.createElement('a');
    backLink.className = 'log-detail-card__back-link';
    backLink.href = data.url || '#';
    backLink.textContent = 'read full →';
    backFooter.appendChild(backHint);
    backFooter.appendChild(backLink);

    back.appendChild(backHeader);
    back.appendChild(backBody);
    back.appendChild(backFooter);

    card.appendChild(back);

    return card;
  }

  function closeDetail() {
    if (!overlayEl) return;
    state.detailOpen = false;
    state.detailCard = null;
    overlayEl.classList.remove('is-visible');
    document.removeEventListener('keydown', onDetailKeydown);
    setTimeout(function () {
      overlayEl.innerHTML = '';
      overlayEl.setAttribute('hidden', '');
    }, 320);
  }

  function onDetailKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeDetail();
    }
    if (e.key === 'Tab' && overlayEl) {
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
  }

  function bindDetailHolo(el) {
    if (prefersReducedMotion) return;

    const DETAIL_TILT = 8;
    let rafPending = false;
    let pendingX = 0, pendingY = 0;

    el.addEventListener('pointermove', function (e) {
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(function () {
          rafPending = false;
          applyDetailHolo(el, pendingX, pendingY, DETAIL_TILT);
        });
      }
    });

    el.addEventListener('pointerleave', function () {
      rafPending = false;
      el.style.setProperty('--cursor-rx', '0deg');
      el.style.setProperty('--cursor-ry', '0deg');
      el.style.setProperty('--holo-tx', '0');
      el.style.setProperty('--holo-ty', '0');
      el.style.setProperty('--cursor-x', '50%');
      el.style.setProperty('--cursor-y', '50%');
    });
  }

  function applyDetailHolo(el, clientX, clientY, maxTilt) {
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const nx  = (clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2);
    const ny  = (clientY - (rect.top  + rect.height / 2)) / (rect.height / 2);
    const cnx = Math.max(-1, Math.min(1, nx));
    const cny = Math.max(-1, Math.min(1, ny));

    const rotX    = (-cny * maxTilt).toFixed(2) + 'deg';
    const rotY    = ( cnx * maxTilt).toFixed(2) + 'deg';
    const holoTx  = (cnx * 40).toFixed(1);
    const holoTy  = (cny * 40).toFixed(1);
    const cursorX = ((cnx + 1) / 2 * 100).toFixed(1) + '%';
    const cursorY = ((cny + 1) / 2 * 100).toFixed(1) + '%';

    el.style.setProperty('--cursor-rx', rotX);
    el.style.setProperty('--cursor-ry', rotY);
    el.style.setProperty('--holo-tx', holoTx);
    el.style.setProperty('--holo-ty', holoTy);
    el.style.setProperty('--cursor-x', cursorX);
    el.style.setProperty('--cursor-y', cursorY);
  }

})();
