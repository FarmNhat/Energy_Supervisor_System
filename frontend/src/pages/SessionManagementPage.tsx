import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Monitor,
  Smartphone,
  Tablet,
  Bell,
  CheckCircle2,
  RadioTower,
  Lock,
  CircleAlert,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useHomeData } from '../hooks/useHomeData';

export function SessionManagementPage() {
  const {
    currentUser,
    sessions,
    terminateSession,
    terminateAllSessions,
    updateProfile,
  } = useAuth();
  const { sensorTransport } = useHomeData();
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [consoleName, setConsoleName] = useState(currentUser?.homeName || '');
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [prefs, setPrefs] = useState({
    thresholdAlerts: true,
    receiverOfflineAlerts: true,
    dailyDigest: false,
    aiDiagnostics: true,
  });

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setName(currentUser.name);
    setEmail(currentUser.email);
    setConsoleName(currentUser.homeName);
  }, [currentUser]);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(name, email, consoleName);
    setProfileSaved(true);
    window.setTimeout(() => setProfileSaved(false), 2500);
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword === confirmPassword && newPassword && currentPassword) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSaved(true);
      window.setTimeout(() => setPasswordSaved(false), 2500);
    }
  };

  const getDeviceIcon = (type: string) => {
    if (type === 'Mobile') return Smartphone;
    if (type === 'Tablet') return Tablet;
    return Monitor;
  };

  const strength =
    newPassword.length > 10
      ? /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword)
        ? 3
        : 2
      : newPassword.length > 0
        ? 1
        : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-6xl px-4 py-6 md:py-8"
    >
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-gray-950 p-3 text-white shadow-soft">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            Operator Access
          </h1>
          <p className="text-sm text-gray-500">
            Manage console identity, remote sessions, and alert routing for the Energy Supervisor System.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-8">
          <section className="rounded-2xl bg-white p-6 shadow-soft">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warmgreen-100 font-heading text-2xl font-bold text-warmgreen-600">
                {currentUser?.name?.charAt(0) || 'O'}
              </div>
              <div>
                <h2 className="text-lg font-heading font-bold text-gray-900">
                  {currentUser?.name || 'Operator'}
                </h2>
                <p className="text-sm text-gray-500">
                  Provisioned {currentUser?.memberSince || 'today'}
                </p>
              </div>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Operator Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-cream-300 px-4 py-2.5 outline-none transition-all focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Operator Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-cream-300 px-4 py-2.5 outline-none transition-all focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Console Label
                </label>
                <input
                  type="text"
                  value={consoleName}
                  onChange={(e) => setConsoleName(e.target.value)}
                  className="w-full rounded-xl border border-cream-300 px-4 py-2.5 outline-none transition-all focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-warmgreen-500 px-6 py-2.5 font-medium text-white transition-colors hover:bg-warmgreen-600"
                >
                  Save Identity
                </button>
                {profileSaved && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-warmgreen-600">
                    <CheckCircle2 className="h-4 w-4" /> Saved
                  </span>
                )}
              </div>
            </form>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-soft">
            <div className="mb-6 flex items-center gap-2">
              <Lock className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-heading font-bold text-gray-900">
                Password Rotation
              </h2>
            </div>

            <form onSubmit={handlePasswordSave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-cream-300 px-4 py-2.5 outline-none transition-all focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-cream-300 px-4 py-2.5 outline-none transition-all focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200"
                />
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-cream-200">
                  <div
                    className={`h-full transition-all duration-300 ${
                      strength >= 1
                        ? strength === 1
                          ? 'w-1/3 bg-coral-400'
                          : strength === 2
                            ? 'w-2/3 bg-amber-400'
                            : 'w-full bg-warmgreen-400'
                        : 'w-0'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-2.5 outline-none transition-all focus:ring-2 ${
                    confirmPassword && newPassword !== confirmPassword
                      ? 'border-coral-400 focus:border-coral-400 focus:ring-coral-200'
                      : 'border-cream-300 focus:border-warmgreen-400 focus:ring-warmgreen-200'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
                  className="rounded-xl bg-warmgreen-500 px-6 py-2.5 font-medium text-white transition-colors hover:bg-warmgreen-600 disabled:opacity-50"
                >
                  Rotate Password
                </button>
                {passwordSaved && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-warmgreen-600">
                    <CheckCircle2 className="h-4 w-4" /> Rotated
                  </span>
                )}
              </div>
            </form>
          </section>
        </div>

        <div className="space-y-8">
          <section className="rounded-2xl bg-white p-6 shadow-soft">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-gray-700" />
                <h2 className="text-lg font-heading font-bold text-gray-900">
                  Active Sessions
                </h2>
              </div>
              {sessions.length > 1 && (
                <button
                  onClick={terminateAllSessions}
                  className="text-sm font-medium text-coral-600 hover:text-coral-700"
                >
                  Revoke Remote Sessions
                </button>
              )}
            </div>

            <div className="space-y-4">
              {sessions.map((session) => {
                const Icon = getDeviceIcon(session.deviceType);

                return (
                  <div
                    key={session.id}
                    className="flex items-start gap-4 rounded-xl border border-cream-200 p-4"
                  >
                    <div className="mt-1 rounded-lg bg-cream-100 p-2 text-gray-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <p className="truncate font-heading font-bold text-gray-900">
                          {session.deviceName}
                        </p>
                        {session.isCurrent && (
                          <span className="rounded-full bg-warmgreen-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warmgreen-700">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{session.browser}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {session.location} • {session.ip} • {session.lastActive}
                      </p>
                    </div>
                    {!session.isCurrent && (
                      <button
                        onClick={() => terminateSession(session.id)}
                        className="px-2 py-1 text-sm font-medium text-coral-500 hover:text-coral-600"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-soft">
            <div className="mb-6 flex items-center gap-2">
              <Bell className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-heading font-bold text-gray-900">
                Alert Routing
              </h2>
            </div>

            <div className="space-y-5">
              {[
                {
                  id: 'thresholdAlerts',
                  label: 'Threshold Alerts',
                  desc: 'Notify when a sensor leaves its safe operating band',
                },
                {
                  id: 'receiverOfflineAlerts',
                  label: 'Receiver Offline Alerts',
                  desc: 'Alert on fetch failures or stale sensor updates',
                },
                {
                  id: 'dailyDigest',
                  label: 'Daily Digest',
                  desc: 'Summarize the current node state once per day',
                },
                {
                  id: 'aiDiagnostics',
                  label: 'AI Diagnostics',
                  desc: 'Surface the short operational suggestions panel',
                },
              ].map((pref) => (
                <div key={pref.id} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{pref.label}</p>
                    <p className="text-sm text-gray-500">{pref.desc}</p>
                  </div>
                  <button
                    onClick={() =>
                      setPrefs((p) => ({
                        ...p,
                        [pref.id]: !p[pref.id as keyof typeof prefs],
                      }))
                    }
                    className={`relative h-7 w-12 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warmgreen-500 ${
                      prefs[pref.id as keyof typeof prefs] ? 'bg-warmgreen-500' : 'bg-gray-300'
                    }`}
                  >
                    <motion.div
                      layout
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                      }}
                      className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm"
                      style={{
                        x: prefs[pref.id as keyof typeof prefs] ? 20 : 0,
                      }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-gray-950 p-6 text-white shadow-soft">
            <div className="flex items-center gap-2">
              <RadioTower className="h-5 w-5 text-warmgreen-400" />
              <h2 className="text-lg font-heading font-bold">System Snapshot</h2>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-gray-300">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Primary Feed</p>
                <p className="mt-2 font-medium text-white">{sensorTransport.receiverUrl}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Realtime Transport</p>
                <p className="mt-2 font-medium text-white">
                  {sensorTransport.pollIntervalSeconds === 0
                    ? 'WebSocket live stream'
                    : `HTTP polling every ${sensorTransport.pollIntervalSeconds} seconds`}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Payload</p>
                <p className="mt-2 font-medium text-white">
                  temperature, humidity, light, voltage
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Operator Note</p>
                <p className="mt-2 font-medium text-white">
                  Keep alerts tight. This console is tuned for a single 4-channel node.
                </p>
              </div>
            </div>
          </section>

          {(!prefs.receiverOfflineAlerts || !prefs.thresholdAlerts) && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-800">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 h-5 w-5" />
                <p className="text-sm leading-6">
                  Alert routing is partially disabled. Keep threshold and offline alerts enabled for production monitoring.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
