// frontend/src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import API from '../services/apiClient';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    (async () => {
      try {
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          if (parsed?.token) {
            try {
              const { data } = await API.get('/users/me');
              setUser((u) => {
                const merged = { ...u, name: data?.name, email: data?.email, role: data?.role, avatarUrl: data?.avatarUrl };
                localStorage.setItem('user', JSON.stringify(merged));
                return merged;
              });
            } catch { /* ignore refresh errors */ }
          }
        }
      } finally { setReady(true); }
    })();
  }, []);

  const login = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    navigate('/dashboard');
  };

  // --- ¡AQUÍ ESTÁ EL CAMBIO! ---
  const logout = () => {
    // 1. Primero, redirigimos al usuario.
    // El router desmontará limpiamente la página del dashboard.
    navigate('/login');
    
    // 2. Después, limpiamos el estado y el localStorage.
    // Esto asegura que cuando React re-renderice la App, ya estaremos
    // en la página de login, donde el estado 'user' no causa
    // el desmontaje conflictivo del Chatbot.
    localStorage.removeItem('user');
    setUser(null);
  };

  // Actualiza los datos del usuario sin redirigir (para cambios de perfil)
  const updateUser = (partial) => {
    if (!user) return;
    const updated = { ...user, ...partial };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
