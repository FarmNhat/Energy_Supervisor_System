import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { DeviceManagementPage } from './pages/DeviceManagementPage';
import { SessionManagementPage } from './pages/SessionManagementPage';
import { EnergyDashboardPage } from './pages/EnergyDashboardPage';
import { AppShell } from './components/AppShell';
type Page = 'dashboard' | 'devices' | 'sessions' | 'energy';
type AuthMode = 'login' | 'register';
function AppRouter() {
  const { isAuthenticated } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  if (!isAuthenticated) {
    return authMode === 'login' ?
    <LoginPage onNavigateToRegister={() => setAuthMode('register')} /> :

    <RegisterPage onNavigateToLogin={() => setAuthMode('login')} />;

  }
  return (
    <AppShell currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === 'dashboard' && <DashboardPage />}
      {currentPage === 'devices' && <DeviceManagementPage />}
      {currentPage === 'energy' && <EnergyDashboardPage />}
      {currentPage === 'sessions' && <SessionManagementPage />}
    </AppShell>);

}
export function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>);

}