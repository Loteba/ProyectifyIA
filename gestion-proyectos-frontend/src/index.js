import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { LocaleProvider } from './i18n/LocaleContext';
import './index.css';
import { applyTheme, applyLanguage } from './utils/uiPrefs';

// Aplicar preferencias guardadas (si existen) antes de renderizar
try {
  const saved = localStorage.getItem('ui_settings');
  if (saved) {
    const { theme, language } = JSON.parse(saved);
    applyTheme(theme);
    applyLanguage(language);
  }
} catch {}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LocaleProvider>
          <App />
        </LocaleProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
