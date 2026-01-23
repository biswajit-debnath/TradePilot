'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validation
      if (!username || !password) {
        throw new Error('Username and password are required');
      }

      if (!isLogin) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
      }

      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          confirmPassword: password,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (isLogin) {
        // Store token and username in localStorage
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        if (data.user?.username) {
          localStorage.setItem('username', data.user.username);
        }
        // Redirect to dashboard
        router.push('/');
      } else {
        // Show success and switch to login
        setError(null);
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setIsLogin(true);
        // Show success message by setting alert
        window.alert('Registration successful! Please login now.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl backdrop-blur-xl border border-gray-700/50">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <span className="text-3xl">✈️</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">TradePilot</h1>
            <p className="text-gray-400">{isLogin ? 'Welcome back' : 'Join the platform'}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-700/70 transition-all"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-700/70 transition-all"
                disabled={isLoading}
              />
            </div>

            {/* Confirm Password (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-700/70 transition-all"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20 mt-6"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Processing...
                </span>
              ) : (
                isLogin ? 'Login' : 'Create Account'
              )}
            </button>
          </form>

          {/* Toggle Section */}
          <div className="mt-6 pt-6 border-t border-gray-700/50 text-center">
            <p className="text-gray-400 text-sm mb-3">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-cyan-400 hover:text-cyan-300 font-medium text-sm transition-colors"
            >
              {isLogin ? 'Sign up here' : 'Login here'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>© 2026 TradePilot. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
