import React, { useEffect, useState } from 'react';
import settingsService from '../services/settingsService';
import { applyTheme, applyLanguage } from '../utils/uiPrefs';
import { useContext } from 'react';
import { LocaleContext } from '../i18n/LocaleContext';
import { useToast } from '../components/common/ToastProvider';
import './DashboardPage.css';

const SettingsPage = () => {
  const [form, setForm] = useState({ notifyEmailOnArticle: true, language: 'es', theme: 'light' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const toast = useToast();
  const { t, setLang } = useContext(LocaleContext);

  const load = async () => {
    setErr('');
    try {
      const data = await settingsService.get();
      setForm(data);
      applyTheme(data.theme);
      applyLanguage(data.language);
      localStorage.setItem('ui_settings', JSON.stringify(data));
    } catch {
      setErr('No se pudieron cargar las configuraciones');
    }
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(''); setErr('');
    try {
      const data = await settingsService.update(form);
      setForm(data);
      // Aplicar en vivo
      applyTheme(data.theme);
      applyLanguage(data.language);
      localStorage.setItem('ui_settings', JSON.stringify(data));
      setMsg(t('settings:saved'));
      toast?.success(t('settings:saved'));
    }
    catch { setErr('No se pudo guardar'); }
    finally { setSaving(false); }
  };

  return (
    <div className="dashboard-content">
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div className="form-container center-eq-sidebar" style={{ width: '100%', maxWidth: 760, margin: '3rem auto' }}>
          <h2 style={{ marginTop: 8, marginBottom: 24 }}>{t('settings:title')}</h2>
          <form onSubmit={onSubmit}>
            {/* (Notificaciones) este bloque se reubica debajo de "Tema" para mantener coherencia visual */}

            <div className="form-group">
              <label>{t('settings:language')}</label>
              <select
                value={form.language}
                onChange={(e) => {
                  const language = e.target.value;
                  setForm({ ...form, language });
                  applyLanguage(language); // vista previa inmediata
                  setLang(language);
                }}
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t('settings:theme')}</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={form.theme === 'light'}
                    onChange={() => { setForm({ ...form, theme: 'light' }); applyTheme('light'); }}
                  />
                  {t('settings:light')}
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={form.theme === 'dark'}
                    onChange={() => { setForm({ ...form, theme: 'dark' }); applyTheme('dark'); }}
                  />
                  {t('settings:dark')}
                </label>
              </div>
              <div style={{ color: '#6b7280', fontSize: 13, marginTop: 6 }}>El tema se aplica en vivo para que puedas previsualizarlo.</div>
            </div>

            {/* Notificaciones: colocar debajo de "Tema" y con el mismo estilo de secciones */}
            <div className="form-group">
              <label>{t('settings:emailOnArticles')}</label>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <label className="switch">
                  <input
                    role="switch"
                    aria-checked={form.notifyEmailOnArticle}
                    type="checkbox"
                    checked={form.notifyEmailOnArticle}
                    onChange={(e) => setForm({ ...form, notifyEmailOnArticle: e.target.checked })}
                  />
                  <span className="slider" />
                </label>
                <div style={{ color: '#6b7280', fontSize: 13 }}>{t('settings:emailOnArticlesHelp')}</div>
              </div>
            </div>

            {msg && <div style={{ background:'#ecfdf5', color:'#065f46', border:'1px solid #a7f3d0', padding:'8px 12px', borderRadius:6, marginBottom:12 }}>{msg}</div>}
            {err && <div style={{ background:'#fef2f2', color:'#991b1b', border:'1px solid #fecaca', padding:'8px 12px', borderRadius:6, marginBottom: 12 }}>{err}</div>}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="submit" className="form-button" disabled={saving} style={{ width: 'auto' }}>{t('settings:save')}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
