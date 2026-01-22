// Algorithm Button Component with Info Tooltip

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TradingAlgorithm, AlgoStatus } from '@/types/algo';

interface AlgoButtonProps {
  algorithm: TradingAlgorithm;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export default function AlgoButton({
  algorithm,
  isRunning,
  onStart,
  onStop,
  disabled = false,
}: AlgoButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
      setShowTooltip(true);
    }
  };

  const getStatusColor = (status: AlgoStatus): string => {
    switch (status) {
      case 'running':
        return 'from-green-500 to-green-700 shadow-green-500/30';
      case 'completed':
        return 'from-blue-500 to-blue-700 shadow-blue-500/30';
      case 'error':
        return 'from-red-500 to-red-700 shadow-red-500/30';
      case 'cancelled':
        return 'from-orange-500 to-orange-700 shadow-orange-500/30';
      default:
        return 'from-purple-500 to-purple-700 shadow-purple-500/30';
    }
  };

  const getStatusIcon = (status: AlgoStatus): string => {
    switch (status) {
      case 'running':
        return '▶️';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      case 'cancelled':
        return '⏹️';
      default:
        return '🤖';
    }
  };

  return (
    <div className="relative overflow-visible">
      {/* Main Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={isRunning ? onStop : onStart}
          disabled={disabled}
          className={`
            relative px-4 py-3 rounded-xl font-semibold text-sm transition-all
            bg-linear-to-r ${getStatusColor(algorithm.status)}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg cursor-pointer'}
            ${isRunning ? 'animate-pulse' : ''}
          `}
        >
          <div className="flex items-center gap-2">
            <span>{getStatusIcon(algorithm.status)}</span>
            <div className="text-left">
              <div className="font-bold">{algorithm.shortName}</div>
              <div className="text-xs opacity-80">
                {isRunning ? 'Running...' : algorithm.status === 'completed' ? 'Completed' : 'Click to Start'}
              </div>
            </div>
          </div>
          
          {/* Running indicator */}
          {isRunning && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
          )}
        </button>

        {/* Info Button */}
        <button
          ref={buttonRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => setShowTooltip(!showTooltip)}
          className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-300 hover:text-white transition-all cursor-pointer"
        >
          <span className="text-sm font-bold">i</span>
        </button>
      </div>

      {/* Tooltip - Rendered via Portal */}
      {mounted && showTooltip && createPortal(
        <div 
          className="fixed z-[9999] w-80 p-4 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl"
          style={{ 
            top: `${tooltipPosition.top}px`, 
            left: `${tooltipPosition.left}px` 
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="absolute -top-2 left-8 w-4 h-4 bg-gray-800 border-l border-t border-gray-600 transform rotate-45" />
          
          <h3 className="font-bold text-white mb-2 flex items-center gap-2">
            <span>🤖</span>
            {algorithm.name}
          </h3>
          
          <div className="text-sm text-gray-300 whitespace-pre-line prose prose-invert prose-sm max-w-none">
            {algorithm.detailedDescription.split('\n').map((line, i) => {
              if (line.startsWith('**') && line.endsWith('**')) {
                return <p key={i} className="font-bold text-cyan-400 mt-2">{line.replace(/\*\*/g, '')}</p>;
              }
              if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.')) {
                return <p key={i} className="ml-2 text-gray-300">{line}</p>;
              }
              if (line.startsWith('   -')) {
                return <p key={i} className="ml-4 text-yellow-400">{line}</p>;
              }
              if (line.startsWith('**Use Case:**')) {
                return <p key={i} className="mt-2 text-green-400 italic">{line.replace(/\*\*/g, '')}</p>;
              }
              return line ? <p key={i}>{line}</p> : null;
            })}
          </div>

          {/* Rules Status */}
          {algorithm.rules.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-500 mb-2">Rules Status:</p>
              <div className="space-y-1">
                {algorithm.rules.map((rule, idx) => (
                  <div key={rule.id} className="flex items-center gap-2 text-xs">
                    <span className={rule.executed ? 'text-green-400' : 'text-gray-500'}>
                      {rule.executed ? '✓' : '○'}
                    </span>
                    <span className={rule.executed ? 'text-gray-400 line-through' : 'text-gray-300'}>
                      Rule {idx + 1}: {rule.condition.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
