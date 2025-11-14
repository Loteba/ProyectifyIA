export function applyTheme(theme) {
  const cls = 'theme-dark';
  if (theme === 'dark') document.body.classList.add(cls);
  else document.body.classList.remove(cls);
}

export function applyLanguage(lang) {
  const l = (lang || 'es').toLowerCase();
  document.documentElement.setAttribute('lang', l);
}

