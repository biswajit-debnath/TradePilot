import { OrderDetails } from '@/types';

interface LivePositionCardProps {
  lastOrder: OrderDetails | null;
  currentPrice: number | null;
  gainLossPoints: number | null;
  gainLossPercentage: number | null;
  gainLossValue: number | null;
  lastUpdated: Date | null;
  isRefreshing: boolean;
  isLiveUpdating: boolean;
  onRefreshPosition: () => void;
  onToggleLiveUpdate: () => void;
  onExitAll: () => void;
  isLoading: boolean;
}

export default function LivePositionCard({
  lastOrder,
  currentPrice,
  gainLossPoints,
  gainLossPercentage,
  gainLossValue,
  lastUpdated,
  isRefreshing,
  isLiveUpdating,
  onRefreshPosition,
  onToggleLiveUpdate,
  onExitAll,
  isLoading,
}: LivePositionCardProps) {
  const formatTime = (date: Date | null) => {
    if (!date) return '--:--:--';
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const isProfit = gainLossPoints !== null && gainLossPoints > 0;
  const isLoss = gainLossPoints !== null && gainLossPoints < 0;

  return (
    <div className="glass-card rounded-xl p-4 md:p-6 mb-4 md:mb-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4 md:mb-5">
        <div className="flex items-center gap-2 md:gap-3">
          <h2 className="text-lg md:text-xl font-semibold text-cyan-400">
            📊 Live Position {lastOrder && `(${lastOrder.order_category})`}
          </h2>
          {/* Exit All Button - Small, placed with heading */}
          {lastOrder && (
            <button
              onClick={onExitAll}
              disabled={isLoading || isRefreshing}
              className="px-2 py-1 text-xs font-medium rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 hover:border-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-red-400 hover:text-red-300"
              title="Exit Position & Cancel Orders"
            >
              ⛔ Exit
            </button>
          )}
        </div>
        
        {/* Live Update Toggle */}
        <div className="flex items-center gap-2">
            {isLiveUpdating && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live
            </span>
          )}
          <span className="text-xs text-gray-400">Live Updates:</span>
          <button
            onClick={onToggleLiveUpdate}
            className={`relative w-12 h-6 rounded-full transition-all ${
              isLiveUpdating 
                ? 'bg-green-500/30 border border-green-500/50' 
                : 'bg-gray-700 border border-gray-600'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${
                isLiveUpdating 
                  ? 'left-6 bg-green-400 shadow-lg shadow-green-500/50' 
                  : 'left-0.5 bg-gray-400'
              }`}
            />
          </button>
          
        </div>
      </div>

      {lastOrder ? (
        <>
          {/* Position Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4 md:mb-5">
            <div className="bg-black/30 p-2 md:p-3 rounded-lg">
              <p className="text-gray-500 text-xs mb-0.5">Symbol</p>
              <p className="text-sm md:text-base font-semibold truncate">{lastOrder.symbol || '-'}</p>
            </div>
            <div className="bg-black/30 p-2 md:p-3 rounded-lg">
              <p className="text-gray-500 text-xs mb-0.5">Category</p>
              <p className="text-sm md:text-base font-semibold">
                {lastOrder.order_category === 'OPTION' ? (
                  <span className="text-purple-400"><span className="hidden sm:inline">📊 </span>Option</span>
                ) : (
                  <span className="text-blue-400"><span className="hidden sm:inline">📈 </span>Stock</span>
                )}
              </p>
            </div>
            
            {lastOrder.order_category === 'OPTION' && (
              <>
                <div className="bg-black/30 p-2 md:p-3 rounded-lg">
                  <p className="text-gray-500 text-xs mb-0.5">Type</p>
                  <p className="text-sm md:text-base font-semibold">{lastOrder.option_type || '-'}</p>
                </div>
                <div className="bg-black/30 p-2 md:p-3 rounded-lg">
                  <p className="text-gray-500 text-xs mb-0.5">Strike Price</p>
                  <p className="text-sm md:text-base font-semibold">₹{lastOrder.strike_price || '-'}</p>
                </div>
              </>
            )}
            
            {lastOrder.order_category === 'STOCK' && (
              <div className="bg-black/30 p-2 md:p-3 rounded-lg">
                <p className="text-gray-500 text-xs mb-0.5">Product Type</p>
                <p className="text-sm md:text-base font-semibold">{lastOrder.product_type}</p>
              </div>
            )}
            
            <div className="bg-black/30 p-2 md:p-3 rounded-lg">
              <p className="text-gray-500 text-xs mb-0.5">Quantity</p>
              <p className="text-sm md:text-base font-semibold">{lastOrder.quantity || '-'}</p>
            </div>
            <div className="bg-black/30 p-2 md:p-3 rounded-lg">
              <p className="text-gray-500 text-xs mb-0.5">Buy Price</p>
              <p className="text-sm md:text-base font-semibold text-green-400">₹{lastOrder.buy_price?.toFixed(2)}</p>
            </div>
          </div>

          {/* Live Price Section */}
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 rounded-xl p-4 md:p-5 border border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                📈 Live Market Data
                {isLiveUpdating && (
                  <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                    Auto-updating every 1s
                  </span>
                )}
              </h3>
              <span className="text-xs text-gray-500">
                Last: {formatTime(lastUpdated)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Current Price */}
              <div className="bg-black/40 p-3 rounded-lg">
                <p className="text-gray-500 text-xs mb-1">Current Price</p>
                <p className={`text-lg md:text-xl font-bold ${
                  isLiveUpdating ? 'animate-pulse' : ''
                } ${
                  isProfit ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-white'
                }`}>
                  {currentPrice !== null ? `₹${currentPrice.toFixed(2)}` : '--'}
                </p>
              </div>

              {/* P&L Points */}
              <div className="bg-black/40 p-3 rounded-lg">
                <p className="text-gray-500 text-xs mb-1">P&L (Points)</p>
                <p className={`text-lg md:text-xl font-bold ${
                  isProfit ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-white'
                }`}>
                  {gainLossPoints !== null ? (
                    <>
                      {isProfit ? '+' : ''}{gainLossPoints.toFixed(2)}
                      <span className="text-xs ml-1">pts</span>
                    </>
                  ) : '--'}
                </p>
              </div>

              {/* P&L Percentage */}
              <div className="bg-black/40 p-3 rounded-lg">
                <p className="text-gray-500 text-xs mb-1">P&L (%)</p>
                <p className={`text-lg md:text-xl font-bold ${
                  isProfit ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-white'
                }`}>
                  {gainLossPercentage !== null ? (
                    <>
                      {isProfit ? '+' : ''}{gainLossPercentage.toFixed(2)}%
                    </>
                  ) : '--'}
                </p>
              </div>

              {/* P&L Value */}
              <div className={`p-3 rounded-lg ${
                isProfit 
                  ? 'bg-green-500/10 border border-green-500/30' 
                  : isLoss 
                    ? 'bg-red-500/10 border border-red-500/30' 
                    : 'bg-black/40'
              }`}>
                <p className="text-gray-500 text-xs mb-1">Total P&L</p>
                <p className={`text-lg md:text-xl font-bold ${
                  isProfit ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-white'
                }`}>
                  {gainLossValue !== null ? (
                    <>
                      {isProfit ? '+' : ''}₹{gainLossValue.toFixed(2)}
                    </>
                  ) : '--'}
                </p>
              </div>
            </div>

            {/* Visual P&L Bar */}
            {gainLossPercentage !== null && (
              <div className="mt-4">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      isProfit ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-orange-400'
                    }`}
                    style={{ 
                      width: `${Math.min(Math.abs(gainLossPercentage), 100)}%`,
                      marginLeft: isLoss ? 'auto' : 0,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>-100%</span>
                  <span>0%</span>
                  <span>+100%</span>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-6 md:py-10 text-gray-500">
          <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm md:text-base">No open position found</p>
          <p className="text-xs md:text-sm mt-1">Buy an option or intraday stock to see live data</p>
        </div>
      )}
    </div>
  );
}
