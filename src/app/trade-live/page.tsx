'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '@/services/api';
import { ConnectionStatus, OrderDetails, PendingSLOrder } from '@/types';
import { useTradingData } from '@/hooks/useTradingData';
import { usePaywallProtection } from '@/hooks/usePaywallProtection';
import Alert from '@/components/Alert';
import Navbar from '@/components/Navbar';
import DrawerMenu from '@/components/DrawerMenu';
import HowItWorksModal from '@/components/HowItWorksModal';
import LivePositionCard from '@/components/LivePositionCard';
import PendingOrdersCard from '@/components/PendingOrdersCard';

export default function TradeLive() {
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
  const [isLiveUpdating, setIsLiveUpdating] = useState(true);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  
  const liveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use custom hooks for trading data
  const {
    lastOrder,
    pendingOrders,
    isLoading,
    isRefreshing,
    setIsLoading,
    setIsRefreshing,
    fetchAllPositions,
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

  // Fetch LTP for current position
  const fetchLTP = useCallback(async (order: OrderDetails) => {
    try {
      const response = await apiService.getLTP([{
        exchangeSegment: order.exchange_segment,
        securityId: order.security_id,
      }]);

      if (response.success && response.ltp) {
        const ltp = response.ltp[order.security_id];
        if (ltp !== undefined) {
          setCurrentPrice(ltp);
          
          // Calculate gains/losses
          const buyPrice = order.buy_price;
          const points = ltp - buyPrice;
          const percentage = ((ltp - buyPrice) / buyPrice) * 100;
          const value = points * order.quantity;
          
          setGainLossPoints(points);
          setGainLossPercentage(percentage);
          setGainLossValue(value);
          setLastUpdated(new Date());
        }
      }
    } catch (error) {
      console.error('Error fetching LTP:', error);
      // Don't show alert for every LTP error to avoid spam
    }
  }, []);

  // Start/Stop live updates
  const toggleLiveUpdate = useCallback(() => {
    setIsLiveUpdating(prev => !prev);
  }, []);

  // Effect to manage live updates interval
  useEffect(() => {
    if (isLiveUpdating && lastOrder) {
      // Fetch immediately
      fetchLTP(lastOrder);
      
      // Then set up interval for every 1 second
      liveIntervalRef.current = setInterval(() => {
        fetchLTP(lastOrder);
      }, 5000);
    }

    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
    };
  }, [isLiveUpdating, lastOrder, fetchLTP]);

  // Main refresh function - fetches all data
  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        checkConnection(),
        fetchAllPositions(),
        fetchPendingOrders()
      ]);
      showAlert('✅ Data refreshed successfully', 'success');
    } catch (error) {
      showAlert('Error refreshing data: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [checkConnection, fetchAllPositions, fetchPendingOrders, showAlert, setIsRefreshing]);

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
      console.log('📊 Position detected after refresh, auto-starting live updates...');
      setTimeout(() => {
        setIsLiveUpdating(true);
      }, 500); // Small delay to ensure state is updated
    }
  }, [fetchAllPositions, isLiveUpdating, setIsRefreshing]);

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
    }
  }, [lastOrder]);

  useEffect(() => {
    // Initial load
    const initialLoad = async () => {
      setIsRefreshing(true);
      try {
        const [, position] = await Promise.all([
          checkConnection(),
          fetchAllPositions(),
          fetchPendingOrders()
        ]);

        // Auto-start live updates if position exists
        if (position) {
          console.log('📊 Position detected on page load, auto-starting live updates...');
          setTimeout(() => {
            setIsLiveUpdating(true);
          }, 500); // Small delay to ensure state is updated
        }
      } finally {
        setIsRefreshing(false);
      }
    };
    initialLoad();
  }, [checkConnection, fetchAllPositions, fetchPendingOrders, setIsRefreshing]);

  // Auto-refresh every 1 second when no position exists
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Clear any existing interval
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }

    // Only auto-refresh if there's NO position AND auto-refresh is enabled
    if (!lastOrder && autoRefreshEnabled) {
      console.log('📡 No position detected - Starting auto-refresh (1s interval)');
      autoRefreshIntervalRef.current = setInterval(async () => {
        // Silently refresh without showing success alert
        try {
          await Promise.all([
            fetchAllPositions(),
            fetchPendingOrders()
          ]);
        } catch (error) {
          console.error('Auto-refresh error:', error);
        }
      }, 1000); // 1 second
    } else {
      if (!autoRefreshEnabled) {
        console.log('⏸️ Auto-refresh disabled by user');
      } else {
        console.log('✅ Position detected - Auto-refresh stopped');
      }
    }

    // Cleanup on unmount or when lastOrder changes
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }, [lastOrder, fetchAllPositions, fetchPendingOrders, autoRefreshEnabled]);

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
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">📈</span>
            Trade Live Data
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time price updates with P&L tracking (refreshes every 1 second)
          </p>
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
        <PendingOrdersCard
          orders={positionPendingOrders}
          lastOrder={lastOrder}
          onCancelOrder={() => {}}
        />
      </div>
    </div>
  );
}
