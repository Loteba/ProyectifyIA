import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { translations } from './translations';
import { applyLanguage } from '../utils/uiPrefs';

export const LocaleContext = createContext({ lang: 'es', setLang: () => {}, t: (k) => k });

export const LocaleProvider = ({ children }) => {
  const initial = (() => {
    try {
      const saved = localStorage.getItem('ui_settings');
      if (saved) {
        const { language } = JSON.parse(saved);
        return (language || 'es').toLowerCase();
      }
    } catch {}
    return 'es';
  })();
  const [lang, setLangState] = useState(initial);

  useEffect(() => { applyLanguage(lang); }, [lang]);

  const setLang = useCallback((l) => {
    const language = (l || 'es').toLowerCase();
    setLangState(language);
    try {
      const saved = localStorage.getItem('ui_settings');
      const obj = saved ? JSON.parse(saved) : {};
      localStorage.setItem('ui_settings', JSON.stringify({ ...obj, language }));
    } catch {}
  }, []);

  const t = useCallback((key) => {
    const [ns, id] = key.includes(':') ? key.split(':') : ['common', key];
    return translations[lang]?.[ns]?.[id] || translations['es']?.[ns]?.[id] || id || key;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
};

