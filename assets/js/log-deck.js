// ─────────────────────────────────────────────────────────────
// log-deck.js  ·  Card Collection deck engine
// Pokémon-inspired deck interaction for ✺ Log
// ─────────────────────────────────────────────────────────────

(function () {
  'use strict';

  // ── Constants ───────────────────────────────────────────────
  const SIGIL_MAP = {
    food:    '✺',
    art:     '⊹',
    travel:  '✦',
    daily:   '⌖',
  };

  const DRAG_THRESHOLD   = 80;   // px before advancing card
  const SWIPE_UP_THRESH  = -100; // py before fly-off
  const DOUBLETAP_MS     = 300;  // double-tap window
  const TILT_MAX_DEG     = 10;   // max 3D tilt degrees
  const PACK_OPEN_KEY    = 'log_pack_opened';

  // ── State ────────────────────────────────────────────────────
  const state = {
    allCards:      [],
    filteredCards: [],
    currentIndex:  0,
    activeFilter:  'all',
    viewMode:      'spotlight', // 'spotlight' | 'grid'
    isDragging:    false,
    dragStartX:    0,
    dragStartY:    0,
    dragCurrentX:  0,
    lastTapTime:   0,
  };

  // ── DOM refs ─────────────────────────────────────────────────
  let stageEl, dotsEl, gridEl, filterRow, toggleBtn, shuffleBtn;

  // ── Init ─────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    const cards = window.__LOG_CARDS__;
    if (!cards || !cards.length) return;

    stageEl    = document.getElementById('log-stage');
    dotsEl     = document.getElementById('log-dots');
    gridEl     = document.getElementById('log-grid');
    filterRow  = document.querySelector('.log-toolbar__filters');
    toggleBtn  = document.querySelector('.log-view-toggle');
    shuffleBtn = document.querySelector('.log-shuffle');

    if (!stageEl) return;

    state.allCards      = cards;
    state.filteredCards = cards.slice();

    buildFilterChips();
    bindToolbar();
    renderSpotlight();
    bindKeyboard();
  });

  // ── Build dynamic filter chips ───────────────────────────────
  function buildFilterChips() {
    // collect unique types
    const types = ['all'];
    state.allCards.forEach(function (c) {
      if (c.type && !types.includes(c.type)) types.push(c.type);
    });

    // remove existing non-'all' chips (noscript fallback already hidden)
    Array.from(filterRow.querySelectorAll('.log-filter-chip:not([data-filter="all"])')).forEach(function (el) {
      el.remove();
    });

    // append dynamic chips
    types.slice(1).forEach(function (type) {
      const btn = document.createElement('button');
      btn.className    = 'log-filter-chip';
      btn.dataset.filter = type;
      btn.type         = 'button';
      btn.textContent  = type;
      filterRow.appendChild(btn);
    });

    // bind all chips
    filterRow.querySelectorAll('.log-filter-chip').forEach(function (btn) {
      btn.addEventListener('click', function () { applyFilter(btn.dataset.filter); });
    });
  }

  // ── Filter ───────────────────────────────────────────────────
  function applyFilter(filter) {
    if (filter === state.activeFilter) return;
    state.activeFilter = filter;

    // update chip active state
    filterRow.querySelectorAll('.log-filter-chip').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.dataset.filter === filter);
    });

    const prev = state.filteredCards.slice();

    if (filter === 'all') {
      state.filteredCards = state.allCards.slice();
    } else {
      state.filteredCards = state.allCards.filter(function (c) { return c.type === filter; });
    }

    state.currentIndex = 0;

    if (state.viewMode === 'spotlight') {
      reshuffleSpotlight(prev);
    } else {
      reshuffleGrid();
    }
  }

  // ── Shuffle ──────────────────────────────────────────────────
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function doShuffle() {
    const prevFilter = state.filteredCards.slice();
    shuffleArray(state.filteredCards);
    state.currentIndex = 0;

    if (state.viewMode === 'spotlight') {
      reshuffleSpotlight(prevFilter);
    } else {
      reshuffleGrid();
    }
  }

  // ── Toolbar bindings ─────────────────────────────────────────
  function bindToolbar() {
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', doShuffle);
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        if (state.viewMode === 'spotlight') {
          switchToGrid();
        } else {
          switchToSpotlight();
        }
      });
    }
  }

  function switchToGrid() {
    state.viewMode = 'grid';
    document.getElementById('log-spotlight').style.display = 'none';
    gridEl.removeAttribute('hidden');
    toggleBtn.querySelector('.log-view-toggle__label').textContent = '◇ spotlight';
    toggleBtn.classList.add('is-grid-active');
    renderGrid();
  }

  function switchToSpotlight() {
    state.viewMode = 'spotlight';
    document.getElementById('log-spotlight').style.display = '';
    gridEl.setAttribute('hidden', '');
    toggleBtn.querySelector('.log-view-toggle__label').textContent = '▦ grid';
    toggleBtn.classList.remove('is-grid-active');
    renderSpotlight();
  }

  // ─────────────────────────────────────────────────────────────
  // SPOTLIGHT RENDER
  // ─────────────────────────────────────────────────────────────

  function renderSpotlight() {
    stageEl.innerHTML = '';
    const cards = state.filteredCards;

    if (!cards.length) {
      stageEl.innerHTML = '<p class="log-empty">~ no entries ~</p>';
      dotsEl.innerHTML  = '';
      return;
    }

    const idx  = state.currentIndex;
    const card = cards[idx];

    // First-visit pack-opening
    const isFirstVisit = !sessionStorage.getItem(PACK_OPEN_KEY);
    if (isFirstVisit && idx === 0) {
      sessionStorage.setItem(PACK_OPEN_KEY, '1');
    }

    const el = buildCard(card, false, isFirstVisit && idx === 0);
    el.style.position = 'absolute';
    el.style.top      = '0';
    el.style.left     = '50%';
    el.style.transform = 'translateX(-50%)';
    stageEl.appendChild(el);

    bindCardPointer(el);
    bindCardTilt(el);
    renderDots();
  }

  function reshuffleSpotlight() {
    const existing = stageEl.querySelector('.log-card');
    if (existing) {
      const rot = (Math.random() * 10 - 5).toFixed(1) + 'deg';
      existing.style.setProperty('--shuffle-rot', rot);
      existing.classList.add('is-reshuffle-out');
      setTimeout(function () { renderSpotlight(); }, 220);
    } else {
      renderSpotlight();
    }
  }

  // ── Dots ────────────────────────────────────────────────────
  function renderDots() {
    const cards   = state.filteredCards;
    const total   = cards.length;
    const current = state.currentIndex;

    if (total <= 1) { dotsEl.innerHTML = ''; return; }

    // show window of 7 dots max, centred on current
    const WINDOW = 7;
    let start = Math.max(0, current - Math.floor(WINDOW / 2));
    const end = Math.min(total, start + WINDOW);
    start = Math.max(0, end - WINDOW);

    dotsEl.innerHTML = '';
    for (let i = start; i < end; i++) {
      const dot = document.createElement('button');
      dot.className = 'log-dot' + (i === current ? ' is-current' : '');
      dot.type = 'button';
      dot.setAttribute('aria-label', 'Go to card ' + (i + 1));
      (function (idx) {
        dot.addEventListener('click', function () { goTo(idx); });
      })(i);
      dotsEl.appendChild(dot);
    }
  }

  function goTo(idx) {
    idx = Math.max(0, Math.min(state.filteredCards.length - 1, idx));
    state.currentIndex = idx;
    renderSpotlight();
  }

  function advance(delta) {
    const len = state.filteredCards.length;
    if (!len) return;
    state.currentIndex = (state.currentIndex + delta + len) % len;
    renderSpotlight();
  }

  // ─────────────────────────────────────────────────────────────
  // GRID RENDER
  // ─────────────────────────────────────────────────────────────

  function renderGrid() {
    gridEl.innerHTML = '';
    const cards = state.filteredCards;

    if (!cards.length) {
      gridEl.innerHTML = '<p class="log-empty">~ no entries ~</p>';
      return;
    }

    cards.forEach(function (card, i) {
      const el = buildCard(card, true, false);
      el.style.animationDelay = (i * 45) + 'ms';
      el.classList.add('log-card--mini');
      el.addEventListener('click', function () {
        state.currentIndex = i;
        switchToSpotlight();
      });
      gridEl.appendChild(el);
    });

    // trigger animation
    requestAnimationFrame(function () {
      gridEl.querySelectorAll('.log-card--mini').forEach(function (el) {
        el.classList.add('is-visible');
      });
    });
  }

  function reshuffleGrid() {
    gridEl.querySelectorAll('.log-card--mini').forEach(function (el, i) {
      const rot = (Math.random() * 8 - 4).toFixed(1) + 'deg';
      el.style.setProperty('--shuffle-rot', rot);
      el.style.animationDelay = (i * 30) + 'ms';
      el.classList.add('is-reshuffle-out');
    });
    setTimeout(function () { renderGrid(); }, 250);
  }

  // ─────────────────────────────────────────────────────────────
  // CARD BUILDER
  // ─────────────────────────────────────────────────────────────

  function buildCard(data, isMini, packOpen) {
    const type   = data.type || 'daily';
    const sigil  = SIGIL_MAP[type] || '✺';
    const num    = '#' + (data.number || '001');
    const flavor = data.flavor || '';
    const loc    = data.location || '';
    const body   = data.body || '';
    const title  = data.title || '';
    const date   = data.date ? data.date.slice(5) : ''; // MM-DD

    const wrap = document.createElement('div');
    wrap.className = 'log-card log-card--' + type;
    if (packOpen) wrap.classList.add('is-pack-open');
    else if (!isMini) wrap.classList.add('is-fan-in');

    // ── Front face ──────────────────────────────────────────
    const front = document.createElement('div');
    front.className = 'log-card__front';

    // header
    const header = document.createElement('div');
    header.className = 'log-card__header';

    const titleEl = document.createElement('span');
    titleEl.className = 'log-card__title';
    titleEl.textContent = title;

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
    header.appendChild(titleEl);
    header.appendChild(badge);

    // photo
    const photoWrap = document.createElement('div');
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
      img.addEventListener('error', function () {
        img.classList.add('is-error');
      });
      img.addEventListener('load', function () {
        placeholder.style.opacity = '0';
      });
      photoWrap.appendChild(img);
    }

    // body
    const bodyEl = document.createElement('div');
    bodyEl.className = 'log-card__body';

    if (loc) {
      const locEl = document.createElement('p');
      locEl.className = 'log-card__location';
      locEl.textContent = loc;
      bodyEl.appendChild(locEl);
    }

    if (flavor) {
      const flavorEl = document.createElement('p');
      flavorEl.className = 'log-card__flavor';
      flavorEl.textContent = flavor;
      bodyEl.appendChild(flavorEl);
    }

    // footer
    const footer = document.createElement('div');
    footer.className = 'log-card__footer';

    const typeLabel = document.createElement('span');
    typeLabel.className = 'log-card__type-label';
    typeLabel.innerHTML = '<span aria-hidden="true">' + sigil + '</span> ' + type;

    const dateEl = document.createElement('span');
    dateEl.className = 'log-card__date';
    dateEl.textContent = date;

    footer.appendChild(typeLabel);
    footer.appendChild(dateEl);

    front.appendChild(header);
    front.appendChild(photoWrap);
    front.appendChild(bodyEl);
    front.appendChild(footer);

    // ── Shine overlay ────────────────────────────────────────
    const shine = document.createElement('div');
    shine.className = 'log-card__shine';
    front.appendChild(shine);

    // ── Back face ────────────────────────────────────────────
    const back = document.createElement('div');
    back.className = 'log-card__back';

    const backBody = document.createElement('p');
    backBody.className = 'log-card__back-body';
    backBody.textContent = body || flavor;

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

    // ── Inner (flip wrapper) ─────────────────────────────────
    const inner = document.createElement('div');
    inner.className = 'log-card__inner';
    inner.appendChild(front);
    inner.appendChild(back);
    wrap.appendChild(inner);

    return wrap;
  }

  // ─────────────────────────────────────────────────────────────
  // POINTER: drag + swipe + double-tap + flip
  // ─────────────────────────────────────────────────────────────

  function bindCardPointer(el) {
    // Mouse
    el.addEventListener('mousedown', onDragStart);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);

    // Touch
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
  }

  function onDragStart(e) {
    if (e.button !== 0) return;
    state.isDragging  = true;
    state.dragStartX  = e.clientX;
    state.dragStartY  = e.clientY;
    state.dragCurrentX = e.clientX;
    e.currentTarget.classList.add('is-dragging');
  }

  function onDragMove(e) {
    if (!state.isDragging) return;
    state.dragCurrentX = e.clientX;
    const dx = e.clientX - state.dragStartX;
    const dy = e.clientY - state.dragStartY;
    const card = stageEl.querySelector('.log-card');
    if (!card) return;
    const rot = dx * 0.04;
    card.style.transform = 'translateX(calc(-50% + ' + dx + 'px)) translateY(' + dy + 'px) rotate(' + rot + 'deg)';
  }

  function onDragEnd(e) {
    if (!state.isDragging) return;
    state.isDragging = false;

    const card = stageEl.querySelector('.log-card');
    if (!card) return;
    card.classList.remove('is-dragging');

    const dx = e.clientX - state.dragStartX;
    const dy = e.clientY - state.dragStartY;

    if (dy < SWIPE_UP_THRESH && Math.abs(dx) < 120) {
      flyOff(card, function () { advance(1); });
    } else if (Math.abs(dx) > DRAG_THRESHOLD) {
      flyOff(card, function () { advance(dx < 0 ? 1 : -1); });
    } else {
      // snap back
      card.style.transition = 'transform .32s cubic-bezier(.34,1.56,.64,1)';
      card.style.transform  = 'translateX(-50%)';
      setTimeout(function () { card.style.transition = ''; }, 320);
    }
  }

  function onTouchStart(e) {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    state.isDragging   = true;
    state.dragStartX   = t.clientX;
    state.dragStartY   = t.clientY;
    state.dragCurrentX = t.clientX;

    // double-tap detection
    const now = Date.now();
    if (now - state.lastTapTime < DOUBLETAP_MS) {
      flipCard(e.currentTarget);
    }
    state.lastTapTime = now;
  }

  function onTouchMove(e) {
    if (!state.isDragging || e.touches.length !== 1) return;
    const t  = e.touches[0];
    const dx = t.clientX - state.dragStartX;
    const dy = t.clientY - state.dragStartY;

    // if primarily horizontal, prevent page scroll
    if (Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
    }

    state.dragCurrentX = t.clientX;
    const card = stageEl.querySelector('.log-card');
    if (!card) return;
    const rot = dx * 0.04;
    card.style.transform = 'translateX(calc(-50% + ' + dx + 'px)) translateY(' + dy + 'px) rotate(' + rot + 'deg)';
  }

  function onTouchEnd(e) {
    if (!state.isDragging) return;
    state.isDragging = false;

    const t  = e.changedTouches[0];
    const dx = t.clientX - state.dragStartX;
    const dy = t.clientY - state.dragStartY;
    const card = stageEl.querySelector('.log-card');
    if (!card) return;

    if (dy < SWIPE_UP_THRESH && Math.abs(dx) < 120) {
      flyOff(card, function () { advance(1); });
    } else if (Math.abs(dx) > DRAG_THRESHOLD) {
      flyOff(card, function () { advance(dx < 0 ? 1 : -1); });
    } else {
      card.style.transition = 'transform .32s cubic-bezier(.34,1.56,.64,1)';
      card.style.transform  = 'translateX(-50%)';
      setTimeout(function () { card.style.transition = ''; }, 320);
    }
  }

  function flyOff(card, cb) {
    card.classList.add('is-flying-off');
    card.addEventListener('animationend', function () { cb(); }, { once: true });
  }

  // ── 3D tilt on hover ─────────────────────────────────────────
  function bindCardTilt(el) {
    el.addEventListener('mousemove', function (e) {
      const rect = el.getBoundingClientRect();
      const cx   = rect.left + rect.width / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) / (rect.width  / 2);
      const dy   = (e.clientY - cy) / (rect.height / 2);
      const rotX = (-dy * TILT_MAX_DEG).toFixed(2);
      const rotY = ( dx * TILT_MAX_DEG).toFixed(2);
      el.style.transform = 'translateX(-50%) perspective(900px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';
    });

    el.addEventListener('mouseleave', function () {
      el.style.transition = 'transform .35s ease';
      el.style.transform  = 'translateX(-50%)';
      setTimeout(function () { el.style.transition = ''; }, 350);
    });
  }

  // ── Card flip ─────────────────────────────────────────────────
  function flipCard(cardEl) {
    cardEl.classList.toggle('is-flipped');
  }

  // ─────────────────────────────────────────────────────────────
  // KEYBOARD
  // ─────────────────────────────────────────────────────────────

  function bindKeyboard() {
    document.addEventListener('keydown', function (e) {
      if (state.viewMode !== 'spotlight') return;
      // only when log page is in view
      const spotlight = document.getElementById('log-spotlight');
      if (!spotlight) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          advance(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          advance(1);
          break;
        case 'ArrowUp': {
          e.preventDefault();
          const card = stageEl.querySelector('.log-card');
          if (card) flipCard(card);
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          const card2 = stageEl.querySelector('.log-card');
          if (card2) flyOff(card2, function () { advance(1); });
          break;
        }
      }
    });
  }

})();
