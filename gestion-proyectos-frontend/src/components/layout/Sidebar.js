import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaProjectDiagram, FaBook, FaCog, FaUserShield, FaUserCircle } from 'react-icons/fa';
import { FiMail } from 'react-icons/fi';
import { RiFileTextLine } from 'react-icons/ri';
import { MdOutlineTravelExplore } from 'react-icons/md';
import { IoNotificationsOutline } from 'react-icons/io5';
import './Sidebar.css';
import { AuthContext } from '../../context/AuthContext';
import { LocaleContext } from '../../i18n/LocaleContext';

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  const { t } = useContext(LocaleContext);
  return (
    <aside className="sidebar-nav">
      <button
        type="button"
        className="sidebar-close"
        aria-label="Cerrar menú"
        onClick={() => document.body.classList.remove('sidebar-open')}
      >
        ×
      </button>
      <div className="sidebar-profile">
        <img
          alt="avatar"
          src={user?.avatarUrl || 'https://via.placeholder.com/64'}
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/64'; }}
        />
        <div>
          <div className="name">{user?.name || 'Usuario'}</div>
          <div className="email">{user?.email || ''}</div>
        </div>
      </div>
      <nav>
        <ul>
          <li><NavLink to="/dashboard" end><FaTachometerAlt /><span>{t('common:dashboard')}</span></NavLink></li>
          <li><NavLink to="/dashboard/projects"><FaProjectDiagram /><span>{t('common:myProjects')}</span></NavLink></li>
          <li><NavLink to="/dashboard/projects/invitations"><FiMail /><span>{t('common:invitations')}</span></NavLink></li>
          <li><NavLink to="/dashboard/library"><FaBook /><span>{t('common:library')}</span></NavLink></li>
          <li><NavLink to="/dashboard/summarizer"><RiFileTextLine /><span>{t('common:summarize')}</span></NavLink></li>
          <li><NavLink to="/dashboard/suggest"><MdOutlineTravelExplore /><span>{t('common:suggest')}</span></NavLink></li>
          <li><NavLink to="/dashboard/notifications"><IoNotificationsOutline /><span>{t('common:notifications')}</span></NavLink></li>
          <li><NavLink to="/dashboard/profile"><FaUserCircle /><span>{t('common:profile')}</span></NavLink></li>
          {user?.role === 'superadmin' && (
            <li><NavLink to="/dashboard/superadmin"><FaUserShield /><span>{t('common:superAdmin')}</span></NavLink></li>
          )}
          {(user?.role === 'admin' || user?.role === 'superadmin') && (
            <li><NavLink to="/dashboard/admin/users"><FaUserShield /><span>{t('common:admin')}</span></NavLink></li>
          )}
          <li><NavLink to="/dashboard/settings"><FaCog /><span>{t('common:settings')}</span></NavLink></li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

