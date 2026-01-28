import { OrderDetails } from '@/types';

interface PositionCardProps {
  lastOrder: OrderDetails | null;
  allPositions: OrderDetails[];
  isRefreshing: boolean;
  isLoading: boolean;
  tpOffset: number;
  ppOffset: number;
  lotSize: number;
  hasExistingLimitOrder: boolean;
  onRefreshPosition: () => void;
  onPlaceProtectiveSL: () => void;
  onPlaceStopLossMarket: () => void;
  onPlaceTakeProfit: () => void;
  onIncrementTpOffset: () => void;
  onDecrementTpOffset: () => void;
  onIncrementTpOffset5?: () => void;
  onDecrementTpOffset5?: () => void;
  onIncrementPpOffset: () => void;
  onDecrementPpOffset: () => void;
  onIncrementLotSize: () => void;
  onDecrementLotSize: () => void;
  onSelectPosition: (securityId: string) => void;
}

export default function PositionCard({
  lastOrder,
  allPositions,
  isRefreshing,
  isLoading,
  tpOffset,
  ppOffset,
  lotSize,
  hasExistingLimitOrder,
  onRefreshPosition,
  onPlaceProtectiveSL,
  onPlaceStopLossMarket,
  onPlaceTakeProfit,
  onIncrementTpOffset,
  onDecrementTpOffset,
  onIncrementTpOffset5,
  onDecrementTpOffset5,
  onIncrementPpOffset,
  onDecrementPpOffset,
  onIncrementLotSize,
  onDecrementLotSize,
  onSelectPosition,
}: PositionCardProps) {
  const slOffset = process.env.NEXT_PUBLIC_PP_OFFSET || '2';
  const slOffsetLoss = process.env.NEXT_PUBLIC_SL_OFFSET_LOSS || '20';

  return (
    <div className="glass-card rounded-xl p-4 md:p-6 mb-4 md:mb-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4 md:mb-5">
        <div className="flex items-center gap-2 md:gap-3 flex-1">
          <h2 className="text-lg md:text-xl font-semibold text-cyan-400">
            📊 Current Open Position {lastOrder && `(${lastOrder.order_category})`}
          </h2>
          
          {/* Position Dropdown */}
          {allPositions.length > 1 && (
            <select
              value={lastOrder?.security_id || ''}
              onChange={(e) => onSelectPosition(e.target.value)}
              className="bg-gray-800/80 text-white text-sm px-3 py-1.5 rounded-lg border border-cyan-500/30 hover:border-cyan-400/50 focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer"
            >
              {allPositions.map((position) => (
                <option key={position.security_id} value={position.security_id}>
                  {position.symbol} {position.order_category === 'OPTION' && position.option_type && `${position.option_type} ${position.strike_price}`}
                </option>
              ))}
            </select>
          )}
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
            
            {/* Lot Size Control - Only show for F&O positions */}
            {lastOrder.order_category === 'OPTION' && (
              <div className="bg-black/30 p-2 md:p-3 rounded-lg col-span-2 md:col-span-1">
                <p className="text-gray-500 text-xs mb-1">Lot Size</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={onDecrementLotSize}
                    disabled={isLoading || lotSize <= 1}
                    className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm font-bold transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center text-sm md:text-base font-bold text-cyan-400">
                    {lotSize} {lotSize === 1 ? 'Lot' : 'Lots'}
                  </span>
                  <button
                    onClick={onIncrementLotSize}
                    disabled={isLoading}
                    className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-sm font-bold transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
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
            {/* PP Button with Integrated Counter Controls */}
            <div className="flex items-center gap-0 bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
              {/* Decrement Button */}
              <button
                onClick={onDecrementPpOffset}
                disabled={isLoading || ppOffset <= 1}
                className="px-3 md:px-4 py-3 md:py-4 text-lg md:text-xl font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                −
              </button>
              
              {/* Main PP Button (Center) */}
              <button
                onClick={onPlaceProtectiveSL}
                disabled={isLoading}
                className="flex-1 py-3 md:py-4 px-4 md:px-6 font-semibold text-base md:text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed border-x border-slate-700"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-sm md:text-base">Placing...</span>
                  </span>
                ) : (
                  `🔻 PP +${ppOffset}`
                )}
              </button>
              
              {/* Increment Button */}
              <button
                onClick={onIncrementPpOffset}
                disabled={isLoading}
                className="px-3 md:px-4 py-3 md:py-4 text-lg md:text-xl font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>

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
                `🛡️ SL-Limit -${slOffsetLoss}`
              )}
            </button>

            {/* TP Button and Offset Control in Same Row */}
            <div className="flex items-center gap-2">
              {/* -5 Quick Decrement Button (Left Side) */}
              {onDecrementTpOffset5 && (
                <button
                  onClick={onDecrementTpOffset5}
                  disabled={isLoading || tpOffset <= 5}
                  className="px-3 md:px-4 py-3 md:py-4 rounded-xl font-semibold text-sm md:text-base bg-gradient-to-r from-red-500 to-orange-600 hover:shadow-lg hover:shadow-red-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  −5
                </button>
              )}

              {/* Combined Counter and TP Button */}
              <div className="flex-1 flex items-center gap-0 bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                {/* Decrement Button */}
                <button
                  onClick={onDecrementTpOffset}
                  disabled={isLoading || tpOffset <= 1}
                  className="px-3 md:px-4 py-3 md:py-4 text-lg md:text-xl font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  −
                </button>
                
                {/* Main TP Button (Center) */}
                <button
                  onClick={onPlaceTakeProfit}
                  disabled={isLoading}
                  className="flex-1 py-3 md:py-4 px-4 md:px-6 font-semibold text-base md:text-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-lg hover:shadow-cyan-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed border-x border-slate-700"
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
                
                {/* Increment Button */}
                <button
                  onClick={onIncrementTpOffset}
                  disabled={isLoading}
                  className="px-3 md:px-4 py-3 md:py-4 text-lg md:text-xl font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>

              {/* +5 Quick Increment Button (Right Side) */}
              {onIncrementTpOffset5 && (
                <button
                  onClick={onIncrementTpOffset5}
                  disabled={isLoading}
                  className="px-3 md:px-4 py-3 md:py-4 rounded-xl font-semibold text-sm md:text-base bg-gradient-to-r from-emerald-500 to-green-600 hover:shadow-lg hover:shadow-emerald-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  +5
                </button>
              )}
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
