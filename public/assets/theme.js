// One shared preference across the homepage and case-study routes.
(() => {
 const media = matchMedia('(prefers-color-scheme: dark)');
 const apply = theme => {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme === 'dark' ? '#101e20' : '#f5f2e9');
 };
 apply(document.documentElement.dataset.theme || 'light');
 document.addEventListener('click', event => {
  if (!event.target.closest('.theme-toggle')) return;
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  apply(theme);
  try { localStorage.setItem('ankit-theme',theme); } catch {}
 });
 media.addEventListener('change', event => {
  try { if (localStorage.getItem('ankit-theme')) return; } catch {}
  apply(event.matches ? 'dark' : 'light');
 });
})();
