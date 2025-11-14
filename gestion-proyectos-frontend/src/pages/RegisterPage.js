// frontend/src/pages/RegisterPage.js

import React, { useState } from 'react';
import authService from '../services/authService';
import './Form.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [role, setRole] = useState('estudiante');
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { name, email, password } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const userData = { name, email, password, role };
    if (isAdmin) {
      userData.role = 'admin';
      userData.adminKey = adminKey;
    }

    try {
      const response = await authService.register(userData);
      console.log('Usuario registrado con Ã©xito:', response);
      setMessage('Cuenta creada correctamente. Ya puedes iniciar sesión.');
    } catch (err) {
      const msg = (err?.response?.data?.message) || err?.message || 'Error en el registro';
      setError(msg);
    }
  };

  return (
    <div className="form-container">
      <h2>Crear una cuenta</h2>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Nombre</label>
          <input type="text" name="name" value={name} onChange={onChange} required />
        </div>
        <div className="form-group">
          <label>Correo electrónico</label>
          <input type="email" name="email" value={email} onChange={onChange} required />
        </div>
        <div className="form-group">
          <label>Contraseña</label>
          <input type="password" name="password" value={password} onChange={onChange} minLength="6" required />
        </div>

        <div className="form-group">
          <label>Rol</label>
          <select name="role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="investigador">Investigador</option>
            <option value="estudiante">Estudiante</option>
          </select>
        </div>
        <div className="form-group">
          <button type="button" className="hint-link" onClick={() => setShowAdmin((v) => !v)}>
            {showAdmin ? 'Ocultar crear como administrador' : 'Crear como administrador'}
          </button>
        </div>
        {showAdmin && (
          <div className="admin-box">
            <label className="checkbox-inline" style={{ marginBottom: 8 }}>
              Crear como administrador
              <input
                type="checkbox"
                name="isAdmin"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
              />
            </label>
            <div className="form-group" style={{ marginTop: 8 }}>
              <label>Clave de administrador</label>
              <input
                type="password"
                name="adminKey"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Ingresa la clave"
                disabled={!isAdmin}
              />
            </div>
          </div>
        )}

        {message && <div style={{ color: 'green', marginBottom: 12 }}>{message}</div>}
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

        <button type="submit" className="form-button">Registrarse</button>
      </form>
    </div>
  );
};

export default RegisterPage;

