'use client';

import { useEffect, useState } from 'react';

interface AlertProps {
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function Alert({ message, type }: AlertProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  return (
    <div 
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4 transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className={`p-4 rounded-xl border shadow-lg backdrop-blur-sm ${
        type === 'success' ? 'bg-green-500/90 border-green-400 text-white' :
        type === 'error' ? 'bg-red-500/90 border-red-400 text-white' :
        'bg-cyan-500/90 border-cyan-400 text-white'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
          </span>
          <span className="flex-1">{message}</span>
        </div>
      </div>
    </div>
  );
}
