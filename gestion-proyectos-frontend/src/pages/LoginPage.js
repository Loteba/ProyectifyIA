import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import authService from '../services/authService';
import './Form.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const { email, password } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userData = await authService.login({ email, password });
      login(userData);
    } catch (err) {
      const message = (err?.response?.data?.message) || 'Credenciales invalidas';
      setError(message);
    }
  };

  return (
    <div className="form-container">
      <h2>Iniciar Sesion</h2>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Correo Electronico</label>
          <input type="email" name="email" value={email} onChange={onChange} required />
        </div>
        <div className="form-group">
          <label>Contrasena</label>
          <input type="password" name="password" value={password} onChange={onChange} required />
        </div>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <button type="submit" className="form-button">Entrar</button>
        <div style={{ marginTop: 12 }}>
          <a href="/forgot-password">Olvidaste tu contrasena?</a>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;



