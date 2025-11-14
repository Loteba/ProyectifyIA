import React, { useContext, useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './Navbar.css';
import notificationService from '../../services/notificationService';
import { IoNotificationsOutline } from 'react-icons/io5';
import { FiMenu } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let timer;
    const fetchCount = async () => {
      try {
        if (user) {
          const c = await notificationService.unreadCount();
          setUnread(c);
        } else {
          setUnread(0);
        }
      } catch {}
    };
    fetchCount();
    if (user) {
      timer = setInterval(fetchCount, 10000); // 10s
    }
    return () => timer && clearInterval(timer);
  }, [user]);

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          type="button"
          className="navbar-toggle"
          aria-label="Alternar menú"
          onClick={() => {
            const isMobile = window.innerWidth < 992;
            const body = document.body;
            if (isMobile) {
              body.classList.toggle('sidebar-open');
            } else {
              body.classList.toggle('sidebar-collapsed');
            }
          }}
        >
          <FiMenu size={20} />
        </button>
        <Link to={user ? "/dashboard" : "/"} className="navbar-logo">
          ProyectifyIA
        </Link>
      </div>
      <ul className="navbar-links">
        {user ? (
          <>
            <li className="navbar-welcome">
              Bienvenido, {user.name.split(' ')[0]}
            </li>
            <li>
              <img
                className="navbar-avatar"
                alt="avatar"
                src={user.avatarUrl || 'https://via.placeholder.com/64'}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/64'; }}
              />
            </li>
            <li>
              <NavLink to="/dashboard/notifications" className="navbar-bell">
                <IoNotificationsOutline size={22} />
                {unread > 0 && <span className="badge">{unread}</span>}
              </NavLink>
            </li>
            <li>
              <NavLink to="/dashboard">Dashboard</NavLink>
            </li>
            <li>
              <button onClick={logout} className="navbar-logout-btn">
                Cerrar Sesión
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <NavLink to="/login">Iniciar Sesión</NavLink>
            </li>
            <li>
              <NavLink to="/register" className="navbar-register-btn">
                Registrarse
              </NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
