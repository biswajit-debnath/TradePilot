'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '@/services/api';
import { ConnectionStatus, OrderDetails, PendingSLOrder } from '@/types';
import { useTradingData } from '@/hooks/useTradingData';
import { useAlgorithms } from '@/hooks/useAlgorithms';
import { DhanWebSocketService, TickerData, FeedMode } from '@/lib/dhan-websocket';
import Alert from '@/components/Alert';
import Navbar from '@/components/Navbar';
import DrawerMenu from '@/components/DrawerMenu';
import HowItWorksModal from '@/components/HowItWorksModal';
import LivePositionCard from '@/components/LivePositionCard';
import PendingOrdersCard from '@/components/PendingOrdersCard';
import AlgoPanel from '@/components/AlgoPanel';
import AlgoStatusCard from '@/components/AlgoStatusCard';

export default function TradeAlgo() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Live data state
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [gainLossPoints, setGainLossPoints] = useState<number | null>(null);
  const [gainLossPercentage, setGainLossPercentage] = useState<number | null>(null);
  const [gainLossValue, setGainLossValue] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLiveUpdating, setIsLiveUpdating] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsReconnectAttempt, setWsReconnectAttempt] = useState(0);
  const [feedMode, setFeedMode] = useState<FeedMode>('QUOTE');

  const wsService = useRef<DhanWebSocketService | null>(null);

  // Use custom hooks for trading data
  const {
    lastOrder,
    pendingOrders,
    isLoading,
    isRefreshing,
    setIsLoading,
    setIsRefreshing,
    fetchLastOrder,
    fetchPendingOrders,
  } = useTradingData();

  // Use algorithms hook
  const {
    algorithms,
    runningAlgoId,
    activeAlgorithm,
    startAlgorithm,
    stopAlgorithm,
    evaluatePrice,
    resetAlgorithms,
  } = useAlgorithms(lastOrder);

  const showAlert = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  }, []);

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
  }, [showAlert]);

  // Handle ticker updates from WebSocket
  const handleTickerUpdate = useCallback((data: TickerData) => {
    if (!lastOrder || data.securityId !== lastOrder.security_id) {
      return;
    }

    const ltp = data.ltp;
    setCurrentPrice(ltp);

    // Calculate gains/losses
    const buyPrice = lastOrder.buy_price;
    const points = ltp - buyPrice;
    const percentage = ((ltp - buyPrice) / buyPrice) * 100;
    const value = points * lastOrder.quantity;

    setGainLossPoints(points);
    setGainLossPercentage(percentage);
    setGainLossValue(value);
    setLastUpdated(new Date());

    // Evaluate algorithms with current price
    evaluatePrice(ltp);
  }, [lastOrder, evaluatePrice]);

  // Initialize WebSocket
  const initializeWebSocket = useCallback(async () => {
    if (!lastOrder) {
      console.log('⚠️ No position available, skipping WebSocket connection');
      showAlert('⚠️ No position to track. Please open a position first.', 'info');
      return;
    }

    if (wsService.current) {
      console.log('🔄 Disconnecting existing WebSocket before reconnecting...');
      wsService.current.disconnect();
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    console.log('🚀 Initializing new WebSocket connection...');
    wsService.current = new DhanWebSocketService({
      feedMode: feedMode,
      onConnect: () => {
        console.log('✅ WebSocket connected');
        setWsConnected(true);
        setWsReconnectAttempt(0);
        showAlert(`📡 WebSocket connected (${feedMode} mode) - Real-time updates enabled`, 'success');

        if (lastOrder) {
          setTimeout(() => {
            console.log('🔔 Subscribing to position:', lastOrder.symbol, lastOrder.exchange_segment, lastOrder.security_id);
            
            if (wsService.current && wsService.current.isConnected()) {
              wsService.current.subscribe([{
                exchangeSegment: lastOrder.exchange_segment,
                securityId: lastOrder.security_id,
              }], feedMode);
            } else {
              console.error('⚠️ WebSocket not connected when trying to subscribe');
            }
          }, 1000);
        }
      },
      onDisconnect: (reason) => {
        console.log('🔌 WebSocket disconnected:', reason);
        setWsConnected(false);
        showAlert('⚠️ WebSocket disconnected', 'info');
      },
      onError: (error) => {
        console.error('❌ WebSocket error:', error);
        showAlert('WebSocket error: ' + error.message, 'error');
      },
      onTickerUpdate: handleTickerUpdate,
      onReconnect: (attempt) => {
        setWsReconnectAttempt(attempt);
        showAlert(`🔄 Reconnecting WebSocket... (Attempt ${attempt})`, 'info');
      },
    });

    try {
      await wsService.current.connect();
    } catch (error) {
      showAlert('Failed to connect WebSocket: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    }
  }, [lastOrder, handleTickerUpdate, showAlert, feedMode]);

  // Start/Stop live updates
  const toggleLiveUpdate = useCallback(async () => {
    if (!isLiveUpdating) {
      if (!lastOrder) {
        showAlert('⚠️ No open position to track. Open a position first!', 'info');
        return;
      }
      
      await initializeWebSocket();
      setIsLiveUpdating(true);
    } else {
      console.log('🛑 Stopping WebSocket...');
      if (wsService.current) {
        wsService.current.disconnect();
        wsService.current = null;
      }
      setWsConnected(false);
      setIsLiveUpdating(false);
      setWsReconnectAttempt(0);
      showAlert('📡 Live updates stopped', 'info');
      
      // Also stop any running algorithm
      if (runningAlgoId) {
        stopAlgorithm(runningAlgoId);
      }
    }
  }, [isLiveUpdating, initializeWebSocket, showAlert, lastOrder, runningAlgoId, stopAlgorithm]);

  // Subscribe to position when it changes
  const previousLastOrderRef = useRef<typeof lastOrder>(null);
  
  useEffect(() => {
    if (
      isLiveUpdating && 
      wsService.current && 
      wsService.current.isConnected() && 
      lastOrder &&
      previousLastOrderRef.current !== null &&
      previousLastOrderRef.current?.security_id !== lastOrder.security_id
    ) {
      console.log('📊 Position changed, re-subscribing to new position:', lastOrder.symbol);
      
      setTimeout(() => {
        wsService.current?.subscribe([{
          exchangeSegment: lastOrder.exchange_segment,
          securityId: lastOrder.security_id,
        }], feedMode);
      }, 500);
    }
    
    previousLastOrderRef.current = lastOrder;
  }, [lastOrder, isLiveUpdating, feedMode]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsService.current) {
        wsService.current.disconnect();
      }
    };
  }, []);

  // Main refresh function
  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        checkConnection(),
        fetchLastOrder(),
        fetchPendingOrders()
      ]);
      showAlert('✅ Data refreshed successfully', 'success');
    } catch (error) {
      showAlert('Error refreshing data: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [checkConnection, fetchLastOrder, fetchPendingOrders, showAlert, setIsRefreshing]);

  const exitAll = async () => {
    const confirmed = confirm(
      '⚠️ WARNING: This will EXIT ALL open positions and CANCEL ALL pending orders!\n\nAre you absolutely sure?'
    );
    
    if (!confirmed) return;

    // Stop any running algorithm first
    if (runningAlgoId) {
      stopAlgorithm(runningAlgoId);
    }

    setIsLoading(true);
    try {
      const response = await apiService.exitAll();
      if (response.success) {
        const message = response.errors && response.errors.length > 0
          ? `⚠️ Partially completed: ${response.message}\n\nErrors: ${response.errors.join(', ')}`
          : `✅ ${response.message}`;
        
        showAlert(message, response.errors && response.errors.length > 0 ? 'info' : 'success');
        await refreshAll();
      } else {
        showAlert('❌ Failed to exit all: ' + response.error, 'error');
      }
    } catch (error) {
      showAlert('Error: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshPosition = async () => {
    setIsRefreshing(true);
    await fetchLastOrder();
    setIsRefreshing(false);
  };

  // Handle algorithm start
  const handleStartAlgo = (algoId: string) => {
    if (!lastOrder) {
      showAlert('⚠️ No position to run algorithm on. Open a position first!', 'info');
      return;
    }

    if (!isLiveUpdating) {
      showAlert('⚠️ Please enable live updates first to run algorithms.', 'info');
      return;
    }

    startAlgorithm(algoId);
    showAlert(`🤖 Algorithm started: ${algorithms.find(a => a.id === algoId)?.name}`, 'success');
  };

  // Handle algorithm stop
  const handleStopAlgo = (algoId: string) => {
    stopAlgorithm(algoId);
    showAlert('🛑 Algorithm stopped', 'info');
  };

  // Filter pending orders for current position only
  const positionPendingOrders: PendingSLOrder[] = lastOrder
    ? pendingOrders.filter((order: PendingSLOrder) => order.security_id === lastOrder.security_id)
    : [];

  // Reset live data when position changes
  useEffect(() => {
    if (!lastOrder) {
      setCurrentPrice(null);
      setGainLossPoints(null);
      setGainLossPercentage(null);
      setGainLossValue(null);
      setLastUpdated(null);
      
      if (isLiveUpdating && wsService.current) {
        console.log('🛑 Position closed, stopping WebSocket...');
        wsService.current.disconnect();
        wsService.current = null;
        setWsConnected(false);
        setIsLiveUpdating(false);
        setWsReconnectAttempt(0);
        showAlert('📡 Position closed - Live updates stopped', 'info');
      }

      // Reset algorithms
      resetAlgorithms();
    }
  }, [lastOrder, isLiveUpdating, showAlert, resetAlgorithms]);

  useEffect(() => {
    const initialLoad = async () => {
      setIsRefreshing(true);
      try {
        await Promise.all([
          checkConnection(),
          fetchLastOrder(),
          fetchPendingOrders()
        ]);
      } finally {
        setIsRefreshing(false);
      }
    };
    initialLoad();
  }, [checkConnection, fetchLastOrder, fetchPendingOrders, setIsRefreshing]);

  return (
    <div className="min-h-screen">
      {alert && <Alert message={alert.message} type={alert.type} />}
      <DrawerMenu
        isOpen={isDrawerOpen}
        connectionStatus={connectionStatus}
        onClose={() => setIsDrawerOpen(false)}
        onHowItWorksClick={() => setShowHowItWorks(true)}
      />
      <HowItWorksModal
        isOpen={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
      />
      <Navbar
        connectionStatus={connectionStatus}
        isRefreshing={isRefreshing}
        hasPositionsOrOrders={lastOrder !== null || pendingOrders.length > 0}
        onMenuClick={() => setIsDrawerOpen(true)}
        onRefresh={refreshAll}
        onExitAll={exitAll}
        isLoading={isLoading}
      />
      <div className="max-w-4xl mx-auto p-4 sm:p-5 md:p-6">
        {/* Page Title */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">🤖</span>
                Algorithm Trading
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Automated trading with custom algorithms
              </p>
            </div>
            
            {/* WebSocket Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-2 bg-black/30 rounded-lg border border-gray-700">
              <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-xs text-gray-400">
                {wsConnected ? 'Connected' : wsReconnectAttempt > 0 ? `Reconnecting (${wsReconnectAttempt})` : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Feed Mode Selector */}
          <div className="mt-4 p-4 bg-linear-to-r from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-semibold text-purple-300 mb-1">Update Speed</h3>
                <p className="text-xs text-gray-400">Choose how fast you want price updates</p>
              </div>
              <div className="flex gap-2 sm:ml-auto">
                <button
                  onClick={() => setFeedMode('TICKER')}
                  disabled={isLiveUpdating}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    feedMode === 'TICKER'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  } ${isLiveUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  TICKER<br/><span className="text-[10px]">1 sec</span>
                </button>
                <button
                  onClick={() => setFeedMode('QUOTE')}
                  disabled={isLiveUpdating}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    feedMode === 'QUOTE'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  } ${isLiveUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  QUOTE<br/><span className="text-[10px]">~200ms</span>
                </button>
                <button
                  onClick={() => setFeedMode('FULL')}
                  disabled={isLiveUpdating}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    feedMode === 'FULL'
                      ? 'bg-green-600 text-white shadow-lg shadow-green-500/50'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  } ${isLiveUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  FULL<br/><span className="text-[10px]">~100ms</span>
                </button>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {feedMode === 'TICKER' && '📊 Updates every 1 second - Most stable, lowest bandwidth'}
              {feedMode === 'QUOTE' && '🚀 Fast updates (~5 per second) - Recommended for algorithms'}
              {feedMode === 'FULL' && '⚡ Fastest updates (~10 per second) with market depth - Highest bandwidth'}
            </div>
          </div>

          {/* Algorithm Warning Banner */}
          {runningAlgoId && (
            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-yellow-400">Algorithm Running</p>
                  <p className="text-xs text-yellow-300/70">
                    {activeAlgorithm?.name} is actively monitoring prices and executing trades.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Position Card */}
        <LivePositionCard
          lastOrder={lastOrder}
          currentPrice={currentPrice}
          gainLossPoints={gainLossPoints}
          gainLossPercentage={gainLossPercentage}
          gainLossValue={gainLossValue}
          lastUpdated={lastUpdated}
          isRefreshing={isRefreshing}
          isLiveUpdating={isLiveUpdating}
          onRefreshPosition={handleRefreshPosition}
          onToggleLiveUpdate={toggleLiveUpdate}
        />

        {/* Algorithm Status Card (shown when algo is running) */}
        <AlgoStatusCard
          algorithm={activeAlgorithm}
          currentPrice={currentPrice}
          buyPrice={lastOrder?.buy_price || null}
        />

        {/* Algorithm Panel */}
        <AlgoPanel
          algorithms={algorithms}
          runningAlgoId={runningAlgoId}
          onStartAlgo={handleStartAlgo}
          onStopAlgo={handleStopAlgo}
          disabled={!lastOrder || !isLiveUpdating}
        />

        {/* Pending Orders */}
        <PendingOrdersCard
          orders={positionPendingOrders}
          lastOrder={lastOrder}
          onCancelOrder={() => {}}
        />
      </div>
    </div>
  );
}
