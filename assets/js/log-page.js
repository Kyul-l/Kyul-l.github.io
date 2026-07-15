(function () {
    var sections = Array.prototype.slice.call(document.querySelectorAll('.log-month'));
    if (!sections.length) return;

    function keyFromHash() {
        var h = (window.location.hash || '').replace(/^#m-/, '');
        return /^\d{4}-\d{2}$/.test(h) ? h : null;
    }

    function findSection(key) {
        for (var i = 0; i < sections.length; i++) {
            if (sections[i].dataset.key === key) return sections[i];
        }
        return null;
    }

    var yearEl = document.querySelector('.log-header__year');
    var seasonLegendEls = Array.prototype.slice.call(document.querySelectorAll('.log-header__season'));

    function seasonFor(monthNum) {
        if (monthNum === 12 || monthNum <= 2) return '겨울';
        if (monthNum <= 5) return '봄';
        if (monthNum <= 8) return '여름';
        return '가을';
    }

    function syncHeaderLegend(target) {
        if (!yearEl && !seasonLegendEls.length) return;
        var y = target.dataset.year;
        var m = parseInt(target.dataset.month, 10);
        if (yearEl && y) yearEl.textContent = y + '년';
        var seasonKr = seasonFor(m);
        seasonLegendEls.forEach(function (el) {
            if (el.textContent.trim() === seasonKr) el.classList.add('is-current');
            else el.classList.remove('is-current');
        });
    }

    function show(key) {
        var target = findSection(key);
        if (!target) return;
        sections.forEach(function (s) {
            s.dataset.current = s === target ? 'true' : 'false';
        });
        target.querySelectorAll('.log-month__month, .log-month__sub').forEach(function (el) {
            el.classList.remove('is-fading');
        });
        if (window.location.hash !== '#m-' + key) {
            history.replaceState(null, '', '#m-' + key);
        }
        var photos = target.querySelectorAll('.log-photo');
        photos.forEach(function (p) { p.classList.remove('is-in'); });
        requestAnimationFrame(function () {
            photos.forEach(function (p) { p.classList.add('is-in'); });
        });
        syncHeaderLegend(target);
    }

    function navigate(currentSection, dir) {
        var idx = sections.indexOf(currentSection);
        var targetIdx = dir === 'prev' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= sections.length) return;
        var target = sections[targetIdx];

        var currentMonth = currentSection.querySelector('.log-month__month');
        var currentSub = currentSection.querySelector('.log-month__sub');
        if (currentMonth) currentMonth.classList.add('is-fading');
        if (currentSub) currentSub.classList.add('is-fading');

        setTimeout(function () {
            show(target.dataset.key);
        }, 220);
    }

    sections.forEach(function (s, i) {
        var prevBtn = s.querySelector('.log-month__btn--prev');
        var nextBtn = s.querySelector('.log-month__btn--next');
        if (i === 0 && prevBtn) prevBtn.classList.add('is-disabled');
        if (i === sections.length - 1 && nextBtn) nextBtn.classList.add('is-disabled');
        if (prevBtn) prevBtn.addEventListener('click', function () {
            if (prevBtn.classList.contains('is-disabled')) return;
            navigate(s, 'prev');
        });
        if (nextBtn) nextBtn.addEventListener('click', function () {
            if (nextBtn.classList.contains('is-disabled')) return;
            navigate(s, 'next');
        });
    });

    var initialKey = keyFromHash();
    if (initialKey && findSection(initialKey)) {
        show(initialKey);
    } else {
        var current = document.querySelector('.log-month[data-current="true"]');
        if (current) {
            var photos = current.querySelectorAll('.log-photo');
            requestAnimationFrame(function () {
                photos.forEach(function (p) { p.classList.add('is-in'); });
            });
            syncHeaderLegend(current);
        }
    }

    window.addEventListener('hashchange', function () {
        var k = keyFromHash();
        if (k) show(k);
    });
})();

