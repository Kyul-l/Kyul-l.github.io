export function switchTheme(theme) {
  if (theme !== 'light' && theme !== 'dark') {
    console.error(`Invalid theme: ${theme}`);
    return;
  }
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    switchTheme(current === 'dark' ? 'light' : 'dark');
  });
});
