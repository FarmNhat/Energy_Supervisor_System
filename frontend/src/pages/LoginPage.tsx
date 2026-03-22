import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
interface LoginPageProps {
  onNavigateToRegister: () => void;
}
export function LoginPage({ onNavigateToRegister }: LoginPageProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4 font-body selection:bg-warmgreen-200 selection:text-warmgreen-900">
      <motion.div
        initial={{
          opacity: 0,
          y: 20
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 24
        }}
        className="bg-white rounded-2xl shadow-soft p-8 w-full max-w-md">

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-warmgreen-100 rounded-full flex items-center justify-center mb-4 text-warmgreen-600">
            <Home className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">
            Operator Login
          </h1>
          <p className="text-gray-500 text-center">
            Sign in to the Energy Supervisor dashboard
          </p>
        </div>

        {error &&
        <motion.div
          initial={{
            opacity: 0,
            height: 0
          }}
          animate={{
            opacity: 1,
            height: 'auto'
          }}
          className="mb-6 p-4 bg-coral-50 rounded-xl flex items-start gap-3 text-coral-600">

            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        }

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1.5"
              htmlFor="username">

              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-cream-300 bg-white px-4 py-2.5 text-gray-900 focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200 outline-none transition-all"
              placeholder="operator" />

          </div>

          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1.5"
              htmlFor="password">

              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-cream-300 bg-white px-4 py-2.5 text-gray-900 focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200 outline-none transition-all"
              placeholder="••••••••" />

          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-cream-300 text-warmgreen-500 focus:ring-warmgreen-500" />

              <span className="text-sm text-gray-600">Remember me</span>
            </label>
            <button
              type="button"
              className="text-sm font-medium text-warmgreen-600 hover:text-warmgreen-700">

              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-warmgreen-500 text-white rounded-xl py-3 font-medium hover:bg-warmgreen-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">

            {isLoading ?
            <Loader2 className="w-5 h-5 animate-spin" /> :

            'Sign In'
            }
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={onNavigateToRegister}
              className="font-medium text-warmgreen-600 hover:text-warmgreen-700 transition-colors">

              Create one
            </button>
          </p>
        </div>
      </motion.div>
    </div>);

}
