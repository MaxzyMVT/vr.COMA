// Dark mode: system default + user override + persistence
(() => {
  const KEY = window.VRCOMA?.STORAGE?.THEME || 'vrcoma-theme';
  const root = document.documentElement;
  const checkbox = document.getElementById('theme-toggle-checkbox');

  const sys = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const saved = localStorage.getItem(KEY);
  const initial = saved || sys || 'dark'; // Default to dark now
  root.setAttribute('data-theme', initial);

  function reflectState() {
    if (!checkbox) return;
    const isDark = root.getAttribute('data-theme') === 'dark';
    checkbox.checked = isDark;
  }
  reflectState();

  checkbox?.addEventListener('change', () => {
    const next = checkbox.checked ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem(KEY, next);
    window.dispatchEvent(new CustomEvent('theme:changed', { detail: { mode: next }}));
  });

  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', e => {
    if (localStorage.getItem(KEY)) return; // user override exists
    const newTheme = e.matches ? 'dark' : 'light';
    root.setAttribute('data-theme', newTheme);
    reflectState();
  });
})();