// studies-spread.js
// Codex Spread — interactive left/right book-spread for /studies/
// Reads window.__STUDIES_SERIES__ (populated by Liquid in studies.md)

(function () {
    'use strict';

    // ── Constants ────────────────────────────────────────────────
    var SWAP_DURATION   = 200;  // ms — preview fade-swap
    var ROTATE_INTERVAL = 8000; // ms — auto-rotate latest preview

    // ── State ────────────────────────────────────────────────────
    var data          = null;  // window.__STUDIES_SERIES__
    var allEntries    = [];    // flat list sorted newest-first
    var currentEntry  = null;
    var rotateTimer   = null;
    var rotateIndex   = 0;
    var isUserHovering = false;
    var activeSeriesEl = null;

    // ── DOM references ───────────────────────────────────────────
    var preview         = null;
    var seriesItems     = [];

    // ── Boot ─────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        data = window.__STUDIES_SERIES__;
        if (!data) return;

        preview     = document.querySelector('.studies-preview');
        seriesItems = Array.from(document.querySelectorAll('.studies-series'));

        if (!preview || seriesItems.length === 0) return;

        // Build flat sorted entry list (newest first)
        buildFlatEntries();

        // Bind events
        seriesItems.forEach(bindSeriesItem);

        // Initial preview = most recently dated entry
        if (allEntries.length > 0) {
            showEntry(allEntries[0], true);
        }

        // Start auto-rotate
        startRotate();
    });

    // ── Build flat entry list ─────────────────────────────────────
    function buildFlatEntries() {
        allEntries = [];
        data.forEach(function (group) {
            if (group.entries && group.entries.length > 0) {
                // Add the latest entry per series
                allEntries.push(group.entries[0]);
            }
        });
        // Sort by date descending
        allEntries.sort(function (a, b) {
            return (b.date || '').localeCompare(a.date || '');
        });
    }

    // ── Bind hover + click on a series item ──────────────────────
    function bindSeriesItem(el) {
        var key = el.getAttribute('data-series');

        el.addEventListener('mouseenter', function () {
            isUserHovering = true;
            stopRotate();
            var group = findGroup(key);
            if (group && group.entries.length > 0) {
                swapPreview(group.entries[0]);
            }
        });

        el.addEventListener('mouseleave', function () {
            isUserHovering = false;
            startRotate();
        });

        el.addEventListener('click', function (e) {
            e.preventDefault();
            toggleEpisodes(el, key);
        });

        el.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleEpisodes(el, key);
            }
        });
    }

    // ── Toggle nested episode list ────────────────────────────────
    function toggleEpisodes(el, key) {
        var episodeList = el.nextElementSibling;
        if (!episodeList || !episodeList.classList.contains('studies-episodes')) return;

        var isOpen = !episodeList.hidden;

        // Close all others first
        document.querySelectorAll('.studies-episodes').forEach(function (list) {
            list.hidden = true;
            // Reset stagger states on items
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
            // Open this one
            episodeList.hidden = false;
            el.classList.add('studies-series--active');
            activeSeriesEl = el;

            // Stagger reveal episodes
            var episodes = episodeList.querySelectorAll('.studies-episode');
            episodes.forEach(function (ep, i) {
                ep.style.animationDelay = (i * 80) + 'ms';
                // Force reflow
                void ep.offsetWidth;
                ep.classList.add('stagger-reveal');
            });

            // Show this series' latest entry in preview
            var group = findGroup(key);
            if (group && group.entries.length > 0) {
                swapPreview(group.entries[0]);
            }
        }
    }

    // ── Preview swap with fade ────────────────────────────────────
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

    // ── Render preview HTML ───────────────────────────────────────
    function renderPreview(entry) {
        if (!preview) return;

        var fromLabel = entry.series || 'Singles';
        var partLabel = entry.part ? ' · part ' + entry.part : '';
        if (entry.total) partLabel += ' of ' + entry.total;

        var html = '';

        // FROM breadcrumb
        html += '<p class="studies-preview__from">';
        html += '<span class="studies-preview__from-sigil" aria-hidden="true">FROM</span>';
        html += ' <span class="studies-preview__from-series">⌖ ' + escHtml(fromLabel) + '</span>';
        html += '</p>';

        // Episode title
        html += '<h3 class="studies-preview__title">' + escHtml(entry.title) + '</h3>';

        // Meta
        html += '<p class="studies-preview__meta">';
        html += escHtml(entry.date || '');
        if (partLabel) html += escHtml(partLabel);
        html += '</p>';

        // Divider
        html += '<hr class="studies-preview__divider" aria-hidden="true">';

        // H/F/R sections — each fades in with sequence-fade
        var sections = [
            { label: 'Hypothesis', body: entry.hypothesis },
            { label: 'Finding',    body: entry.finding },
            { label: 'Reflection', body: entry.reflection }
        ];

        sections.forEach(function (sec, i) {
            if (!sec.body) return;
            html += '<div class="studies-preview__section" style="animation-delay:' + (i * 150) + 'ms">';
            html += '<span class="studies-preview__section-label">' + escHtml(sec.label) + '</span>';
            html += '<p class="studies-preview__section-body">' + escHtml(sec.body) + '</p>';
            html += '</div>';
        });

        // Continue link
        if (entry.url) {
            html += '<a class="studies-preview__continue" href="' + escHtml(entry.url) + '">';
            html += 'continue reading →';
            html += '</a>';
        }

        preview.innerHTML = html;

        // Trigger sequence-fade for H/F/R sections
        requestAnimationFrame(function () {
            preview.querySelectorAll('.studies-preview__section').forEach(function (el) {
                void el.offsetWidth; // reflow
                el.classList.add('sequence-fade');
            });
        });
    }

    // ── Auto-rotate ───────────────────────────────────────────────
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

    // ── Utilities ─────────────────────────────────────────────────
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