(function () {
    var lb = document.querySelector('.log-lightbox');
    if (!lb) return;
    var card = lb.querySelector('.log-lightbox__card');
    var mediaFig = lb.querySelector('.log-lightbox__media');
    var img = lb.querySelector('.log-lightbox__media img');
    var flag = lb.querySelector('.log-lightbox__flag');
    var dateEl = lb.querySelector('.log-lightbox__date');
    var catEl = lb.querySelector('.log-lightbox__cat');
    var sepEl = lb.querySelector('.log-lightbox__sep');
    var titleEl = lb.querySelector('.log-lightbox__title');
    var whisperEl = lb.querySelector('.log-lightbox__whisper');
    var ruleEl = lb.querySelector('.log-lightbox__rule');
    var bodyEl = lb.querySelector('.log-lightbox__body');
    var tagsEl = lb.querySelector('.log-lightbox__tags');
    var lastTrigger = null;

    function open(tile) {
        var d = tile.dataset;
        var hasPhoto = !!d.image;
        var bodyLen = (d.body || '').trim().length;

        var variant;
        if (!hasPhoto) variant = 'text';
        else if (bodyLen < 240) variant = 'polaroid';
        else variant = 'split';

        lb.className = 'log-lightbox log-lightbox--' + (d.cat || 'moment')
            + ' log-lightbox--' + variant;

        if (hasPhoto) {
            img.src = d.image;
            img.alt = d.title || '';
            mediaFig.hidden = false;
        } else {
            img.removeAttribute('src');
            mediaFig.hidden = true;
        }

        if (flag) flag.style.display = d.feat === '1' ? '' : 'none';
        dateEl.textContent = d.date || '';
        catEl.textContent = (d.cat || '').toUpperCase();
        if (sepEl) sepEl.style.display = (d.cat && d.date) ? '' : 'none';
        titleEl.textContent = d.title || '';
        whisperEl.textContent = d.fragment || '';
        whisperEl.style.display = d.fragment ? '' : 'none';

        var bodyText = (d.body || '').trim();
        if (bodyEl) {
            bodyEl.textContent = bodyText;
            bodyEl.style.display = bodyText ? '' : 'none';
        }
        if (ruleEl) ruleEl.style.display = bodyText ? '' : 'none';

        tagsEl.innerHTML = '';
        (d.tags || '').split('|')
            .map(function (t) { return t.trim(); })
            .filter(Boolean)
            .forEach(function (t) {
                var el = document.createElement('li');
                el.className = 'log-lightbox__tag';
                el.textContent = t;
                tagsEl.appendChild(el);
            });

        lb.hidden = false;
        lb.setAttribute('aria-hidden', 'false');
        void card.offsetWidth;
        lb.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        lb.addEventListener('keydown', onTrapKey);
        var closeBtn = lb.querySelector('.log-lightbox__close');
        if (closeBtn) setTimeout(function () { try { closeBtn.focus(); } catch (e) {} }, 60);
        lastTrigger = tile;
    }

    function onTrapKey(e) {
        if (e.key !== 'Tab') return;
        var items = Array.prototype.slice.call(
            lb.querySelectorAll('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')
        );
        if (!items.length) return;
        var first = items[0];
        var last  = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    function close() {
        lb.classList.remove('is-open');
        lb.setAttribute('aria-hidden', 'true');
        lb.removeEventListener('keydown', onTrapKey);
        setTimeout(function () {
            lb.hidden = true;
            document.body.style.overflow = '';
            if (lastTrigger) { try { lastTrigger.focus(); } catch (e) {} }
        }, 350);
    }

    document.addEventListener('click', function (e) {
        var tile = e.target.closest('.log-photo');
        if (tile && !e.metaKey && !e.ctrlKey && e.button === 0) {
            e.preventDefault();
            open(tile);
            return;
        }
        if (e.target.closest('[data-close]')) {
            close();
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !lb.hidden) close();
    });
})();
