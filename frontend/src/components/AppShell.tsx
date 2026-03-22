import React from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  ActivitySquare,
  BarChart3,
  Cpu,
  LogOut,
  RadioTower,
  Shield,
  Waves,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useHomeData } from '../hooks/useHomeData';

interface AppShellProps {
  children: React.ReactNode;
  currentPage: 'dashboard' | 'devices' | 'sessions' | 'energy';
  onNavigate: (page: 'dashboard' | 'devices' | 'sessions' | 'energy') => void;
}

export function AppShell({ children, currentPage, onNavigate }: AppShellProps) {
  const { currentUser, logout } = useAuth();
  const { data, sensorTransport } = useHomeData();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Live Monitor',
      icon: ActivitySquare,
    },
    {
      id: 'devices',
      label: 'Sensor Ops',
      icon: Cpu,
    },
    {
      id: 'energy',
      label: 'Telemetry',
      icon: BarChart3,
    },
    {
      id: 'sessions',
      label: 'Access',
      icon: Shield,
    },
  ] as const;

  const statusClasses =
    data.sensorSummary.state === 'live'
      ? 'bg-warmgreen-400 shadow-[0_0_12px_rgba(122,184,147,0.85)]'
      : data.sensorSummary.state === 'stale'
        ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.75)]'
        : 'bg-coral-400 shadow-[0_0_12px_rgba(240,138,129,0.75)]';

  return (
    <div className="min-h-screen bg-transparent text-gray-900 font-body selection:bg-warmgreen-200 selection:text-gray-950 md:grid md:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="hidden min-h-screen border-r border-gray-950/10 bg-gray-950 text-white md:flex md:flex-col">
        <div className="relative overflow-hidden border-b border-white/10 px-6 py-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(122,184,147,0.22),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(240,138,129,0.18),_transparent_32%)]" />
          <div className="sidebar-grid-overlay" />

          <div className="relative flex items-center gap-3">
            <div className="rounded-2xl bg-white/10 p-3 text-warmgreen-300">
              <RadioTower className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-gray-400">IoT Console</p>
              <h1 className="font-heading text-xl font-extrabold text-white">Energy Supervisor</h1>
            </div>
          </div>

          <div className="relative mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500">Receiver</p>
                <p className="mt-2 text-sm font-semibold text-white">{data.sensorSummary.headline}</p>
              </div>
              <span className={`h-3 w-3 rounded-full ${statusClasses}`} />
            </div>
            <div className="mt-4 space-y-2 text-xs text-gray-400">
              <p>{data.sensorSummary.freshnessLabel}</p>
              <p>Topic: {sensorTransport.topic}</p>
              <p>Poll: {sensorTransport.pollIntervalSeconds}s</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-gray-950'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-warmgreen-500/15 font-heading text-lg font-bold text-warmgreen-300">
                {currentUser?.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{currentUser?.name}</p>
                <p className="truncate text-xs text-gray-400">{currentUser?.email}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-black/20 px-3 py-2 text-xs text-gray-400">
              <p className="uppercase tracking-[0.18em] text-gray-500">Console State</p>
              <p className="mt-1 text-gray-200">{data.sensorSummary.lastUpdatedLabel}</p>
            </div>

            <button
              onClick={logout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-coral-400/30 bg-coral-500/10 px-4 py-3 text-sm font-medium text-coral-200 transition-colors hover:bg-coral-500/15"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 overflow-y-auto pb-24 md:pb-0">
        <div className="mx-auto max-w-7xl">
          <AnimatePresence mode="wait">{children}</AnimatePresence>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-950/10 bg-white/90 px-2 py-2 backdrop-blur md:hidden">
        <div className="grid grid-cols-4 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex min-w-0 flex-col items-center rounded-2xl px-2 py-2 ${
                  isActive ? 'bg-gray-950 text-white' : 'text-gray-500'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="mt-1 text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-500">
          <Waves className="h-3.5 w-3.5" />
          <span>{data.sensorSummary.freshnessLabel}</span>
        </div>
      </nav>
    </div>
  );
}
