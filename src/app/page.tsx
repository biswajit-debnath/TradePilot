'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';
import { OrderDetails, PendingSLOrder, ConnectionStatus } from '@/types';

export default function Home() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [lastOrder, setLastOrder] = useState<OrderDetails | null>(null);
  const [pendingOrders, setPendingOrders] = useState<PendingSLOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const showAlert = (message: string, type: 'success' | 'error' | 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const checkConnection = useCallback(async () => {
    try {
      const status = await apiService.verifyConnection();
      setConnectionStatus(status);
      if (!status.success) {
        showAlert('Failed to connect: ' + status.error, 'error');
      }
    } catch (error) {
      setConnectionStatus({ success: false, error: 'Connection error' });
      showAlert('Connection error: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    }
  }, []);

  const fetchLastOrder = useCallback(async () => {
    try {
      const response = await apiService.getLastOptionOrder();
      if (response.success && response.order) {
        setLastOrder(response.order);
      } else {
        setLastOrder(null);
      }
    } catch (error) {
      showAlert('Error fetching order: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    }
  }, []);

  const fetchPendingSLOrders = useCallback(async () => {
    try {
      const response = await apiService.getPendingSLOrders();
      if (response.success) {
        setPendingOrders(response.orders);
      }
    } catch (error) {
      showAlert('Error fetching SL orders: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    }
  }, []);

  const placeSLMarketOrder = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.placeSLMarketOrder();
      if (response.success) {
        showAlert(`✅ SL-Limit Order Placed! Order ID: ${response.order_id} | Trigger: ₹${response.trigger_price} | Limit: ₹${response.limit_price}`, 'success');
        fetchPendingSLOrders();
      } else {
        showAlert('❌ Failed: ' + response.error, 'error');
      }
    } catch (error) {
      showAlert('Error: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const placeSLLimitOrder = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.placeSLLimitOrder();
      if (response.success) {
        showAlert(`✅ SL-Limit Order Placed! Order ID: ${response.order_id} | Trigger: ₹${response.trigger_price} | Limit: ₹${response.limit_price}`, 'success');
        fetchPendingSLOrders();
      } else {
        showAlert('❌ Failed: ' + response.error, 'error');
      }
    } catch (error) {
      showAlert('Error: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const placeTakeProfitOrder = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.placeTakeProfitOrder(Number(process.env.NEXT_PUBLIC_TP_OFFSET));
      if (response.success) {
        showAlert(`✅ Take Profit Order Placed! Order ID: ${response.order_id} | Trigger: ₹${response.trigger_price}`, 'success');
        fetchPendingSLOrders();
      } else {
        showAlert('❌ Failed: ' + response.error, 'error');
      }
    } catch (error) {
      showAlert('Error: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSLOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this SL order?')) return;
    
    try {
      const response = await apiService.cancelSLOrder(orderId);
      if (response.success) {
        showAlert('✅ SL Order cancelled', 'success');
        fetchPendingSLOrders();
      } else {
        showAlert('❌ Failed to cancel: ' + response.error, 'error');
      }
    } catch (error) {
      showAlert('Error: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    }
  };

  const exitAll = async () => {
    const confirmed = confirm(
      '⚠️ WARNING: This will EXIT ALL open positions and CANCEL ALL pending orders!\n\nAre you absolutely sure?'
    );
    
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const response = await apiService.exitAll();
      if (response.success) {
        const message = response.errors && response.errors.length > 0
          ? `⚠️ Partially completed: ${response.message}\n\nErrors: ${response.errors.join(', ')}`
          : `✅ ${response.message}`;
        
        showAlert(message, response.errors && response.errors.length > 0 ? 'info' : 'success');
        fetchPendingSLOrders();
      } else {
        showAlert('❌ Failed to exit all: ' + response.error, 'error');
      }
    } catch (error) {
      showAlert('Error: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAll = useCallback(() => {
    checkConnection();
    fetchLastOrder();
    fetchPendingSLOrders();
  }, [checkConnection, fetchLastOrder, fetchPendingSLOrders]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return (
    <div className="min-h-screen p-5">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">✈️ TradePilot</h1>
          <p className="text-gray-400">Your Automated Co-Pilot for Intelligent Trading</p>
        </div>

        {/* Status Bar */}
        <div className="glass-card rounded-xl p-4 mb-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${connectionStatus?.success ? 'bg-green-400 glow-green' : 'bg-red-500'}`} />
            <span className="text-gray-300">
              {connectionStatus?.success 
                ? `Connected: ${connectionStatus.client_id}` 
                : connectionStatus?.error || 'Checking connection...'}
            </span>
          </div>
          <div className="flex gap-3">
            {(lastOrder || pendingOrders.length > 0) && (
              <button
                onClick={exitAll}
                disabled={isLoading}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-800 rounded-lg hover:shadow-lg hover:shadow-red-500/30 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ⛔ Exit All
              </button>
            )}
            <button
              onClick={refreshAll}
              className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-white/10 transition"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Alert */}
        {alert && (
          <div className={`p-4 rounded-xl mb-5 border ${
            alert.type === 'success' ? 'bg-green-500/20 border-green-500 text-green-400' :
            alert.type === 'error' ? 'bg-red-500/20 border-red-500 text-red-400' :
            'bg-cyan-500/20 border-cyan-500 text-cyan-400'
          }`}>
            {alert.message}
          </div>
        )}

        {/* How It Works */}
        <div className="glass-card rounded-xl p-6 mb-5">
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="w-full flex justify-between items-center text-left"
          >
            <h2 className="text-xl font-semibold text-cyan-400">📋 How It Works</h2>
            <span className="text-2xl text-cyan-400 transition-transform duration-300" style={{
              transform: showHowItWorks ? 'rotate(180deg)' : 'rotate(0deg)'
            }}>
              ▼
            </span>
          </button>
          
          {showHowItWorks && (
            <div className="mt-6">
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-green-400 mb-3">� SL Limit -${process.env.NEXT_PUBLIC_SL_OFFSET}</h3>
                <div className="bg-black/20 rounded-lg p-5 space-y-4">
                  {[
                    'Place a BUY order in Dhan (Options or Intraday Stocks)',
                    'Price moves in your favor (e.g., ₹100 → ₹106)',
                    'Click "SL Limit" button below',
                    'App fetches your buy price (₹100) and places SL at ₹98 (buy - 2)',
                    'Limit price at ₹97.5 ensures you get close to trigger price',
                    'If price falls to ₹98, order triggers as limit order between ₹97.5-₹98',
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-gray-300">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-orange-400 mb-3">🔻 SL-Limit Order (Buy - ${process.env.NEXT_PUBLIC_SL_OFFSET_LOSS})</h3>
                <div className="bg-black/20 rounded-lg p-5 space-y-4">
                  {[
                    'Same as above, but for deeper protection',
                    'If you bought at ₹100, trigger is set at ₹80 (buy - 20)',
                    'Limit price is ₹79 to ensure execution when triggered',
                    'This protects from large downward moves',
                    'Use this for wider stop loss protection',
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-gray-300">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <h3 className="text-lg font-semibold text-cyan-400 mb-3">🎯 TP Limit +${process.env.NEXT_PUBLIC_TP_OFFSET}</h3>
                <div className="bg-black/20 rounded-lg p-5 space-y-4">
                  {[
                    'Automatically book profits when price reaches target',
                    'If you bought at ₹100, trigger is set at ₹112 (buy + 12)',
                    'Limit price at ₹111.5 ensures you get close to target price',
                    'When price touches ₹112, order triggers as limit order',
                    'Better price control than market orders for profit booking',
                    'Great for scalping and quick profit booking',
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-gray-300">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Current Open Position */}
        <div className="glass-card rounded-xl p-6 mb-5">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-semibold text-cyan-400">
              📊 Current Open Position {lastOrder && `(${lastOrder.order_category})`}
            </h2>
            <button
              onClick={fetchLastOrder}
              className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-white/10 transition text-sm"
            >
              Refresh Position
            </button>
          </div>

          {lastOrder ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-black/30 p-4 rounded-xl">
                  <p className="text-gray-500 text-sm mb-1">Symbol</p>
                  <p className="text-xl font-semibold">{lastOrder.symbol || '-'}</p>
                </div>
                <div className="bg-black/30 p-4 rounded-xl">
                  <p className="text-gray-500 text-sm mb-1">Category</p>
                  <p className="text-xl font-semibold">
                    {lastOrder.order_category === 'OPTION' ? (
                      <span className="text-purple-400">📊 Option</span>
                    ) : (
                      <span className="text-blue-400">📈 Stock (Intraday)</span>
                    )}
                  </p>
                </div>
                
                {lastOrder.order_category === 'OPTION' && (
                  <>
                    <div className="bg-black/30 p-4 rounded-xl">
                      <p className="text-gray-500 text-sm mb-1">Type</p>
                      <p className="text-xl font-semibold">{lastOrder.option_type || '-'}</p>
                    </div>
                    <div className="bg-black/30 p-4 rounded-xl">
                      <p className="text-gray-500 text-sm mb-1">Strike Price</p>
                      <p className="text-xl font-semibold">₹{lastOrder.strike_price || '-'}</p>
                    </div>
                  </>
                )}
                
                {lastOrder.order_category === 'STOCK' && (
                  <div className="bg-black/30 p-4 rounded-xl col-span-2">
                    <p className="text-gray-500 text-sm mb-1">Product Type</p>
                    <p className="text-xl font-semibold">{lastOrder.product_type}</p>
                  </div>
                )}
                
                <div className="bg-black/30 p-4 rounded-xl">
                  <p className="text-gray-500 text-sm mb-1">Quantity</p>
                  <p className="text-xl font-semibold">{lastOrder.quantity || '-'}</p>
                </div>
                <div className="bg-black/30 p-4 rounded-xl">
                  <p className="text-gray-500 text-sm mb-1">Buy Price</p>
                  <p className="text-xl font-semibold text-green-400">₹{lastOrder.buy_price?.toFixed(2)}</p>
                </div>
                <div className="bg-black/30 p-4 rounded-xl">
                  <p className="text-gray-500 text-sm mb-1">Unrealized P&L</p>
                  <p className={`text-xl font-semibold ${
                    (lastOrder.unrealized_profit || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {(lastOrder.unrealized_profit || 0) >= 0 ? '+' : ''}₹{lastOrder.unrealized_profit?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="bg-black/30 p-4 rounded-xl">
                  <p className="text-gray-500 text-sm mb-1">SL Trigger Price (Buy + {lastOrder.sl_offset})</p>
                  <p className="text-xl font-semibold text-red-400">₹{lastOrder.sl_trigger_price?.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={placeSLMarketOrder}
                  disabled={isLoading}
                  className="w-full py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Placing Order...
                    </span>
                  ) : (
                    `🔻 SL Limit -${process.env.NEXT_PUBLIC_SL_OFFSET}`
                  )}
                </button>

                <button
                  onClick={placeSLLimitOrder}
                  disabled={isLoading}
                  className="w-full py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-orange-500 to-red-600 hover:shadow-lg hover:shadow-orange-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Placing Order...
                    </span>
                  ) : (
                    `🔻 SL-Limit -${process.env.NEXT_PUBLIC_SL_OFFSET_LOSS}`
                  )}
                </button>

                <button
                  onClick={placeTakeProfitOrder}
                  disabled={isLoading}
                  className="w-full py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-lg hover:shadow-cyan-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Placing Order...
                    </span>
                  ) : (
                    `🎯 TP Limit +${process.env.NEXT_PUBLIC_TP_OFFSET}`
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No open position found</p>
              <p className="text-sm mt-1">Buy an option or intraday stock to see it here</p>
            </div>
          )}
        </div>

        {/* Pending Orders */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-semibold text-cyan-400">⏳ Pending Orders from TradePilot</h2>
            <button
              onClick={fetchPendingSLOrders}
              className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-white/10 transition text-sm"
            >
              Refresh
            </button>
          </div>

          {pendingOrders.length > 0 ? (
            <div className="space-y-3">
              {pendingOrders.map((order) => {
                // Determine order category based on order_type
                const getOrderCategory = () => {
                  if (order.order_type === 'STOP_LOSS_MARKET') return { label: 'SL-Market', color: 'text-green-400', bg: 'bg-green-500/20' };
                  if (order.order_type === 'STOP_LOSS') return { label: 'SL-Limit', color: 'text-orange-400', bg: 'bg-orange-500/20' };
                  if (order.order_type === 'MARKET') return { label: 'Market', color: 'text-blue-400', bg: 'bg-blue-500/20' };
                  if (order.order_type === 'LIMIT') return { label: 'Limit', color: 'text-purple-400', bg: 'bg-purple-500/20' };
                  return { label: order.order_type, color: 'text-gray-400', bg: 'bg-gray-500/20' };
                };
                
                const category = getOrderCategory();
                
                return (
                  <div key={order.order_id} className="bg-black/30 p-4 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-lg">{order.symbol || 'Unknown'}</p>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${category.bg} ${category.color}`}>
                            {category.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p className="text-gray-400">
                            <span className="text-gray-500">Type:</span> {order.transaction_type}
                          </p>
                          <p className="text-gray-400">
                            <span className="text-gray-500">Quantity:</span> {order.quantity}
                          </p>
                          <p className="text-gray-400">
                            <span className="text-gray-500">Trigger:</span> <span className="text-yellow-400 font-semibold">₹{order.trigger_price}</span>
                          </p>
                          <p className="text-gray-400">
                            <span className="text-gray-500">Status:</span> {order.status}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => cancelSLOrder(order.order_id)}
                        className="ml-4 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-700 hover:shadow-lg hover:shadow-red-500/30 transition text-sm font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No pending orders from TradePilot</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
