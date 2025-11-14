import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const AdminRoute = () => {
  const { user, ready } = useContext(AuthContext);
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin' && user.role !== 'superadmin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

export default AdminRoute;
