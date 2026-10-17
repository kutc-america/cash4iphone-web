// Apply the saved preference or the light default before CSS paints; no account or cookie needed.
(() => {
  const key = 'cash4iphone-theme';
  const readPreference = () => {
    try { const value = localStorage.getItem(key); return value === 'dark' || value === 'light' ? value : null; }
    catch { return null; }
  };
  let preference = readPreference();
  const apply = () => {
    const dark = (preference || 'light') === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#000000' : '#ffffff');
    document.querySelectorAll('.theme-toggle').forEach(button => {
      button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      button.setAttribute('aria-pressed', String(dark));
    });
  };
  apply();
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    document.querySelectorAll('.theme-toggle').forEach(button => button.addEventListener('click', () => {
      preference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, preference); } catch {}
      apply();
    }));
  });
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) { preference = readPreference(); apply(); }
  });
})();
