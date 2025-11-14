import React, { useState } from 'react';
import authService from '../services/authService';
import './Form.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      setMsg(res?.message || 'Hemos enviado el enlace de restablecimiento. Revisa tu correo.');
    } catch (e2) {
      const m = e2?.response?.data?.message || 'El correo indicado no está registrado';
      setErr(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Recuperar contrasena</h2>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Correo Electronico</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        {msg && <div style={{ color: 'green', marginBottom: 12 }}>{msg}</div>}
        {err && <div style={{ color: 'red', marginBottom: 12 }}>{err}</div>}
        <button type="submit" className="form-button" disabled={loading}>{loading ? 'Enviando...' : 'Enviar enlace'}</button>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
