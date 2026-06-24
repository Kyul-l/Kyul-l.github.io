// wiki-signals.js — Live Signals for Wiki Cloud Focus page
// Reads data-updated attributes from .wiki-card elements,
// marks fresh cards (< 7d), injects weekly stat, stagger-reveals cards.

(function () {
  'use strict';

  var FRESH_DAYS = 7;
  var STAGGER_MS = 80;

  function parseUpdated(dateStr) {
    if (!dateStr) return null;
    var d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  function daysSince(date) {
    var now = new Date();
    var diff = now - date;
    return diff / (1000 * 60 * 60 * 24);
  }

  function isFresh(dateStr) {
    var d = parseUpdated(dateStr);
    if (!d) return false;
    return daysSince(d) <= FRESH_DAYS;
  }

  function markFreshCards(cards) {
    var freshCount = 0;
    cards.forEach(function (card) {
      var updated = card.getAttribute('data-updated');
      if (isFresh(updated)) {
        card.classList.add('is-fresh');
        freshCount++;
      }
    });
    return freshCount;
  }

  function renderWeeklyStat(freshCount) {
    var slot = document.querySelector('.wiki-weeklystat');
    if (!slot) return;
    var dot = document.createElement('span');
    dot.className = 'wiki-weeklystat__dot';
    var text = document.createTextNode(
      freshCount > 0
        ? '+ ' + freshCount + (freshCount === 1 ? ' entry' : ' entries') + ' this week'
        : 'no updates this week'
    );
    slot.innerHTML = '';
    slot.appendChild(dot);
    slot.appendChild(text);
  }

  function staggerReveal(cards) {
    // Respect prefers-reduced-motion
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    cards.forEach(function (card, i) {
      if (reduced) {
        card.style.opacity = '1';
        card.style.transform = 'none';
        card.classList.add('wiki-card--visible');
        return;
      }
      var delay = i * STAGGER_MS;
      card.style.animationDelay = delay + 'ms';
      card.classList.add('wiki-card--visible');
    });
  }

  function injectNewBadge(card) {
    // Find the first .wiki-card__entry and prepend NEW badge if card is fresh
    if (!card.classList.contains('is-fresh')) return;
    var firstEntry = card.querySelector('.wiki-card__entry--first');
    if (!firstEntry) return;
    var link = firstEntry.querySelector('a');
    if (!link) return;

    // Only inject if not already present
    if (firstEntry.querySelector('.wiki-card__new')) return;

    var badge = document.createElement('span');
    badge.className = 'wiki-card__new';
    badge.textContent = 'NEW';
    link.parentNode.insertBefore(badge, link);
  }

  function init() {
    var cards = Array.prototype.slice.call(
      document.querySelectorAll('.wiki-card')
    );
    if (!cards.length) return;

    var freshCount = markFreshCards(cards);
    cards.forEach(injectNewBadge);
    renderWeeklyStat(freshCount);
    staggerReveal(cards);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
