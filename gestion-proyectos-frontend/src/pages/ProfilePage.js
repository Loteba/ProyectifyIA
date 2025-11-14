import React, { useEffect, useState, useContext } from 'react';
import profileService from '../services/profileService';
import './Form.css';
import { AuthContext } from '../context/AuthContext';

const ProfilePage = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [initialEmail, setInitialEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [emailStatus, setEmailStatus] = useState({ valid: true, available: true, checking: false });
  const [pwdStrength, setPwdStrength] = useState({ score: 0, label: 'Débil' });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarVerified, setAvatarVerified] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await profileService.getProfile();
        setName(me.name || '');
        setEmail(me.email || '');
        setInitialEmail(me.email || '');
      } catch (e) {
        setError('No se pudo cargar el perfil');
      }
    };
    load();
  }, []);

  // Utilidad: calcular fortaleza de contraseña
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

  // Observa cambios de nueva contraseña para mostrar fortaleza
  useEffect(() => { setPwdStrength(calcStrength(newPassword)); }, [newPassword]);

  // Validación de email en tiempo real (formato y disponibilidad)
  useEffect(() => {
    let timer;
    const run = async () => {
      const emailRegex = /.+@.+\..+/;
      const valid = emailRegex.test(email.trim());
      if (!valid) { setEmailStatus({ valid: false, available: false, checking: false }); return; }
      setEmailStatus((s) => ({ ...s, valid: true, checking: true }));
      try {
        const { available } = await profileService.checkEmail(email.trim());
        setEmailStatus({ valid: true, available, checking: false });
      } catch {
        setEmailStatus({ valid: true, available: true, checking: false });
      }
    };
    if (email) timer = setTimeout(run, 500);
    return () => timer && clearTimeout(timer);
  }, [email]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    const emailChanged = email.trim() && email.trim() !== initialEmail;
    if (!emailStatus.valid) { setError('Correo electrónico inválido'); return; }
    if (emailChanged && !emailStatus.available) { setError('Ese correo ya está en uso'); return; }
    if (emailChanged && !currentPassword) { setError('Debes indicar tu contraseña actual para cambiar el correo'); return; }
    if (newPassword && newPassword !== confirmPassword) {
      setError('La nueva contraseña y la confirmación no coinciden');
      return;
    }
    setLoading(true);
    try {
      const payload = { name, email };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      if (emailChanged) {
        payload.currentPassword = currentPassword; // requerido por backend para cambio de email
      }
      const updated = await profileService.updateProfile(payload);
      // Actualizar el usuario en contexto/localStorage, conservando token y rol
      if (user) updateUser({ name: updated.name, email: updated.email });
      setMessage('Perfil actualizado correctamente');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Error al actualizar el perfil';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setMessage('');
    if (!file.type.startsWith('image/')) { setError('Seleccione una imagen válida'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('La imagen no debe superar 2MB'); return; }
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);
    setAvatarVerified(false);
    try {
      const { avatarUrl } = await profileService.uploadAvatar(file);
      // Validar cargando la imagen realmente
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = avatarUrl + (avatarUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
      });
      if (user) updateUser({ avatarUrl });
      setMessage('Avatar subido y verificado');
      setAvatarVerified(true);
    } catch (e2) {
      setError(e2?.response?.data?.message || 'Error al subir el avatar');
      setAvatarPreview('');
      setAvatarVerified(false);
    }
    setAvatarUploading(false);
  };

  return (
    <div className="form-container">
      <h2>Mi perfil</h2>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Foto de perfil</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={avatarPreview || user?.avatarUrl || 'https://via.placeholder.com/64'}
              alt="avatar"
              style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }}
            />
            <input type="file" accept="image/*" onChange={onPickAvatar} />
          </div>
        </div>
        <div className="form-group">
          <label>Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Correo electrónico</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <div style={{ fontSize: 12, marginTop: 4 }}>
            {!emailStatus.valid && <span style={{ color: 'red' }}>Formato inválido</span>}
            {emailStatus.valid && emailStatus.checking && <span>Verificando disponibilidad...</span>}
            {emailStatus.valid && !emailStatus.checking && !emailStatus.available && <span style={{ color: 'red' }}>Correo no disponible</span>}
            {emailStatus.valid && !emailStatus.checking && emailStatus.available && <span style={{ color: 'green' }}>Disponible</span>}
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-inline">
            Cambiar contraseña (opcional)
          </label>
        </div>

        <div className="form-group">
          <label>Contraseña actual</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Obligatoria si cambias la contraseña" />
        </div>
        <div className="form-group">
          <label>Nueva contraseña</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          {newPassword && (
            <div style={{ marginTop: 6 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0,1,2,3,4].map(i => (
                  <div key={i} style={{ height: 6, flex: 1, borderRadius: 4, background: i < pwdStrength.score ? (pwdStrength.score >= 4 ? '#16a34a' : pwdStrength.score === 3 ? '#f59e0b' : '#ef4444') : '#e5e7eb' }} />
                ))}
              </div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>Fortaleza: {pwdStrength.label}</div>
              <ul style={{ margin: '6px 0 0 16px', padding: 0, fontSize: 12, color: '#666' }}>
                <li>Mínimo 8 caracteres</li>
                <li>Mayúsculas, minúsculas, número y símbolo</li>
              </ul>
            </div>
          )}
        </div>
        <div className="form-group">
          <label>Confirmar nueva contraseña</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>

        {message && <div style={{ color: 'green', marginBottom: 12 }}>{message}</div>}
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

        <button className="form-button" disabled={loading || avatarUploading}>{loading ? 'Guardando...' : (avatarUploading ? 'Esperando subida de avatar...' : 'Guardar cambios')}</button>
      </form>
    </div>
  );
};

export default ProfilePage;
