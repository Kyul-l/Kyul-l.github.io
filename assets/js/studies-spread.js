
(function () {
    'use strict';

    var SWAP_DURATION   = 200;
    var ROTATE_INTERVAL = 8000;

    var data          = null;
    var allEntries    = [];
    var currentEntry  = null;
    var rotateTimer   = null;
    var rotateIndex   = 0;
    var isUserHovering = false;
    var activeSeriesEl = null;

    var preview         = null;
    var seriesItems     = [];

    document.addEventListener('DOMContentLoaded', function () {
        data = window.__STUDIES_SERIES__;
        if (!data) return;

        preview     = document.querySelector('.studies-preview');
        seriesItems = Array.from(document.querySelectorAll('.studies-series'));

        if (!preview || seriesItems.length === 0) return;

        var spread = document.querySelector('.studies-spread');
        if (spread) spread.classList.add('is-js-ready');

        if (window.matchMedia && window.matchMedia('(hover: none)').matches) {
            var hint = document.querySelector('.studies-spread__hint');
            if (hint) hint.textContent = '← tap a title';
        }

        buildFlatEntries();

        seriesItems.forEach(bindSeriesItem);

        if (allEntries.length > 0) {
            showEntry(allEntries[0], true);
        }
    });

    function markInteracted() {
        var right = document.querySelector('.studies-spread__right');
        if (right) right.classList.add('has-interacted');
    }

    function buildFlatEntries() {
        allEntries = [];
        data.forEach(function (group) {
            if (group.entries && group.entries.length > 0) {
                allEntries.push(group.entries[0]);
            }
        });
        allEntries.sort(function (a, b) {
            return (b.date || '').localeCompare(a.date || '');
        });
    }

    function bindSeriesItem(el) {
        var key = el.getAttribute('data-series');

        el.addEventListener('click', function (e) {
            e.preventDefault();
            markInteracted();
            toggleEpisodes(el, key);
        });

        el.addEventListener('mouseenter', markInteracted, { once: true });

        el.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                markInteracted();
                toggleEpisodes(el, key);
            }
        });
    }

    function toggleEpisodes(el, key) {
        var episodeList = el.nextElementSibling;
        if (!episodeList || !episodeList.classList.contains('studies-episodes')) return;

        var isOpen = !episodeList.hidden;

        document.querySelectorAll('.studies-episodes').forEach(function (list) {
            list.hidden = true;
            list.querySelectorAll('.studies-episode').forEach(function (ep) {
                ep.classList.remove('stagger-reveal');
                ep.style.opacity = '0';
                ep.style.transform = 'translateY(3px)';
            });
        });
        document.querySelectorAll('.studies-series').forEach(function (s) {
            s.classList.remove('studies-series--active');
        });
        activeSeriesEl = null;

        if (!isOpen) {
            episodeList.hidden = false;
            el.classList.add('studies-series--active');
            activeSeriesEl = el;

            var episodes = episodeList.querySelectorAll('.studies-episode');
            episodes.forEach(function (ep) {
                void ep.offsetWidth;
                ep.classList.add('stagger-reveal');
            });

            var group = findGroup(key);
            if (group && group.entries.length > 0) {
                swapPreview(group.entries[0]);
            }
        }
    }

    function swapPreview(entry) {
        if (!preview) return;
        currentEntry = entry;

        preview.classList.add('is-swapping');
        setTimeout(function () {
            renderPreview(entry);
            preview.classList.remove('is-swapping');
        }, SWAP_DURATION);
    }

    function showEntry(entry, immediate) {
        currentEntry = entry;
        if (immediate) {
            renderPreview(entry);
        } else {
            swapPreview(entry);
        }
    }

    function renderPreview(entry) {
        if (!preview) return;

        var fromLabel = entry.series || 'Singles';
        var partLabel = entry.part ? ' · part ' + entry.part : '';
        if (entry.total) partLabel += ' of ' + entry.total;

        var html = '';

        html += '<p class="studies-preview__from">';
        html += '<span class="studies-preview__from-sigil" aria-hidden="true">FROM</span>';
        html += ' <span class="studies-preview__from-series">◇ ' + escHtml(fromLabel) + '</span>';
        html += '</p>';

        html += '<h3 class="studies-preview__title">' + escHtml(entry.title) + '</h3>';

        html += '<p class="studies-preview__meta">';
        html += escHtml(entry.date || '');
        if (partLabel) html += escHtml(partLabel);
        html += '</p>';

        html += '<hr class="studies-preview__divider" aria-hidden="true">';

        if (entry.preview) {
            html += '<div class="studies-preview__body">' + escHtml(entry.preview) + '</div>';
        }

        if (entry.url) {
            html += '<a class="studies-preview__continue" href="' + escHtml(entry.url) + '">';
            html += 'continue reading →';
            html += '</a>';
        }

        preview.innerHTML = html;
    }

    function startRotate() {
        if (rotateTimer || allEntries.length <= 1) return;
        rotateTimer = setInterval(function () {
            if (isUserHovering) return;
            rotateIndex = (rotateIndex + 1) % allEntries.length;
            swapPreview(allEntries[rotateIndex]);
        }, ROTATE_INTERVAL);
    }

    function stopRotate() {
        if (rotateTimer) {
            clearInterval(rotateTimer);
            rotateTimer = null;
        }
    }

    function findGroup(key) {
        if (!data) return null;
        return data.find(function (g) { return g.key === key; }) || null;
    }

    function escHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

}());
