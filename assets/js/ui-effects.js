document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const scene = document.querySelector('.scene');
  const terminal = document.querySelector('.mac-terminal');
  const input = document.getElementById('terminal-input');
  const status = document.getElementById('terminal-status');
  const suggestions = document.getElementById('autocomplete-suggestions');

  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isLight = () => root.getAttribute('data-theme') === 'light';

  // ── Parallax tilt (skip on touch / reduced motion / light) ──
  if (scene && !isTouch && !reducedMotion) {
    let raf = 0;
    let target = { x: 0, y: 0 };
    let current = { x: 0, y: 0 };

    const tick = () => {
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      scene.style.transform = `perspective(1200px) rotateY(${current.x * 2.2}deg) rotateX(${-current.y * 2.2}deg)`;
      raf = requestAnimationFrame(tick);
    };

    root.addEventListener('mousemove', e => {
      if (isLight()) return;
      const rect = scene.getBoundingClientRect();
      target.x = (e.clientX - rect.left) / rect.width - 0.5;
      target.y = (e.clientY - rect.top) / rect.height - 0.5;
      if (!raf) tick();
    });

    root.addEventListener('mouseleave', () => {
      target = { x: 0, y: 0 };
    });
  }

  // ── Active glow on focus ──
  if (terminal && input) {
    input.addEventListener('focus', () => terminal.classList.add('active'));
    input.addEventListener('blur',  () => terminal.classList.remove('active'));
  }

  // ── STATUS line live cycle ──
  if (status && !reducedMotion) {
    const states = [
      'STATUS: OPERATIONAL',
      'LINK: SECURE',
      'CHANNEL: 906CBE',
      'UPLINK: STABLE',
      'PHASE: NIGHTWATCH',
      'SEAL: 𝕵',
      'STATUS: OPERATIONAL'
    ];
    let i = 0;
    setInterval(() => {
      i = (i + 1) % states.length;
      status.textContent = states[i];
    }, 4200);
  }

  // ── Autocomplete visible-class bridge ──
  // terminal.js toggles `display`; mirror to `.is-visible` for slide-in animation.
  if (suggestions) {
    const obs = new MutationObserver(() => {
      const visible = suggestions.style.display && suggestions.style.display !== 'none';
      suggestions.classList.toggle('is-visible', !!visible);
    });
    obs.observe(suggestions, { attributes: true, attributeFilter: ['style'] });
  }
});
