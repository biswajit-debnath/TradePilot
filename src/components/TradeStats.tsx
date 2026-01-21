import { TradeAnalytics } from '@/types';

interface TradeStatsProps {
  analytics: TradeAnalytics;
}

export default function TradeStats({ analytics }: TradeStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Trades Card */}
      <div className="glass-card p-5 rounded-xl hover:scale-105 transition-transform">
        <div className="flex items-center justify-between mb-2">
          <div className="text-gray-400 text-sm">Total Trades</div>
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div className="text-2xl font-bold text-white mb-2">{analytics.totalTrades}</div>
        <div className="flex gap-3 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-green-400">✓</span>
            <span className="text-gray-300">{analytics.winningTrades}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-red-400">✗</span>
            <span className="text-gray-300">{analytics.losingTrades}</span>
          </div>
        </div>
      </div>

      {/* Total P&L Card */}
      <div className="glass-card p-5 rounded-xl hover:scale-105 transition-transform">
        <div className="flex items-center justify-between mb-2">
          <div className="text-gray-400 text-sm">Total P&L</div>
          <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className={`text-2xl font-bold mb-2 ${analytics.totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          ₹{analytics.totalProfitLoss.toFixed(2)}
        </div>
        <div className="text-sm text-gray-400">
          Profit Factor: <span className="text-white font-semibold">
            {analytics.profitFactor === Infinity ? '∞' : analytics.profitFactor.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Win Rate Card */}
      <div className="glass-card p-5 rounded-xl hover:scale-105 transition-transform">
        <div className="flex items-center justify-between mb-2">
          <div className="text-gray-400 text-sm">Win Rate</div>
          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <div className="text-2xl font-bold text-white mb-2">{analytics.winRate.toFixed(1)}%</div>
        <div className="text-sm text-gray-400">
          Avg Win: <span className="text-green-400 font-semibold">₹{analytics.averageProfit.toFixed(0)}</span>
        </div>
      </div>

      {/* Largest Win/Loss Card */}
      <div className="glass-card p-5 rounded-xl hover:scale-105 transition-transform">
        <div className="flex items-center justify-between mb-2">
          <div className="text-gray-400 text-sm">Best/Worst</div>
          <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Win:</span>
            <span className="text-lg font-bold text-green-400">₹{analytics.largestWin.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Loss:</span>
            <span className="text-lg font-bold text-red-400">₹{analytics.largestLoss.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
