'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '@/services/api';
import { ConnectionStatus, OrderDetails, PendingSLOrder } from '@/types';
import { useTradingData } from '@/hooks/useTradingData';
import { useOrderActions } from '@/hooks/useOrderActions';
import { usePaywallProtection } from '@/hooks/usePaywallProtection';
import { DhanWebSocketService, TickerData, FeedMode } from '@/lib/dhan-websocket';
import Alert from '@/components/Alert';
import Navbar from '@/components/Navbar';
import DrawerMenu from '@/components/DrawerMenu';
import HowItWorksModal from '@/components/HowItWorksModal';
import LivePositionCard from '@/components/LivePositionCard';
import PendingOrdersCard from '@/components/PendingOrdersCard';

export default function TradeLiveWS() {
  usePaywallProtection();
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
  const [feedMode, setFeedMode] = useState<FeedMode>('QUOTE'); // Default to QUOTE for faster updates
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [isSpeedSectionOpen, setIsSpeedSectionOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [tpOffset, setTpOffset] = useState(Number(process.env.NEXT_PUBLIC_TP_OFFSET || 12));
  const [ppOffset, setPpOffset] = useState(Number(process.env.NEXT_PUBLIC_PP_OFFSET || 2));


  const wsService = useRef<DhanWebSocketService | null>(null);

  const showAlert = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  }, []);

  // Use custom hooks for trading data
  const {
    lastOrder,
    pendingOrders,
    isLoading,
    isRefreshing,
    setIsLoading,
    setIsRefreshing,
    setPendingOrders,
    fetchAllPositions,
    fetchPendingOrders,
    getPositionData,
    findAnyExistingLimitOrder,
    findAllExistingOrders,
  } = useTradingData();

  // Use order actions hook
  const {
    placeProtectiveLimitOrder,
    placeMainStopLossOrder,
    placeTakeProfitOrder,
  } = useOrderActions({
    getPositionData,
    findAnyExistingLimitOrder,
    findAllExistingOrders,
    setPendingOrders,
    fetchPendingOrders,
    setIsLoading,
    showAlert,
    lastOrder,
    ppOffset,
  });

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
  }, [lastOrder]);

  // Initialize WebSocket
  const initializeWebSocket = useCallback(async () => {
    // Don't connect if no position
    if (!lastOrder) {
      console.log('⚠️ No position available, skipping WebSocket connection');
      showAlert('⚠️ No position to track. Please open a position first.', 'info');
      return;
    }

    if (wsService.current) {
      console.log('🔄 Disconnecting existing WebSocket before reconnecting...');
      wsService.current.disconnect();
      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    console.log('🚀 Initializing new WebSocket connection...');
    wsService.current = new DhanWebSocketService({
      feedMode: feedMode, // Use selected feed mode
      onConnect: () => {
        console.log('✅ WebSocket connected');
        setWsConnected(true);
        setWsReconnectAttempt(0);
        showAlert(`📡 WebSocket connected (${feedMode} mode) - Real-time updates enabled`, 'success');

        // Subscribe to current position (with delay to ensure server is fully ready)
        if (lastOrder) {
          setTimeout(() => {
            console.log('🔔 Subscribing to position:', lastOrder.symbol, lastOrder.exchange_segment, lastOrder.security_id);
            
            // Double-check connection is still open before subscribing
            if (wsService.current && wsService.current.isConnected()) {
              wsService.current.subscribe([{
                exchangeSegment: lastOrder.exchange_segment,
                securityId: lastOrder.security_id,
              }], feedMode); // Pass feed mode to subscribe
            } else {
              console.error('⚠️ WebSocket not connected when trying to subscribe');
            }
          }, 1000);  // Increased to 1 second for more stability
        } else {
          console.log('⚠️ No position found after connection, cannot subscribe');
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
  }, [lastOrder, handleTickerUpdate, showAlert]);

  // Start/Stop live updates
  const toggleLiveUpdate = useCallback(async () => {
    if (!isLiveUpdating) {
      // Check if there's a position to track
      if (!lastOrder) {
        showAlert('⚠️ No open position to track. Open a position first!', 'info');
        return;
      }
      
      // Start WebSocket
      await initializeWebSocket();
      setIsLiveUpdating(true);
    } else {
      // Stop WebSocket
      console.log('🛑 Stopping WebSocket...');
      if (wsService.current) {
        wsService.current.disconnect();
        wsService.current = null;
      }
      setWsConnected(false);
      setIsLiveUpdating(false);
      setWsReconnectAttempt(0);
      showAlert('📡 Live updates stopped', 'info');
    }
  }, [isLiveUpdating, initializeWebSocket, showAlert, lastOrder]);

  // Subscribe to position when it changes (only if already connected and live updating)
  const previousLastOrderRef = useRef<typeof lastOrder>(null);
  
  useEffect(() => {
    // Only subscribe if:
    // 1. We're live updating
    // 2. WebSocket is connected
    // 3. We have a new position
    // 4. The position actually CHANGED (not initial load)
    if (
      isLiveUpdating && 
      wsService.current && 
      wsService.current.isConnected() && 
      lastOrder &&
      previousLastOrderRef.current !== null &&  // Not the first load
      previousLastOrderRef.current?.security_id !== lastOrder.security_id  // Position changed
    ) {
      console.log('� Position changed, re-subscribing to new position:', lastOrder.symbol, lastOrder.exchange_segment, lastOrder.security_id);
      
      // Small delay to ensure everything is stable
      setTimeout(() => {
        wsService.current?.subscribe([{
          exchangeSegment: lastOrder.exchange_segment,
          securityId: lastOrder.security_id,
        }]);
      }, 500);
    }
    
    // Update previous position reference
    previousLastOrderRef.current = lastOrder;
  }, [lastOrder, isLiveUpdating]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsService.current) {
        wsService.current.disconnect();
      }
    };
  }, []);

  // Main refresh function - fetches all data
  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Fetch all data
      const [, position] = await Promise.all([
        checkConnection(),
        fetchAllPositions(),
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
  }, [checkConnection, fetchAllPositions, fetchPendingOrders, showAlert, setIsRefreshing, isLiveUpdating, initializeWebSocket]);

  const exitAll = async () => {
    if (!lastOrder) {
      showAlert('⚠️ No position to exit', 'info');
      return;
    }

    const confirmed = confirm(
      `⚠️ WARNING: This will EXIT the current position (${lastOrder.symbol}) and CANCEL ALL its pending orders!\n\nAre you absolutely sure?`
    );
    
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const response = await apiService.exitPosition(lastOrder.security_id);
      if (response.success) {
        const message = response.errors && response.errors.length > 0
          ? `⚠️ Partially completed: ${response.message}\n\nErrors: ${response.errors.join(', ')}`
          : `✅ ${response.message}`;
        
        showAlert(message, response.errors && response.errors.length > 0 ? 'info' : 'success');
        await refreshAll();
      } else {
        showAlert('❌ Failed to exit position: ' + response.error, 'error');
      }
    } catch (error) {
      showAlert('Error: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshPosition = useCallback(async () => {
    setIsRefreshing(true);
    const position = await fetchAllPositions();
    setIsRefreshing(false);
    
    // Auto-start live updates if position exists and not already live updating
    if (position && !isLiveUpdating) {
      console.log('📊 Position detected after refresh, setting auto-start flag...');
      shouldAutoStartRef.current = true;
    }
  }, [fetchAllPositions, isLiveUpdating, initializeWebSocket, setIsRefreshing]);

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
      
      // Stop WebSocket if no position and currently updating
      if (isLiveUpdating && wsService.current) {
        console.log('🛑 Position closed, stopping WebSocket...');
        wsService.current.disconnect();
        wsService.current = null;
        setWsConnected(false);
        setIsLiveUpdating(false);
        setWsReconnectAttempt(0);
        showAlert('📡 Position closed - Live updates stopped', 'info');
      }
    }
  }, [lastOrder, isLiveUpdating, showAlert]);

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
          fetchAllPositions(),
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
            fetchAllPositions(),
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
  }, [lastOrder, fetchAllPositions, fetchPendingOrders, autoRefreshEnabled, isLiveUpdating]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled(prev => {
      const newValue = !prev;
      showAlert(newValue ? '✅ Auto-refresh enabled' : '⏸️ Auto-refresh disabled', 'info');
      return newValue;
    });
  }, [showAlert]);

  const incrementTpOffset = () => setTpOffset(prev => prev + 1);
  const decrementTpOffset = () => setTpOffset(prev => Math.max(1, prev - 1));
  const incrementTpOffset5 = () => setTpOffset(prev => prev + 5);
  const decrementTpOffset5 = () => setTpOffset(prev => Math.max(1, prev - 5));
  const incrementPpOffset = () => setPpOffset(prev => prev + 1);
  const decrementPpOffset = () => setPpOffset(prev => Math.max(1, prev - 1));

  const slOffsetLoss = process.env.NEXT_PUBLIC_SL_OFFSET_LOSS || '20';

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
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-1.5">
                <span className="text-xl">⚡</span>
                Trade Live (WebSocket)
              </h1>
              {/* Info Icon with Tooltip */}
              <div className="relative">
                <button
                  onMouseEnter={() => setShowInfo(true)}
                  onMouseLeave={() => setShowInfo(false)}
                  className="text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </button>
                {showInfo && (
                  <div className="absolute left-0 top-5 z-50 w-64 px-3 py-2 text-xs text-gray-300 bg-gray-900 border border-gray-700 rounded-lg shadow-lg">
                    Real-time tick-by-tick updates via WebSocket
                  </div>
                )}
              </div>
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

          {/* Feed Mode Selector - Collapsible */}
          <div className="mt-3">
            <button
              onClick={() => setIsSpeedSectionOpen(!isSpeedSectionOpen)}
              className="w-full flex items-center justify-between px-3 py-2 bg-black/30 rounded-lg border border-purple-500/30 hover:bg-purple-900/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-purple-300">Update Speed</span>
                <span className="text-xs px-2 py-0.5 bg-purple-600 text-white rounded">
                  {feedMode}
                </span>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  isSpeedSectionOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isSpeedSectionOpen && (
              <div className="mt-2 p-3 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30">
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-gray-400">Choose how fast you want price updates</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFeedMode('TICKER')}
                      disabled={isLiveUpdating}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
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
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
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
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                        feedMode === 'FULL'
                          ? 'bg-green-600 text-white shadow-lg shadow-green-500/50'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      } ${isLiveUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      FULL<br/><span className="text-[10px]">~100ms</span>
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    {feedMode === 'TICKER' && '📊 Updates every 1 second - Most stable, lowest bandwidth'}
                    {feedMode === 'QUOTE' && '🚀 Fast updates (~5 per second) - Recommended for most users'}
                    {feedMode === 'FULL' && '⚡ Fastest updates (~10 per second) with market depth - Highest bandwidth'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

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

        {/* Order Action Buttons */}
        {lastOrder && (
          <div className="glass-card rounded-xl p-4 md:p-5 mb-4 md:mb-5">
            <h3 className="text-base md:text-lg font-semibold text-cyan-400 mb-3 md:mb-4">
              🎯 Quick Actions
            </h3>
            <div className="space-y-2 md:space-y-3">
              {/* PP Button with Integrated Counter Controls */}
              <div className="flex items-center gap-0 bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                {/* Decrement Button */}
                <button
                  onClick={decrementPpOffset}
                  disabled={isLoading || ppOffset <= 1}
                  className="px-3 md:px-4 py-3 md:py-4 text-lg md:text-xl font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  −
                </button>
                
                {/* Main PP Button (Center) */}
                <button
                  onClick={placeProtectiveLimitOrder}
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
                  onClick={incrementPpOffset}
                  disabled={isLoading}
                  className="px-3 md:px-4 py-3 md:py-4 text-lg md:text-xl font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>

              <button
                onClick={placeMainStopLossOrder}
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
                <button
                  onClick={decrementTpOffset5}
                  disabled={isLoading || tpOffset <= 5}
                  className="px-3 md:px-4 py-3 md:py-4 rounded-xl font-semibold text-sm md:text-base bg-gradient-to-r from-red-500 to-orange-600 hover:shadow-lg hover:shadow-red-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  −5
                </button>

                {/* Combined Counter and TP Button */}
                <div className="flex-1 flex items-center gap-0 bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                  {/* Decrement Button */}
                  <button
                    onClick={decrementTpOffset}
                    disabled={isLoading || tpOffset <= 1}
                    className="px-3 md:px-4 py-3 md:py-4 text-lg md:text-xl font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  
                  {/* Main TP Button (Center) */}
                  <button
                    onClick={() => placeTakeProfitOrder(tpOffset)}
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
                    onClick={incrementTpOffset}
                    disabled={isLoading}
                    className="px-3 md:px-4 py-3 md:py-4 text-lg md:text-xl font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>

                {/* +5 Quick Increment Button (Right Side) */}
                <button
                  onClick={incrementTpOffset5}
                  disabled={isLoading}
                  className="px-3 md:px-4 py-3 md:py-4 rounded-xl font-semibold text-sm md:text-base bg-gradient-to-r from-emerald-500 to-green-600 hover:shadow-lg hover:shadow-emerald-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  +5
                </button>
              </div>
            </div>
          </div>
        )}

        <PendingOrdersCard
          orders={positionPendingOrders}
          lastOrder={lastOrder}
          onCancelOrder={() => {}}
        />
      </div>
    </div>
  );
}
