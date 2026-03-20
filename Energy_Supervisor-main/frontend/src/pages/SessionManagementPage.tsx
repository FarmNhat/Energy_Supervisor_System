import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Shield,
  Monitor,
  Smartphone,
  Tablet,
  Bell,
  CheckCircle2 } from
'lucide-react';
import { useAuth } from '../hooks/useAuth';
export function SessionManagementPage() {
  const {
    currentUser,
    sessions,
    terminateSession,
    terminateAllSessions,
    updateProfile
  } = useAuth();
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [homeName, setHomeName] = useState(currentUser?.homeName || '');
  const [profileSaved, setProfileSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [prefs, setPrefs] = useState({
    energyAlerts: true,
    overloadWarnings: true,
    weeklyReports: false,
    aiSuggestions: true
  });
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(name, email, homeName);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };
  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword === confirmPassword) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Mock success
    }
  };
  const getDeviceIcon = (type: string) => {
    if (type === 'Mobile') return Smartphone;
    if (type === 'Tablet') return Tablet;
    return Monitor;
  };
  const strength =
  newPassword.length > 8 ?
  /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ?
  3 :
  2 :
  newPassword.length > 0 ?
  1 :
  0;
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      exit={{
        opacity: 0,
        y: -10
      }}
      transition={{
        duration: 0.3
      }}
      className="max-w-6xl mx-auto px-4 py-6 md:py-8">

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-gray-100 text-gray-700 rounded-xl">
          <Users className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          Profile & Security
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Profile Section */}
          <section className="bg-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-warmgreen-100 flex items-center justify-center text-warmgreen-600 font-heading font-bold text-2xl">
                {currentUser?.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-heading font-bold text-gray-900">
                  {currentUser?.name}
                </h2>
                <p className="text-sm text-gray-500">
                  Member since {currentUser?.memberSince}
                </p>
              </div>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-cream-300 px-4 py-2.5 focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200 outline-none" />

              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-cream-300 px-4 py-2.5 focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200 outline-none" />

              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Home Name
                </label>
                <input
                  type="text"
                  value={homeName}
                  onChange={(e) => setHomeName(e.target.value)}
                  className="w-full rounded-xl border border-cream-300 px-4 py-2.5 focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200 outline-none" />

              </div>
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-warmgreen-500 text-white rounded-xl px-6 py-2.5 font-medium hover:bg-warmgreen-600 transition-colors">

                  Save Profile
                </button>
                {profileSaved &&
                <span className="flex items-center gap-1.5 text-sm font-medium text-warmgreen-600">
                    <CheckCircle2 className="w-4 h-4" /> Saved
                  </span>
                }
              </div>
            </form>
          </section>

          {/* Security Section */}
          <section className="bg-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-heading font-bold text-gray-900">
                Change Password
              </h2>
            </div>

            <form onSubmit={handlePasswordSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-cream-300 px-4 py-2.5 focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200 outline-none" />

              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-cream-300 px-4 py-2.5 focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200 outline-none" />

                <div className="mt-2 flex gap-1 h-1.5 w-full rounded-full overflow-hidden bg-cream-200">
                  <div
                    className={`h-full transition-all duration-300 ${strength >= 1 ? strength === 1 ? 'bg-coral-400 w-1/3' : strength === 2 ? 'bg-amber-400 w-2/3' : 'bg-warmgreen-400 w-full' : 'w-0'}`} />

                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-2.5 focus:ring-2 outline-none transition-all ${confirmPassword && newPassword !== confirmPassword ? 'border-coral-400 focus:border-coral-400 focus:ring-coral-200' : 'border-cream-300 focus:border-warmgreen-400 focus:ring-warmgreen-200'}`} />

              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={
                  !currentPassword ||
                  !newPassword ||
                  newPassword !== confirmPassword
                  }
                  className="bg-warmgreen-500 text-white rounded-xl px-6 py-2.5 font-medium hover:bg-warmgreen-600 transition-colors disabled:opacity-50">

                  Update Password
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Active Sessions */}
          <section className="bg-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-heading font-bold text-gray-900">
                  Active Sessions
                </h2>
              </div>
              {sessions.length > 1 &&
              <button
                onClick={terminateAllSessions}
                className="text-sm font-medium text-coral-600 hover:text-coral-700">

                  Log Out All Other Devices
                </button>
              }
            </div>

            <div className="space-y-4">
              {sessions.map((session) => {
                const Icon = getDeviceIcon(session.deviceType);
                return (
                  <div
                    key={session.id}
                    className="flex items-start gap-4 p-4 rounded-xl border border-cream-200">

                    <div className="p-2 bg-cream-100 rounded-lg text-gray-600 mt-1">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-heading font-bold text-gray-900 truncate">
                          {session.deviceName}
                        </p>
                        {session.isCurrent &&
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-warmgreen-100 text-warmgreen-700">
                            Current
                          </span>
                        }
                      </div>
                      <p className="text-sm text-gray-500">{session.browser}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {session.location} • {session.ip} • {session.lastActive}
                      </p>
                    </div>
                    {!session.isCurrent &&
                    <button
                      onClick={() => terminateSession(session.id)}
                      className="text-sm font-medium text-coral-500 hover:text-coral-600 px-2 py-1">

                        Terminate
                      </button>
                    }
                  </div>);

              })}
            </div>
          </section>

          {/* Notification Preferences */}
          <section className="bg-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-heading font-bold text-gray-900">
                Notification Preferences
              </h2>
            </div>

            <div className="space-y-6">
              {[
              {
                id: 'energyAlerts',
                label: 'Energy Alerts',
                desc: 'Get notified when usage spikes'
              },
              {
                id: 'overloadWarnings',
                label: 'Overload Warnings',
                desc: 'Critical alerts for circuit protection'
              },
              {
                id: 'weeklyReports',
                label: 'Weekly Reports',
                desc: 'Summary of your energy consumption'
              },
              {
                id: 'aiSuggestions',
                label: 'AI Suggestions',
                desc: 'Smart tips to save energy'
              }].
              map((pref) =>
              <div
                key={pref.id}
                className="flex items-center justify-between">

                  <div>
                    <p className="font-medium text-gray-900">{pref.label}</p>
                    <p className="text-sm text-gray-500">{pref.desc}</p>
                  </div>
                  <button
                  onClick={() =>
                  setPrefs((p) => ({
                    ...p,
                    [pref.id]: !p[pref.id as keyof typeof prefs]
                  }))
                  }
                  className={`relative w-12 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warmgreen-500 ${prefs[pref.id as keyof typeof prefs] ? 'bg-warmgreen-500' : 'bg-gray-300'}`}>

                    <motion.div
                    layout
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30
                    }}
                    className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm"
                    style={{
                      x: prefs[pref.id as keyof typeof prefs] ? 20 : 0
                    }} />

                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </motion.div>);

}