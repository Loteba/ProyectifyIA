import React from 'react';
import { FaTimes } from 'react-icons/fa';
import '../projects/CreateProjectModal.css';

const ConfirmModal = ({ isOpen, onClose, title = 'Confirmar', message, confirmText = 'Confirmar', cancelText = 'Cancelar', onConfirm, tone = 'default' }) => {
  if (!isOpen) return null;

  const btnStyle = tone === 'danger'
    ? { backgroundColor: 'var(--danger-color)', color: '#fff' }
    : {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} className="close-btn"><FaTimes /></button>
        </div>
        <div className="modal-body">
          <p style={{ marginTop: 0 }}>{message}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="form-button secondary-button" style={{ width: 'auto' }} onClick={onClose}>{cancelText}</button>
            <button className="form-button" style={{ width: 'auto', ...btnStyle }} onClick={onConfirm}>{confirmText}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

