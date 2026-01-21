// Algorithm Panel Component - Contains all algorithm buttons

import { TradingAlgorithm } from '@/types/algo';
import AlgoButton from './AlgoButton';

interface AlgoPanelProps {
  algorithms: TradingAlgorithm[];
  runningAlgoId: string | null;
  onStartAlgo: (algoId: string) => void;
  onStopAlgo: (algoId: string) => void;
  disabled?: boolean;
}

export default function AlgoPanel({
  algorithms,
  runningAlgoId,
  onStartAlgo,
  onStopAlgo,
  disabled = false,
}: AlgoPanelProps) {
  return (
    <div className="glass-card rounded-xl p-4 md:p-6 mb-4 md:mb-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4 md:mb-5">
        <div className="flex items-center gap-2 md:gap-3">
          <h2 className="text-lg md:text-xl font-semibold text-cyan-400">
            🤖 Trading Algorithms
          </h2>
          {runningAlgoId && (
            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Active
            </span>
          )}
        </div>
        <span className="text-xs md:text-sm text-gray-500">
          {algorithms.length} algorithm(s) available
        </span>
      </div>

      {/* Info Banner */}
      <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <p className="text-xs text-blue-300">
          <span className="font-bold">💡 Tip:</span> Click on an algorithm button to start it. 
          Hover over the <span className="inline-flex items-center justify-center w-4 h-4 bg-gray-600 rounded-full text-xs">i</span> button for detailed description.
          Only one algorithm can run at a time.
        </p>
      </div>

      {/* Algorithm Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {algorithms.map((algo) => (
          <AlgoButton
            key={algo.id}
            algorithm={algo}
            isRunning={runningAlgoId === algo.id && algo.status === 'running'}
            onStart={() => onStartAlgo(algo.id)}
            onStop={() => onStopAlgo(algo.id)}
            disabled={disabled || (runningAlgoId !== null && runningAlgoId !== algo.id)}
          />
        ))}
      </div>

      {/* No Algorithms Message */}
      {algorithms.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-2">🤖</p>
          <p>No algorithms available</p>
        </div>
      )}
    </div>
  );
}
