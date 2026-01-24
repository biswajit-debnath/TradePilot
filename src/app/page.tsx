'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '@/services/api';
import { ConnectionStatus } from '@/types';
import { useTradingData } from '@/hooks/useTradingData';
import { useOrderActions } from '@/hooks/useOrderActions';
import { useAuth, getAuthHeader } from '@/lib/client-auth';
import Alert from '@/components/Alert';
import Navbar from '@/components/Navbar';
import DrawerMenu from '@/components/DrawerMenu';
import HowItWorksModal from '@/components/HowItWorksModal';
import PositionCard from '@/components/PositionCard';
import PendingOrdersCard from '@/components/PendingOrdersCard';

export default function Home() {
  const router = useRouter();
  const { getToken, getUsername, logout } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [tpOffset, setTpOffset] = useState(Number(process.env.NEXT_PUBLIC_TP_OFFSET || 12));
  const [ppOffset, setPpOffset] = useState(Number(process.env.NEXT_PUBLIC_PP_OFFSET || 2));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Check authentication and paywall on mount
  useEffect(() => {
    const token = getToken();
    const username = getUsername();
    
    if (!token) {
      router.push('/auth');
      return;
    }
    
    // Check if user is on paywall
    if (username === 'gurjyot') {
      router.push('/paywall');
      return;
    }
    
    setIsReady(true);
  }, [router, getToken, getUsername]);

  // Use custom hooks for trading data and order actions
  const {
    lastOrder,
    allPositions,
    pendingOrders,
    isLoading,
    isRefreshing,
    setIsLoading,
    setIsRefreshing,
    setPendingOrders,
    fetchLastOrder,
    fetchAllPositions,
    selectPosition,
    fetchPendingOrders,
    getPositionData,
    findExistingLimitOrder,
    findAnyExistingLimitOrder,
    findAllExistingOrders,
  } = useTradingData();

  const showAlert = (message: string, type: 'success' | 'error' | 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  // Use order actions hook
  const {
    placeProtectiveLimitOrder,
    placeMainStopLossOrder,
    placeTakeProfitOrder,
    cancelSLOrder,
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
  }, []);

  // Main refresh function - fetches all data
  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Reset offsets to default values
      setTpOffset(Number(process.env.NEXT_PUBLIC_TP_OFFSET || 12));
      setPpOffset(Number(process.env.NEXT_PUBLIC_PP_OFFSET || 2));
      
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
  }, [checkConnection, fetchAllPositions, fetchPendingOrders]);

  const incrementTpOffset = () => {
    setTpOffset(prev => prev + 1);
  };

  const incrementTpOffset5 = () => {
    setTpOffset(prev => prev + 5);
  };

  const decrementTpOffset = () => {
    setTpOffset(prev => Math.max(1, prev - 1));
  };

  const decrementTpOffset5 = () => {
    setTpOffset(prev => Math.max(1, prev - 5));
  };

  const incrementPpOffset = () => {
    setPpOffset(prev => prev + 1);
  };

  const decrementPpOffset = () => {
    setPpOffset(prev => Math.max(1, prev - 1));
  };

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

  const handleRefreshPosition = async () => {
    setIsRefreshing(true);
    await fetchAllPositions();
    setIsRefreshing(false);
  };

  // Filter pending orders for current position only
  const positionPendingOrders = lastOrder
    ? pendingOrders.filter(order => order.security_id === lastOrder.security_id)
    : [];

  // Check if there's an existing limit order
  const hasExistingLimitOrder = findExistingLimitOrder(true) !== null || findExistingLimitOrder(false) !== null;

  useEffect(() => {
    // Initial load without showing "refreshed" message
    const initialLoad = async () => {
      setIsRefreshing(true);
      try {
        await Promise.all([
          checkConnection(),
          fetchAllPositions(),
          fetchPendingOrders()
        ]);
      } finally {
        setIsRefreshing(false);
      }
    };
    initialLoad();
  }, [checkConnection, fetchAllPositions, fetchPendingOrders]);

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
            fetchLastOrder(),
            fetchPendingOrders()
          ]);
        } catch (error) {
          console.error('Auto-refresh error:', error);
        }
      }, Number(process.env.NEXT_PUBLIC_AUTO_REFRESH_INTERVAL) || 1000); // 1 second
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
  }, [lastOrder, fetchLastOrder, fetchPendingOrders, autoRefreshEnabled]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled(prev => {
      const newValue = !prev;
      showAlert(newValue ? '✅ Auto-refresh enabled' : '⏸️ Auto-refresh disabled', 'info');
      return newValue;
    });
  }, []);

  // Don't render until auth is checked
  if (!isReady) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {alert && <Alert message={alert.message} type={alert.type} />}
      <DrawerMenu
        isOpen={isDrawerOpen}
        connectionStatus={connectionStatus}
        onClose={() => setIsDrawerOpen(false)}
        onHowItWorksClick={() => setShowHowItWorks(true)}
        onLogout={logout}
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
        <PositionCard
          lastOrder={lastOrder}
          allPositions={allPositions}
          isRefreshing={isRefreshing}
          isLoading={isLoading}
          tpOffset={tpOffset}
          ppOffset={ppOffset}
          hasExistingLimitOrder={hasExistingLimitOrder}
          onRefreshPosition={handleRefreshPosition}
          onPlaceProtectiveSL={placeProtectiveLimitOrder}
          onPlaceStopLossMarket={placeMainStopLossOrder}
          onPlaceTakeProfit={() => placeTakeProfitOrder(tpOffset)}
          onIncrementTpOffset={incrementTpOffset}
          onDecrementTpOffset={decrementTpOffset}
          onIncrementTpOffset5={incrementTpOffset5}
          onDecrementTpOffset5={decrementTpOffset5}
          onIncrementPpOffset={incrementPpOffset}
          onDecrementPpOffset={decrementPpOffset}
          onSelectPosition={selectPosition}
        />
        <PendingOrdersCard
          orders={positionPendingOrders}
          lastOrder={lastOrder}
          onCancelOrder={cancelSLOrder}
        />
      </div>
    </div>
  );
}
