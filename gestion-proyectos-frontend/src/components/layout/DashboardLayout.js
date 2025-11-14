import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import './DashboardLayout.css';

const DashboardLayout = () => {
  return (
    <div className="dashboard-container">
      <Sidebar />
      {/* Overlay para móvil/tablet cuando el sidebar está abierto */}
      <div
        className="sidebar-overlay"
        onClick={() => document.body.classList.remove('sidebar-open')}
      />
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
