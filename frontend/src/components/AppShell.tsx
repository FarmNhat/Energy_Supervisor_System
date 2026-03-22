import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Cpu,
  Users,
  Home,
  LogOut,
  BarChart3 } from
'lucide-react';
import { useAuth } from '../hooks/useAuth';
interface AppShellProps {
  children: React.ReactNode;
  currentPage: 'dashboard' | 'devices' | 'sessions' | 'energy';
  onNavigate: (page: 'dashboard' | 'devices' | 'sessions' | 'energy') => void;
}
export function AppShell({ children, currentPage, onNavigate }: AppShellProps) {
  const { currentUser, logout } = useAuth();
  const navItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard
  },
  {
    id: 'devices',
    label: 'Devices',
    icon: Cpu
  },
  {
    id: 'energy',
    label: 'Energy',
    icon: BarChart3
  },
  {
    id: 'sessions',
    label: 'Sessions',
    icon: Users
  }] as
  const;
  return (
    <div className="min-h-screen bg-cream-100 text-gray-900 font-body selection:bg-warmgreen-200 selection:text-warmgreen-900 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-cream-200 sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 bg-warmgreen-100 text-warmgreen-600 rounded-xl">
            <Home className="w-6 h-6" />
          </div>
          <span className="font-heading font-bold text-xl text-gray-900">
            SmartHome
          </span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${isActive ? 'bg-warmgreen-50 text-warmgreen-600' : 'text-gray-500 hover:bg-cream-200/50 hover:text-gray-900'}`}>

                <Icon className="w-5 h-5" />
                {item.label}
              </button>);

          })}
        </nav>

        <div className="p-4 border-t border-cream-200">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-warmgreen-100 flex items-center justify-center text-warmgreen-600 font-heading font-bold">
              {currentUser?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {currentUser?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {currentUser?.email}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm text-coral-500 hover:bg-coral-50 mt-2">

            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <AnimatePresence mode="wait">{children}</AnimatePresence>
      </main>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-cream-200 flex justify-around items-center p-2 pb-safe z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center p-2 min-w-[4rem] ${isActive ? 'text-warmgreen-600' : 'text-gray-400'}`}>

              <div
                className={`p-1.5 rounded-xl mb-1 ${isActive ? 'bg-warmgreen-50' : ''}`}>

                <Icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>);

        })}
      </nav>
    </div>);

}