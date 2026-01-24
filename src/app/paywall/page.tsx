'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/client-auth';

export default function PaywallPage() {
  const router = useRouter();
  const { getUsername, logout } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = getUsername();
    if (!user) {
      router.push('/auth');
      return;
    }
    
    if (user !== 'gurjyot') {
      router.push('/');
      return;
    }
    
    setUsername(user);
    setIsLoading(false);
  }, [router, getUsername]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Paywall Card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl backdrop-blur-xl border border-gray-700/50">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                <span className="text-3xl">🔒</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Premium Access Required</h1>
            <p className="text-gray-400">Pay the Lord to unlock all features with TradePilot Pro</p>
          </div>

          {/* QR Code Section */}
          <div className="mb-8 flex justify-center">
            <div className="bg-white rounded-lg p-4 shadow-lg">
              <img 
                src="/qr-code.jpeg" 
                alt="Payment QR Code" 
                className="w-48 h-48 object-contain"
              />
            </div>
          </div>

          {/* Features List */}
          <div className="mb-8 space-y-3">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">Premium Features Include:</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span>
                <span>Real-time position tracking</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span>
                <span>Automated SL/TP management</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span>
                <span>Algorithm trading strategies</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span>
                <span>Advanced trade analytics</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span>
                <span>24/7 priority support</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-8 p-4 rounded-lg bg-cyan-600/10 border border-cyan-500/30">
            <p className="text-sm text-cyan-300 text-center">
              Scan the QR code above to complete payment. You'll receive access within minutes.
            </p>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => {
              logout();
            }}
            className="w-full py-2 px-4 rounded-lg font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 transition-all"
          >
            Logout
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-500">
          <p>Having issues? Contact hello@backendandbeyond.com</p>
        </div>
      </div>
    </div>
  );
}
