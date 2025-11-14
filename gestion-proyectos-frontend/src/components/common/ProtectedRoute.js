// frontend/src/components/common/ProtectedRoute.js
import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ProtectedRoute = () => {
  const { user, ready } = useContext(AuthContext);

  // Espera a que AuthContext termine de rehidratar localStorage
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export default ProtectedRoute;

