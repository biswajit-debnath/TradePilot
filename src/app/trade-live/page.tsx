'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '@/services/api';
import { ConnectionStatus, OrderDetails, PendingSLOrder } from '@/types';
import { useTradingData } from '@/hooks/useTradingData';
import Alert from '@/components/Alert';
import Navbar from '@/components/Navbar';
import DrawerMenu from '@/components/DrawerMenu';
import HowItWorksModal from '@/components/HowItWorksModal';
import LivePositionCard from '@/components/LivePositionCard';
import PendingOrdersCard from '@/components/PendingOrdersCard';

export default function TradeLive() {
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
  
  const liveIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
    }
  }, [lastOrder]);

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
