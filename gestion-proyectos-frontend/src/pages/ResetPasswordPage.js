import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './Form.css';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const ResetPasswordPage = () => {
  const q = useQuery();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [pwdStrength, setPwdStrength] = useState({ score: 0, label: 'Débil' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const email = q.get('email') || '';
  const token = q.get('token') || '';

  const calcStrength = (pwd) => {
    let score = 0;
    if (!pwd) return { score: 0, label: 'Débil' };
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const lbl = score <= 2 ? 'Débil' : score === 3 ? 'Media' : 'Fuerte';
    return { score: Math.min(score, 5), label: lbl };
  };
  useEffect(() => { setPwdStrength(calcStrength(password)); }, [password]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    setLoading(true);
    try {
      const res = await authService.resetPassword({ email, token, password });
      setMsg(res?.message || 'Contrasena actualizada');
      setTimeout(() => navigate('/login'), 1200);
    } catch (e2) {
      const m = e2?.response?.data?.message || 'No se pudo actualizar';
      setErr(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Restablecer contraseña</h2>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Nueva contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          {password && (
            <div style={{ marginTop: 6 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0,1,2,3,4].map(i => (
                  <div key={i} style={{ height: 6, flex: 1, borderRadius: 4, background: i < pwdStrength.score ? (pwdStrength.score >= 4 ? '#16a34a' : pwdStrength.score === 3 ? '#f59e0b' : '#ef4444') : '#e5e7eb' }} />
                ))}
              </div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>Fortaleza: {pwdStrength.label}</div>
            </div>
          )}
        </div>
        {msg && <div style={{ color: 'green', marginBottom: 12 }}>{msg}</div>}
        {err && <div style={{ color: 'red', marginBottom: 12 }}>{err}</div>}
        <button type="submit" className="form-button" disabled={loading}>{loading ? 'Actualizando...' : 'Actualizar'}</button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
