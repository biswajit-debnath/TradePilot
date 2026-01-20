import { useState, useCallback } from 'react';
import { apiService, PositionData } from '@/services/api';
import { OrderDetails, PendingSLOrder } from '@/types';

export function useTradingData() {
  const [lastOrder, setLastOrder] = useState<OrderDetails | null>(null);
  const [pendingOrders, setPendingOrders] = useState<PendingSLOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLastOrder = useCallback(async () => {
    try {
      const response = await apiService.getLastOptionOrder();
      if (response.success && response.order) {
        setLastOrder(response.order);
        return response.order;
      } else {
        setLastOrder(null);
        return null;
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  }, []);

  const fetchPendingOrders = useCallback(async () => {
    try {
      const response = await apiService.getPendingSLOrders();
      if (response.success) {
        setPendingOrders(response.orders);
        return response.orders;
      }
      return [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }, []);

  // Get position data for API calls
  const getPositionData = useCallback((): PositionData | null => {
    if (!lastOrder) return null;
    return {
      symbol: lastOrder.symbol,
      security_id: lastOrder.security_id,
      exchange_segment: lastOrder.exchange_segment,
      product_type: lastOrder.product_type,
      quantity: lastOrder.quantity,
      buy_price: lastOrder.buy_price,
    };
  }, [lastOrder]);

  // Find existing limit order for current position by type (TP or SL)
  const findExistingLimitOrder = useCallback((isTP: boolean): PendingSLOrder | null => {
    if (!lastOrder) return null;
    
    const found = pendingOrders.find(
      (order) =>
        order.transaction_type === 'SELL' &&
        order.order_type === 'LIMIT' &&
        order.security_id === lastOrder.security_id &&
        (order.status === 'PENDING' || order.status === 'TRANSIT') &&
        (isTP ? order.limit_price > lastOrder.buy_price : order.limit_price <= lastOrder.buy_price)
    ) || null;
    
    if (found) {
      console.log(`✅ Found existing ${isTP ? 'TP' : 'SL'} order:`, found.order_id, 'Price:', found.limit_price);
    } else {
      console.log(`📭 No existing ${isTP ? 'TP' : 'SL'} order found`);
    }
    
    return found;
  }, [lastOrder, pendingOrders]);

  // Find ANY existing limit order for current position (regardless of type)
  const findAnyExistingLimitOrder = useCallback((): PendingSLOrder | null => {
    if (!lastOrder) return null;
    
    const found = pendingOrders.find(
      (order) =>
        order.transaction_type === 'SELL' &&
        order.order_type === 'LIMIT' &&
        order.security_id === lastOrder.security_id &&
        (order.status === 'PENDING' || order.status === 'TRANSIT')
    ) || null;
    
    if (found) {
      console.log(`✅ Found existing LIMIT order:`, found.order_id, 'Price:', found.limit_price);
    } else {
      console.log(`📭 No existing LIMIT order found`);
    }
    
    return found;
  }, [lastOrder, pendingOrders]);

  return {
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
  };
}
