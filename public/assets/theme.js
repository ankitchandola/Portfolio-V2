// One shared preference across the homepage and case-study routes.
(() => {
  document.documentElement.dataset.gallery =
    new URLSearchParams(location.search).get('gallery') === 'original'
      ? 'original'
      : 'refined';
  const media = matchMedia('(prefers-color-scheme: dark)');
  const apply = (theme) => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#101e20' : '#f5f2e9');
  };
  apply(document.documentElement.dataset.theme || 'light');
  document.addEventListener('click', (event) => {
    const menu = document.querySelector('.mobile-navigation');
    if (
      menu?.open &&
      (!menu.contains(event.target) || event.target.closest('a'))
    )
      menu.open = false;
    if (!event.target.closest('.theme-toggle')) return;
    const theme =
      document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    apply(theme);
    try {
      localStorage.setItem('ankit-theme', theme);
    } catch {
      // Theme switching still works when browser storage is unavailable.
    }
  });
  document.addEventListener('keydown', (event) => {
    const menu = document.querySelector('.mobile-navigation[open]');
    if (event.key === 'Escape' && menu) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });
  media.addEventListener('change', (event) => {
    try {
      if (localStorage.getItem('ankit-theme')) return;
    } catch {
      // Without stored preferences, follow the system theme.
    }
    apply(event.matches ? 'dark' : 'light');
  });
})();
