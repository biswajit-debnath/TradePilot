// Algorithm Terminal - Terminal-style execution viewer with manual triggers

import { TradingAlgorithm, AlgoRule, AlgoLogEntry } from '@/types/algo';
import { useEffect, useRef } from 'react';

interface AlgoTerminalProps {
  algorithm: TradingAlgorithm | null;
  currentPrice: number | null;
  buyPrice: number | null;
  onManualTrigger?: (ruleId: string) => void;
}

export default function AlgoTerminal({
  algorithm,
  currentPrice,
  buyPrice,
  onManualTrigger,
}: AlgoTerminalProps) {
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
      hour12: false,
    });
  };

  const getRuleStatusIcon = (rule: AlgoRule) => {
    if (rule.executed) {
      return <span className="text-green-400">✓</span>;
    }
    
    // Check if condition would be met
    if (pointsFromBuy !== null) {
      const wouldExecute = checkRuleCondition(rule, pointsFromBuy);
      if (wouldExecute && algorithm.status === 'running') {
        return <span className="text-yellow-400 animate-pulse">⟳</span>;
      }
    }
    
    return <span className="text-gray-600">○</span>;
  };

  const checkRuleCondition = (rule: AlgoRule, points: number): boolean => {
    const { condition } = rule;
    switch (condition.type) {
      case 'points_gain':
        return points >= condition.value;
      case 'points_loss':
        return points <= -condition.value;
      default:
        return false;
    }
  };

  const getRuleProgressBar = (rule: AlgoRule): number => {
    if (rule.executed) return 100;
    if (pointsFromBuy === null) return 0;

    const { condition } = rule;
    let progress = 0;

    switch (condition.type) {
      case 'points_gain':
        progress = Math.min((pointsFromBuy / condition.value) * 100, 100);
        break;
      case 'points_loss':
        progress = Math.min((Math.abs(pointsFromBuy) / condition.value) * 100, 100);
        break;
    }

    return Math.max(0, progress);
  };

  const getLogTypeColor = (type: AlgoLogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'action':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="glass-card rounded-xl p-4 md:p-6 mb-4 md:mb-5 bg-black/60 border border-cyan-500/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-green-400 text-sm font-mono">●</span>
          <h3 className="text-base font-mono text-cyan-400">ALGO_TERMINAL</h3>
          <span className="text-xs font-mono text-gray-500">
            {algorithm.status === 'running' ? '> running' : `> ${algorithm.status}`}
          </span>
        </div>
        <div className="text-xs font-mono text-gray-500">
          {currentPrice && buyPrice && (
            <span className={pointsFromBuy! >= 0 ? 'text-green-400' : 'text-red-400'}>
              {pointsFromBuy! >= 0 ? '+' : ''}{pointsFromBuy?.toFixed(2)} pts
            </span>
          )}
        </div>
      </div>

      {/* Rules Execution Steps */}
      <div className="mb-4 space-y-3">
        <div className="text-xs font-mono text-gray-400 mb-2">EXECUTION PIPELINE:</div>
        {algorithm.rules.map((rule, index) => {
          const progress = getRuleProgressBar(rule);
          const isActive = !rule.executed && algorithm.status === 'running';

          return (
            <div
              key={rule.id}
              className={`p-3 rounded-lg border transition-all ${
                rule.executed
                  ? 'bg-green-900/20 border-green-500/30'
                  : isActive
                  ? 'bg-cyan-900/20 border-cyan-500/30'
                  : 'bg-gray-900/30 border-gray-700/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-start gap-3 flex-1">
                  {/* Status Icon */}
                  <div className="text-lg mt-0.5">{getRuleStatusIcon(rule)}</div>
                  
                  {/* Rule Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-500">
                        RULE_{index + 1}
                      </span>
                      {rule.executedAt && (
                        <span className="text-[10px] font-mono text-green-400">
                          [{formatTime(rule.executedAt)}]
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-300 mb-1">
                      {rule.condition.description}
                    </div>
                    <div className="text-xs font-mono text-cyan-400">
                      → {rule.action.params.description}
                    </div>
                    
                    {/* Progress Bar */}
                    {!rule.executed && (
                      <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            progress >= 100 ? 'bg-green-400' : 'bg-cyan-400'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Manual Trigger Button */}
                {!rule.executed && onManualTrigger && (
                  <button
                    onClick={() => onManualTrigger(rule.id)}
                    disabled={algorithm.status !== 'running'}
                    className="px-3 py-1 text-xs font-mono rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600 hover:border-cyan-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Manually trigger this rule"
                  >
                    EXEC
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Execution Log - Terminal Style */}
      <div className="border-t border-gray-700 pt-4">
        <div className="text-xs font-mono text-gray-400 mb-2">EXECUTION LOG:</div>
        <div
          ref={logContainerRef}
          className="bg-black/80 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-xs space-y-1 border border-gray-800"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#4B5563 #1F2937',
          }}
        >
          {algorithm.executionLog.length === 0 ? (
            <div className="text-gray-600 italic">Waiting for events...</div>
          ) : (
            algorithm.executionLog.map((log, index) => (
              <div
                key={index}
                className={`${getLogTypeColor(log.type)} leading-relaxed`}
              >
                <span className="text-gray-600">[{formatTime(log.timestamp)}]</span>{' '}
                <span className="text-gray-500">{log.ruleId}:</span> {log.message}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Algorithm Info */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div>
            <span className="text-gray-500">ALGO_ID:</span>{' '}
            <span className="text-gray-300">{algorithm.id}</span>
          </div>
          <div>
            <span className="text-gray-500">STARTED:</span>{' '}
            <span className="text-gray-300">
              {algorithm.startedAt ? formatTime(algorithm.startedAt) : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
