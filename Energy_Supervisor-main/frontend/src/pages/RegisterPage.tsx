import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
interface RegisterPageProps {
  onNavigateToLogin: () => void;
}
export function RegisterPage({ onNavigateToLogin }: RegisterPageProps) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const calculateStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length > 6) score += 1;
    if (pass.length > 10) score += 1;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;
    return score;
  };
  const strength = calculateStrength(password);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return;
    setIsLoading(true);
    try {
      await register(name, email, password);
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
            Create Your Home
          </h1>
          <p className="text-gray-500 text-center">
            Set up your smart home account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1.5"
              htmlFor="name">

              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-cream-300 bg-white px-4 py-2.5 text-gray-900 focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200 outline-none transition-all"
              placeholder="Jane Doe" />

          </div>

          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1.5"
              htmlFor="email">

              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-cream-300 bg-white px-4 py-2.5 text-gray-900 focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200 outline-none transition-all"
              placeholder="you@example.com" />

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

            {/* Password Strength Indicator */}
            <div className="mt-2 flex gap-1 h-1.5 w-full rounded-full overflow-hidden bg-cream-200">
              <div
                className={`h-full transition-all duration-300 ${strength >= 1 ? strength === 1 ? 'bg-coral-400 w-1/3' : strength === 2 ? 'bg-amber-400 w-2/3' : 'bg-warmgreen-400 w-full' : 'w-0'}`} />

            </div>
            <p className="text-xs text-gray-500 mt-1">
              {strength === 0 && 'Enter a password'}
              {strength === 1 && 'Weak'}
              {strength === 2 && 'Good'}
              {strength === 3 && 'Strong'}
            </p>
          </div>

          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1.5"
              htmlFor="confirmPassword">

              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full rounded-xl border bg-white px-4 py-2.5 text-gray-900 focus:ring-2 outline-none transition-all ${confirmPassword && password !== confirmPassword ? 'border-coral-400 focus:border-coral-400 focus:ring-coral-200' : 'border-cream-300 focus:border-warmgreen-400 focus:ring-warmgreen-200'}`}
              placeholder="••••••••" />

          </div>

          <label className="flex items-start gap-2 cursor-pointer mt-2">
            <input
              type="checkbox"
              required
              className="w-4 h-4 mt-0.5 rounded border-cream-300 text-warmgreen-500 focus:ring-warmgreen-500" />

            <span className="text-sm text-gray-600">
              I agree to the{' '}
              <a href="#" className="text-warmgreen-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-warmgreen-600 hover:underline">
                Privacy Policy
              </a>
            </span>
          </label>

          <button
            type="submit"
            disabled={
            isLoading ||
            password !== confirmPassword && confirmPassword !== ''
            }
            className="w-full bg-warmgreen-500 text-white rounded-xl py-3 font-medium hover:bg-warmgreen-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4">

            {isLoading ?
            <Loader2 className="w-5 h-5 animate-spin" /> :

            'Create Account'
            }
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={onNavigateToLogin}
              className="font-medium text-warmgreen-600 hover:text-warmgreen-700 transition-colors">

              Sign in
            </button>
          </p>
        </div>
      </motion.div>
    </div>);

}