// Guestbook — visitors leave a small mark (canvas + optional text).
// Phase 1: localStorage-only, so UX can be validated before Firestore.
// Storage schema: [{ id, name, text, image, ts }]  (image = data URL, may be '')

const KEY = 'kyul-guestbook-v1';
const listEl   = document.getElementById('guestbook-list');
const addBtn   = document.getElementById('guestbook-add');
const modal    = document.getElementById('gb-modal');
const canvas   = document.getElementById('gb-canvas');
const textEl   = document.getElementById('gb-text');
const nameEl   = document.getElementById('gb-name');
const submitEl = document.getElementById('gb-submit');

if (listEl && addBtn && modal && canvas && textEl && nameEl && submitEl) {
    // ── Storage helpers ──────────────────────────────────────
    function load() {
        try { return JSON.parse(localStorage.getItem(KEY)) || []; }
        catch (e) { return []; }
    }
    function save(entries) {
        localStorage.setItem(KEY, JSON.stringify(entries));
    }
    function makeId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    // ── Renderer ─────────────────────────────────────────────
    function render() {
        const entries = load().sort((a, b) => b.ts - a.ts);
        listEl.innerHTML = '';
        if (!entries.length) {
            const empty = document.createElement('li');
            empty.className = 'guestbook-empty';
            empty.textContent = 'nothing yet — be the first to leave a mark.';
            listEl.appendChild(empty);
            return;
        }
        entries.slice(0, 30).forEach((e) => {
            const li = document.createElement('li');
            li.className = 'guestbook-entry';
            li.style.setProperty('--tilt', ((Math.random() * 2 - 1) * 1.4).toFixed(2) + 'deg');

            if (e.image) {
                const img = document.createElement('img');
                img.className = 'guestbook-entry__img';
                img.src = e.image;
                img.alt = '';
                li.appendChild(img);
            }
            if (e.text) {
                const t = document.createElement('p');
                t.className = 'guestbook-entry__text';
                t.textContent = e.text;
                li.appendChild(t);
            }
            const meta = document.createElement('p');
            meta.className = 'guestbook-entry__meta';
            const who = e.name ? e.name : 'a quiet one';
            const when = new Date(e.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            meta.textContent = who + ' · ' + when;
            li.appendChild(meta);

            listEl.appendChild(li);
        });
    }

    // ── Canvas drawing ───────────────────────────────────────
    const ctx = canvas.getContext('2d');
    const strokes = [];   // history for undo — each stroke is an array of {x,y}
    let drawing = false;
    let current = null;

    function paintBg() {
        // Faint parchment ruled feel — one horizontal line at 2/3 height
        ctx.fillStyle = '#f6f0e0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(31, 28, 44, .08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, Math.floor(canvas.height * 0.66) + .5);
        ctx.lineTo(canvas.width, Math.floor(canvas.height * 0.66) + .5);
        ctx.stroke();
    }
    function redraw() {
        paintBg();
        ctx.strokeStyle = '#1f1c2c';
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        strokes.forEach((s) => {
            if (s.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(s[0].x, s[0].y);
            for (let i = 1; i < s.length; i++) ctx.lineTo(s[i].x, s[i].y);
            ctx.stroke();
        });
    }
    function pointFrom(e) {
        const r = canvas.getBoundingClientRect();
        const t = e.touches && e.touches[0];
        const cx = (t ? t.clientX : e.clientX) - r.left;
        const cy = (t ? t.clientY : e.clientY) - r.top;
        return { x: cx * (canvas.width / r.width), y: cy * (canvas.height / r.height) };
    }
    function start(e) {
        e.preventDefault();
        drawing = true;
        current = [pointFrom(e)];
    }
    function move(e) {
        if (!drawing) return;
        e.preventDefault();
        current.push(pointFrom(e));
        redraw();
        ctx.strokeStyle = '#1f1c2c';
        ctx.beginPath();
        ctx.moveTo(current[0].x, current[0].y);
        for (let i = 1; i < current.length; i++) ctx.lineTo(current[i].x, current[i].y);
        ctx.stroke();
    }
    function end() {
        if (!drawing) return;
        drawing = false;
        if (current && current.length > 1) strokes.push(current);
        current = null;
        redraw();
    }

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseleave', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);

    document.querySelectorAll('[data-gb-tool]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const tool = btn.dataset.gbTool;
            if (tool === 'clear') { strokes.length = 0; redraw(); }
            else if (tool === 'undo') { strokes.pop(); redraw(); }
        });
    });

    // ── Modal open / close ──────────────────────────────────
    function openModal() {
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        requestAnimationFrame(() => modal.classList.add('is-open'));
        document.body.style.overflow = 'hidden';
        setTimeout(() => textEl.focus(), 100);
    }
    function closeModal() {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        setTimeout(() => { modal.hidden = true; document.body.style.overflow = ''; }, 250);
    }
    function reset() {
        strokes.length = 0;
        redraw();
        textEl.value = '';
        nameEl.value = '';
    }

    addBtn.addEventListener('click', () => { reset(); openModal(); });
    modal.querySelectorAll('[data-gb-close]').forEach((el) => el.addEventListener('click', closeModal));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) closeModal();
    });

    // ── Submit ──────────────────────────────────────────────
    submitEl.addEventListener('click', () => {
        const text = textEl.value.trim();
        const hasDrawing = strokes.length > 0;
        if (!text && !hasDrawing) { textEl.focus(); return; }

        const image = hasDrawing ? canvas.toDataURL('image/png') : '';
        const entry = {
            id: makeId(),
            name: nameEl.value.trim().slice(0, 24),
            text: text.slice(0, 240),
            image,
            ts: Date.now()
        };
        const entries = load();
        entries.push(entry);
        save(entries);
        closeModal();
        render();
    });

    // Initial paint
    paintBg();
    render();
}
