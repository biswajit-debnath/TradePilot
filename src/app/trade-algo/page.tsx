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
import AlgoTerminal from '@/components/AlgoTerminal';

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
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

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
    manualTriggerRule,
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
      // Fetch all data
      const [, position] = await Promise.all([
        checkConnection(),
        fetchLastOrder(),
        fetchPendingOrders()
      ]);
      
      showAlert('✅ Data refreshed successfully', 'success');
      
      // Auto-start live updates if position exists and not already live updating
      if (position && !isLiveUpdating) {
        console.log('📊 Position detected after refresh, setting auto-start flag...');
        shouldAutoStartRef.current = true;
      }
    } catch (error) {
      showAlert('Error refreshing data: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [checkConnection, fetchLastOrder, fetchPendingOrders, showAlert, setIsRefreshing, isLiveUpdating, initializeWebSocket]);

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

  const handleRefreshPosition = useCallback(async () => {
    setIsRefreshing(true);
    const position = await fetchLastOrder();
    setIsRefreshing(false);
    
    // Auto-start live updates if position exists and not already live updating
    if (position && !isLiveUpdating) {
      console.log('📊 Position detected after refresh, setting auto-start flag...');
      shouldAutoStartRef.current = true;
    }
  }, [fetchLastOrder, isLiveUpdating, setIsRefreshing]);

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

  // Track if initial load has been done
  const hasInitialLoadedRef = useRef(false);
  const shouldAutoStartRef = useRef(false);

  useEffect(() => {
    // Initial load - only run once
    if (hasInitialLoadedRef.current) return;
    
    const initialLoad = async () => {
      setIsRefreshing(true);
      try {
        const [, position] = await Promise.all([
          checkConnection(),
          fetchLastOrder(),
          fetchPendingOrders()
        ]);

        hasInitialLoadedRef.current = true;

        // Set flag to auto-start if position exists
        if (position) {
          console.log('📊 Position detected on page load, will auto-start live updates...');
          shouldAutoStartRef.current = true;
        }
      } finally {
        setIsRefreshing(false);
      }
    };
    initialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Auto-start WebSocket when lastOrder is available and shouldAutoStart is true
  useEffect(() => {
    if (shouldAutoStartRef.current && lastOrder && !isLiveUpdating && hasInitialLoadedRef.current) {
      console.log('🚀 Auto-starting WebSocket now that position is loaded...');
      shouldAutoStartRef.current = false; // Reset flag
      
      const startWebSocket = async () => {
        await initializeWebSocket();
        setIsLiveUpdating(true);
      };
      
      startWebSocket();
    }
  }, [lastOrder, isLiveUpdating, initializeWebSocket]);

  // Auto-refresh every 1 second when no position exists
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Clear any existing interval
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }

    // Auto-refresh with different intervals based on position availability
    if (autoRefreshEnabled) {
      const interval = lastOrder 
        ? Number(process.env.NEXT_PUBLIC_AUTO_REFRESH_ON_POSITION_INTERVAL) || 5000 // 5 seconds when position exists
        : Number(process.env.NEXT_PUBLIC_AUTO_REFRESH_INTERVAL) || 1000; // 1 second when no position
      
      console.log(`📡 Starting auto-refresh (${interval}ms interval) - ${lastOrder ? 'Position detected' : 'No position'}`);
      
      autoRefreshIntervalRef.current = setInterval(async () => {
        // Silently refresh without showing success alert
        try {
          const [position] = await Promise.all([
            fetchLastOrder(),
            fetchPendingOrders()
          ]);
          
          // Auto-start live updates if position is found
          if (position && !isLiveUpdating) {
            console.log('📊 Position detected during auto-refresh, setting auto-start flag...');
            shouldAutoStartRef.current = true;
          }
        } catch (error) {
          console.error('Auto-refresh error:', error);
        }
      }, interval);
    } else {
      console.log('⏸️ Auto-refresh disabled by user');
    }

    // Cleanup on unmount or when lastOrder changes
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }, [lastOrder, fetchLastOrder, fetchPendingOrders, autoRefreshEnabled, isLiveUpdating]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled(prev => {
      const newValue = !prev;
      showAlert(newValue ? '✅ Auto-refresh enabled' : '⏸️ Auto-refresh disabled', 'info');
      return newValue;
    });
  }, [showAlert]);

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
        autoRefresh={autoRefreshEnabled}
        onToggleAutoRefresh={toggleAutoRefresh}
        isLoading={isLoading}
      />
      <div className="max-w-4xl mx-auto p-4 sm:p-5 md:p-6">
        {/* Page Title */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-1.5">
                <span className="text-xl">🤖</span>
                Algorithm Trading
              </h1>
            </div>
            
            {/* Right side: Live Toggle, Connected Status */}
            <div className="flex items-center gap-1.5">
              {/* Live Update Toggle */}
              <div className="flex items-center gap-1.5">
                {isLiveUpdating && (
                  <span className="flex items-center gap-1 text-[10px] text-green-400">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Live
                  </span>
                )}
                <button
                  onClick={toggleLiveUpdate}
                  className={`relative w-10 h-5 rounded-full transition-all ${
                    isLiveUpdating 
                      ? 'bg-green-500/30 border border-green-500/50' 
                      : 'bg-gray-700 border border-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                      isLiveUpdating 
                        ? 'left-5 bg-green-400 shadow-lg shadow-green-500/50' 
                        : 'left-0.5 bg-gray-400'
                    }`}
                  />
                </button>
              </div>
              
              {/* WebSocket Status Indicator */}
              <div className="flex items-center gap-1.5 px-2 py-1 bg-black/30 rounded-md border border-gray-700">
                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                <span className="text-[10px] text-gray-400">
                  {wsConnected ? 'Connected' : wsReconnectAttempt > 0 ? `Reconnecting (${wsReconnectAttempt})` : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
          <p className="text-gray-400 text-xs mt-1">
            Automated trading with custom algorithms
          </p>

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
          onExitAll={exitAll}
          isLoading={isLoading}
        />

        {/* Algorithm Terminal (shown when algo is running) */}
        <AlgoTerminal
          algorithm={activeAlgorithm}
          currentPrice={currentPrice}
          buyPrice={lastOrder?.buy_price || null}
          onManualTrigger={manualTriggerRule}
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
