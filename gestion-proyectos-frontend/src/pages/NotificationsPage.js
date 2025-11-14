import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/notificationService';
import './DashboardPage.css';
import './Form.css';

const NotificationsPage = () => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setError('');
    try {
      const data = await notificationService.list();
      setItems(data);
    } catch (e) {
      setError('No se pudieron cargar las notificaciones');
    }
  };

  useEffect(() => { load(); }, []);

  const onMarkAll = async () => { await notificationService.markAllRead(); await load(); };
  const onMark = async (id) => { await notificationService.markRead(id); await load(); };

  const handleOpen = async (n) => {
    try {
      const isInternal = (n?.type === 'project_invite') || (typeof n?.link === 'string' && n.link.startsWith('/'));
      const target = n?.type === 'project_invite' ? '/dashboard/projects/invitations' : (n?.link || '/dashboard');
      if (isInternal) {
        navigate(target);
      } else if (n?.link) {
        window.open(n.link, '_blank', 'noopener');
      }
      if (!n.read) await notificationService.markRead(n._id);
    } catch {}
  };

  return (
    <div className="dashboard-content">
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div className="form-container center-eq-sidebar" style={{ width: '100%', maxWidth: 1000, margin: '3rem auto' }}>
          <h2 style={{ marginTop: 8, marginBottom: 8 }}>Notificaciones</h2>
          {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="action-btn view-btn" onClick={onMarkAll}>Marcar todas como leídas</button>
          </div>
          <ul className="notification-list">
            {items.map((n) => (
              <li key={n._id} className={`notification-item ${n.read ? '' : 'unread'}`}>
                <div className="notification-main">
                  <div className="notification-title">{n.title}</div>
                  {n.body && <div className="notification-body">{n.body}</div>}
                  <div className="notification-meta">
                    {n.createdAt && <span>{new Date(n.createdAt).toLocaleString()}</span>}
                    {!n.read && <span className="badge-new">Nuevo</span>}
                  </div>
                </div>
                <div className="notification-actions">
                  {(n.link || n.type === 'project_invite') && (
                    <button className="action-btn view-btn" onClick={() => handleOpen(n)}>Abrir</button>
                  )}
                  {!n.read && (
                    <button className="action-btn" onClick={() => onMark(n._id)}>Marcar leída</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;

