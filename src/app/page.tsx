'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';
import { ConnectionStatus } from '@/types';
import { useTradingData } from '@/hooks/useTradingData';
import { useOrderActions } from '@/hooks/useOrderActions';
import Alert from '@/components/Alert';
import Navbar from '@/components/Navbar';
import DrawerMenu from '@/components/DrawerMenu';
import HowItWorksModal from '@/components/HowItWorksModal';
import PositionCard from '@/components/PositionCard';
import PendingOrdersCard from '@/components/PendingOrdersCard';

export default function Home() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [tpOffset, setTpOffset] = useState(Number(process.env.NEXT_PUBLIC_TP_OFFSET || 12));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Use custom hooks for trading data and order actions
  const {
    lastOrder,
    pendingOrders,
    isLoading,
    isRefreshing,
    setIsLoading,
    setIsRefreshing,
    setPendingOrders,
    fetchLastOrder,
    fetchPendingOrders,
    getPositionData,
    findExistingLimitOrder,
    findAnyExistingLimitOrder,
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
    setPendingOrders,
    fetchPendingOrders,
    setIsLoading,
    showAlert,
    lastOrder,
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
      // Reset TP offset to default value
      setTpOffset(Number(process.env.NEXT_PUBLIC_TP_OFFSET || 12));
      
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
  }, [checkConnection, fetchLastOrder, fetchPendingOrders]);

  const incrementTpOffset = () => {
    setTpOffset(prev => prev + 1);
  };

  const decrementTpOffset = () => {
    setTpOffset(prev => Math.max(1, prev - 1));
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
          fetchLastOrder(),
          fetchPendingOrders()
        ]);
      } finally {
        setIsRefreshing(false);
      }
    };
    initialLoad();
  }, [checkConnection, fetchLastOrder, fetchPendingOrders]);

  return (
    <div className="min-h-screen">
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
        {alert && <Alert message={alert.message} type={alert.type} />}
        <PositionCard
          lastOrder={lastOrder}
          isRefreshing={isRefreshing}
          isLoading={isLoading}
          tpOffset={tpOffset}
          hasExistingLimitOrder={hasExistingLimitOrder}
          onRefreshPosition={handleRefreshPosition}
          onPlaceProtectiveSL={placeProtectiveLimitOrder}
          onPlaceStopLossMarket={placeMainStopLossOrder}
          onPlaceTakeProfit={() => placeTakeProfitOrder(tpOffset)}
          onIncrementTpOffset={incrementTpOffset}
          onDecrementTpOffset={decrementTpOffset}
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
