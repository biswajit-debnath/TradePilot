// Algorithm Status Card - Shows running algorithm details and execution log

import { TradingAlgorithm, AlgoLogEntry } from '@/types/algo';
import { useEffect, useRef } from 'react';

interface AlgoStatusCardProps {
  algorithm: TradingAlgorithm | null;
  currentPrice: number | null;
  buyPrice: number | null;
}

export default function AlgoStatusCard({
  algorithm,
  currentPrice,
  buyPrice,
}: AlgoStatusCardProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [algorithm?.executionLog.length]);

  if (!algorithm || algorithm.status === 'idle') {
    return null;
  }

  const pointsFromBuy = currentPrice !== null && buyPrice !== null
    ? currentPrice - buyPrice
    : null;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getLogTypeStyles = (type: AlgoLogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-400 bg-green-500/10';
      case 'error':
        return 'text-red-400 bg-red-500/10';
      case 'action':
        return 'text-yellow-400 bg-yellow-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getStatusBadge = () => {
    switch (algorithm.status) {
      case 'running':
        return (
          <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Running
          </span>
        );
      case 'completed':
        return (
          <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full">
            ✅ Completed
          </span>
        );
      case 'error':
        return (
          <span className="text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded-full">
            ❌ Error
          </span>
        );
      case 'cancelled':
        return (
          <span className="text-xs text-orange-400 bg-orange-500/20 px-2 py-1 rounded-full">
            ⏹️ Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="glass-card rounded-xl p-4 md:p-6 mb-4 md:mb-5 border border-cyan-500/30">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4">
        <div className="flex items-center gap-2 md:gap-3">
          <h2 className="text-lg md:text-xl font-semibold text-cyan-400">
            📊 Algorithm Status
          </h2>
          {getStatusBadge()}
        </div>
        <span className="text-xs text-gray-500">
          {algorithm.name}
        </span>
      </div>

      {/* Current State */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-black/30 p-3 rounded-lg">
          <p className="text-gray-500 text-xs mb-1">Buy Price</p>
          <p className="text-lg font-bold text-white">
            {buyPrice !== null ? `₹${buyPrice.toFixed(2)}` : '--'}
          </p>
        </div>
        <div className="bg-black/30 p-3 rounded-lg">
          <p className="text-gray-500 text-xs mb-1">Current Price</p>
          <p className={`text-lg font-bold ${
            pointsFromBuy !== null
              ? pointsFromBuy > 0 ? 'text-green-400' : pointsFromBuy < 0 ? 'text-red-400' : 'text-white'
              : 'text-white'
          }`}>
            {currentPrice !== null ? `₹${currentPrice.toFixed(2)}` : '--'}
          </p>
        </div>
        <div className="bg-black/30 p-3 rounded-lg">
          <p className="text-gray-500 text-xs mb-1">Points from Buy</p>
          <p className={`text-lg font-bold ${
            pointsFromBuy !== null
              ? pointsFromBuy > 0 ? 'text-green-400' : pointsFromBuy < 0 ? 'text-red-400' : 'text-white'
              : 'text-white'
          }`}>
            {pointsFromBuy !== null ? (
              <>
                {pointsFromBuy > 0 ? '+' : ''}{pointsFromBuy.toFixed(2)}
              </>
            ) : '--'}
          </p>
        </div>
        <div className="bg-black/30 p-3 rounded-lg">
          <p className="text-gray-500 text-xs mb-1">Rules Executed</p>
          <p className="text-lg font-bold text-white">
            {algorithm.rules.filter(r => r.executed).length} / {algorithm.rules.length}
          </p>
        </div>
      </div>

      {/* Rules Progress */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-400 mb-2">Rules Progress:</p>
        <div className="space-y-2">
          {algorithm.rules.map((rule, idx) => (
            <div 
              key={rule.id} 
              className={`flex items-center gap-3 p-2 rounded-lg ${
                rule.executed 
                  ? 'bg-green-500/10 border border-green-500/30' 
                  : 'bg-black/30'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                rule.executed 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-700 text-gray-400'
              }`}>
                {rule.executed ? '✓' : idx + 1}
              </span>
              <div className="flex-1">
                <p className={`text-sm ${rule.executed ? 'text-green-400' : 'text-gray-300'}`}>
                  {rule.condition.description}
                </p>
                <p className="text-xs text-gray-500">
                  → {rule.action.params.description}
                </p>
              </div>
              {rule.executedAt && (
                <span className="text-xs text-gray-500">
                  {formatTime(rule.executedAt)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Execution Log */}
      {algorithm.executionLog.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-400 mb-2">Execution Log:</p>
          <div 
            ref={logContainerRef}
            className="bg-black/50 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1 font-mono text-xs"
          >
            {algorithm.executionLog.map((log, idx) => (
              <div 
                key={idx} 
                className={`p-1.5 rounded ${getLogTypeStyles(log.type)}`}
              >
                <span className="text-gray-500">[{formatTime(log.timestamp)}]</span>{' '}
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {algorithm.error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">
            <span className="font-bold">Error:</span> {algorithm.error}
          </p>
        </div>
      )}
    </div>
  );
}
