import { OrderDetails } from '@/types';

interface PositionCardProps {
  lastOrder: OrderDetails | null;
  isRefreshing: boolean;
  isLoading: boolean;
  tpOffset: number;
  hasExistingLimitOrder: boolean;
  onRefreshPosition: () => void;
  onPlaceProtectiveSL: () => void;
  onPlaceStopLossMarket: () => void;
  onPlaceTakeProfit: () => void;
  onIncrementTpOffset: () => void;
  onDecrementTpOffset: () => void;
}

export default function PositionCard({
  lastOrder,
  isRefreshing,
  isLoading,
  tpOffset,
  hasExistingLimitOrder,
  onRefreshPosition,
  onPlaceProtectiveSL,
  onPlaceStopLossMarket,
  onPlaceTakeProfit,
  onIncrementTpOffset,
  onDecrementTpOffset,
}: PositionCardProps) {
  const slOffset = process.env.NEXT_PUBLIC_SL_OFFSET || '2';
  const slOffsetLoss = process.env.NEXT_PUBLIC_SL_OFFSET_LOSS || '20';

  return (
    <div className="glass-card rounded-xl p-4 md:p-6 mb-4 md:mb-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4 md:mb-5">
        <div className="flex items-center gap-2 md:gap-3">
          <h2 className="text-lg md:text-xl font-semibold text-cyan-400">
            📊 Current Open Position {lastOrder && `(${lastOrder.order_category})`}
          </h2>
        </div>
        {hasExistingLimitOrder && (
          <span className="px-2 md:px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400">
            Has Pending Limit Order
          </span>
        )}
      </div>

      {lastOrder ? (
        <>
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
            <div className="bg-black/30 p-2 md:p-3 rounded-lg">
              <p className="text-gray-500 text-xs mb-0.5">SL Trigger (Buy + {lastOrder.sl_offset})</p>
              <p className="text-sm md:text-base font-semibold text-red-400">₹{lastOrder.sl_trigger_price?.toFixed(2)}</p>
            </div>
          </div>

          <div className="space-y-2 md:space-y-3">
            <button
              onClick={onPlaceProtectiveSL}
              disabled={isLoading}
              className="w-full py-3 md:py-4 rounded-xl font-semibold text-base md:text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-sm md:text-base">Placing...</span>
                </span>
              ) : (
                `🔻 SL Limit -${slOffset}`
              )}
            </button>

            <button
              onClick={onPlaceStopLossMarket}
              disabled={isLoading}
              className="w-full py-3 md:py-4 rounded-xl font-semibold text-base md:text-lg bg-gradient-to-r from-orange-500 to-red-600 hover:shadow-lg hover:shadow-orange-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-sm md:text-base">Placing...</span>
                </span>
              ) : (
                `🛡️ SL-Market -${slOffsetLoss}`
              )}
            </button>

            {/* TP Button and Offset Control in Same Row */}
            <div className="flex items-center gap-2">
              <button
                onClick={onPlaceTakeProfit}
                disabled={isLoading}
                className="flex-1 py-3 md:py-4 rounded-xl font-semibold text-base md:text-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-lg hover:shadow-cyan-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-sm md:text-base">Placing...</span>
                  </span>
                ) : (
                  `🎯 TP +${tpOffset}`
                )}
              </button>
              
              <div className="flex items-center gap-0 bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                <button
                  onClick={onDecrementTpOffset}
                  disabled={isLoading || tpOffset <= 1}
                  className="px-3 md:px-4 py-3 md:py-4 text-lg md:text-xl font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  −
                </button>
                <div className="px-3 md:px-4 py-3 md:py-4 text-center bg-slate-900 border-x border-slate-700">
                  <span className="text-sm md:text-base font-bold text-white">{tpOffset.toString().padStart(2, '0')}</span>
                </div>
                <button
                  onClick={onIncrementTpOffset}
                  disabled={isLoading}
                  className="px-3 md:px-4 py-3 md:py-4 text-lg md:text-xl font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-6 md:py-10 text-gray-500">
          <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm md:text-base">No open position found</p>
          <p className="text-xs md:text-sm mt-1">Buy an option or intraday stock to see it here</p>
        </div>
      )}
    </div>
  );
}
