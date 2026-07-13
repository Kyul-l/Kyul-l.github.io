// Fragment — one piece from the Log surfaced on the home right column.
// Not a widget. A quietly curated page-that-happened-to-fall-open.
//
// Selection order (first match wins):
//   1. An entry whose date is today (MM-DD match — repeats yearly)
//   2. An entry from the current season
//   3. Any entry from the pool
//
// Stable per calendar day so the same visitor doesn't see a different piece
// on every refresh. Deterministic seed = YYYY-MM-DD.

const pool = Array.isArray(window.__FRAGMENT_POOL__) ? window.__FRAGMENT_POOL__ : [];
const card = document.getElementById('fragment-card');

if (card && pool.length) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mmdd = String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    const seed = `${yyyy}-${mmdd}`;

    const month = today.getMonth() + 1;
    const season =
        month === 12 || month <= 2 ? 'winter' :
        month <= 5 ? 'spring' :
        month <= 8 ? 'summer' : 'autumn';

    // 1. Today's entry — same MM-DD as today (any year)
    let candidates = pool.filter((e) => (e.date || '').slice(5) === mmdd);
    // 2. Current-season entries
    if (!candidates.length) candidates = pool.filter((e) => e.season === season);
    // 3. Fallback: whole archive
    if (!candidates.length) candidates = pool;

    // Deterministic pick from seed
    const hash = [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
    const pick = candidates[hash % candidates.length];

    const media = card.querySelector('.fragment-media');
    const img = media && media.querySelector('img');
    const glyph = card.querySelector('.fragment-kind__glyph');
    const label = card.querySelector('.fragment-kind__label');
    const title = card.querySelector('.fragment-title');
    const excerpt = card.querySelector('.fragment-excerpt');
    const date = card.querySelector('.fragment-date');

    if (pick.image && media && img) {
        img.src = pick.image;
        img.alt = pick.title || '';
        media.hidden = false;
    }
    if (glyph) glyph.textContent = '·';
    if (label) label.textContent = pick.kind || '';
    if (title) title.textContent = pick.title || '';
    if (excerpt) excerpt.textContent = pick.excerpt || '';
    if (date) date.textContent = pick.dateLabel || '';

    card.href = pick.url || '#';
    card.dataset.ready = 'true';
    card.dataset.hasImage = pick.image ? 'true' : 'false';
}
