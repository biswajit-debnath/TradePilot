'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '@/services/api';
import { ConnectionStatus, OrderDetails, PendingSLOrder } from '@/types';
import { useTradingData } from '@/hooks/useTradingData';
import { DhanWebSocketService, TickerData, FeedMode } from '@/lib/dhan-websocket';
import Alert from '@/components/Alert';
import Navbar from '@/components/Navbar';
import DrawerMenu from '@/components/DrawerMenu';
import HowItWorksModal from '@/components/HowItWorksModal';
import LivePositionCard from '@/components/LivePositionCard';
import PendingOrdersCard from '@/components/PendingOrdersCard';

export default function TradeLiveWS() {
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

  useEffect(() => {
    // Initial load
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
                <span className="text-3xl">⚡</span>
                Trade Live (WebSocket)
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Real-time tick-by-tick updates via WebSocket
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
              {feedMode === 'QUOTE' && '🚀 Fast updates (~5 per second) - Recommended for most users'}
              {feedMode === 'FULL' && '⚡ Fastest updates (~10 per second) with market depth - Highest bandwidth'}
            </div>
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
        />
        <PendingOrdersCard
          orders={positionPendingOrders}
          lastOrder={lastOrder}
          onCancelOrder={() => {}}
        />
      </div>
    </div>
  );
}
