// wiki-signals.js — Stagger reveal for Wiki cards
(function () {
  'use strict';

  var STAGGER_MS = 80;

  function staggerReveal(cards) {
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    cards.forEach(function (card, i) {
      if (reduced) {
        card.style.opacity = '1';
        card.style.transform = 'none';
        card.classList.add('wiki-card--visible');
        return;
      }
      card.style.animationDelay = (i * STAGGER_MS) + 'ms';
      card.classList.add('wiki-card--visible');
    });
  }

  function init() {
    var cards = Array.prototype.slice.call(
      document.querySelectorAll('.wiki-card')
    );
    if (!cards.length) return;
    staggerReveal(cards);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
