import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import './CreateProjectModal.css';
import { useToast } from '../common/ToastProvider';

const InviteCollaboratorModal = ({ isOpen, onClose, onInvite }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const toast = useToast();
  if (!isOpen) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const regex = /.+@.+\..+/;
    if (!regex.test(email.trim())) { setError('Correo inválido'); return; }
    try {
      await onInvite(email.trim());
      setError('');
      toast?.success('Invitación enviada');
      setTimeout(() => { setEmail(''); onClose(); }, 800);
    } catch (e2) {
      const msg = e2?.response?.data?.message || 'No se pudo enviar la invitación';
      setError(msg);
      toast?.error(msg);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Invitar colaborador</h2>
          <button onClick={onClose} className="close-btn"><FaTimes /></button>
        </div>
        <div className="modal-body">
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Correo del colaborador</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" required />
            </div>
            {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
            <button type="submit" className="form-button">Enviar invitación</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InviteCollaboratorModal;
