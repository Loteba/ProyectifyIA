import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import DashboardLayout from './components/layout/DashboardLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RegisterPage from './pages/RegisterPageNew';
import DashboardOverviewPage from './pages/DashboardOverviewPage';
import ProjectListPage from './pages/ProjectListPage';
import ProjectInvitationsPage from './pages/ProjectInvitationsPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import SuperAdminRoute from './components/common/SuperAdminRoute';
import AdminUsersPage from './pages/AdminUsersPageClean';
import AdminMetricsPage from './pages/AdminMetricsPage';
import SuperAdminPage from './pages/SuperAdminPage';
import NotificationsPage from './pages/NotificationsPage';
import AISummarizerPage from './pages/AISummarizerPageNew';
import AISuggestPage from './pages/AISuggestPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import Chatbot from './components/ai/Chatbot';
import LibraryPage from './pages/LibraryPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import { ToastProvider } from './components/common/ToastProvider';

function App() {
  const { user } = useContext(AuthContext);

  return (
    <ToastProvider>
      <div className="App">
        <Navbar />
        {user && <Chatbot />}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardOverviewPage />} />
              <Route path="projects" element={<ProjectListPage />} />
              <Route path="projects/invitations" element={<ProjectInvitationsPage />} />
              {/* ====================================================================== */}
              {/* RUTA CORREGIDA: de "projects/:projectId" a "project/:projectId" */}
              <Route path="project/:projectId" element={<ProjectDetailPage />} />
              {/* ====================================================================== */}
              <Route path="library" element={<LibraryPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="summarizer" element={<AISummarizerPage />} />
              <Route path="suggest" element={<AISuggestPage />} />
              {/* Rutas de administración */}
              <Route element={<AdminRoute />}>
                <Route path="admin/users" element={<AdminUsersPage />} />
                <Route path="admin/metrics" element={<AdminMetricsPage />} />
              </Route>
              {/* Ruta exclusiva de Super Admin */}
              <Route element={<SuperAdminRoute />}>
                <Route path="superadmin" element={<SuperAdminPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </ToastProvider>
  );
}

export default App;
