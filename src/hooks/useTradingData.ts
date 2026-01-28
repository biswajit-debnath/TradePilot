import { useState, useCallback } from 'react';
import { apiService, PositionData } from '@/services/api';
import { OrderDetails, PendingSLOrder } from '@/types';

export function useTradingData() {
  const [lastOrder, setLastOrder] = useState<OrderDetails | null>(null);
  const [allPositions, setAllPositions] = useState<OrderDetails[]>([]);
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

  // Fetch all open positions
  const fetchAllPositions = useCallback(async () => {
    try {
      const response = await apiService.getAllPositions();
      if (response.success && response.positions) {
        console.log('📦 Raw positions from API:', response.positions.length);
        
        // Map positions to OrderDetails format
        const mappedPositions: OrderDetails[] = response.positions.map(pos => ({
          order_id: pos.position_id,
          symbol: pos.symbol,
          order_category: pos.category,
          option_type: pos.option_type,
          strike_price: pos.strike_price,
          expiry_date: pos.expiry_date,
          quantity: pos.quantity,
          buy_price: pos.buy_price,
          sl_trigger_price: pos.sl_trigger_price,
          sl_offset: pos.sl_offset,
          security_id: pos.security_id,
          exchange_segment: pos.exchange_segment,
          product_type: pos.product_type,
          unrealized_profit: pos.unrealized_profit,
          realized_profit: pos.realized_profit,
        }));
        
        // Debug: Log all positions before aggregation
        mappedPositions.forEach((pos, idx) => {
          console.log(`Position ${idx + 1}: ${pos.symbol} | Qty: ${pos.quantity} | SecID: ${pos.security_id} | Buy: ${pos.buy_price}`);
        });
        
        // Aggregate positions with the same security_id (same symbol/strike/expiry)
        const aggregatedMap = new Map<string, OrderDetails>();
        
        mappedPositions.forEach(pos => {
          const existing = aggregatedMap.get(pos.security_id);
          
          if (existing) {
            console.log(`🔄 Aggregating: ${pos.symbol} - Adding ${pos.quantity} to existing ${existing.quantity}`);
            
            // Combine positions: sum quantities and calculate weighted average buy price
            const totalQuantity = existing.quantity + pos.quantity;
            const weightedBuyPrice = 
              (existing.buy_price * existing.quantity + pos.buy_price * pos.quantity) / totalQuantity;
            
            console.log(`   New total qty: ${totalQuantity}, Weighted avg price: ${weightedBuyPrice.toFixed(2)}`);
            
            aggregatedMap.set(pos.security_id, {
              ...existing,
              quantity: totalQuantity,
              buy_price: weightedBuyPrice,
              unrealized_profit: existing.unrealized_profit + pos.unrealized_profit,
              realized_profit: existing.realized_profit + pos.realized_profit,
            });
          } else {
            // First occurrence of this security_id
            console.log(`📍 First occurrence: ${pos.symbol} | Qty: ${pos.quantity} | SecID: ${pos.security_id}`);
            aggregatedMap.set(pos.security_id, pos);
          }
        });
        
        // Convert map back to array
        const aggregatedPositions = Array.from(aggregatedMap.values());
        
        console.log(`✅ After aggregation: ${response.positions.length} positions -> ${aggregatedPositions.length} aggregated positions`);
        
        setAllPositions(aggregatedPositions);
        
        // Auto-select first F&O position, or first position if no F&O
        if (aggregatedPositions.length > 0) {
          const fnoPosition = aggregatedPositions.find(p => 
            ['NSE_FNO', 'BSE_FNO', 'MCX_COMM'].includes(p.exchange_segment)
          );
          const selectedPosition = fnoPosition || aggregatedPositions[0];
          console.log(`🎯 Selected position: ${selectedPosition.symbol} | Total Qty: ${selectedPosition.quantity} | Avg Buy: ${selectedPosition.buy_price.toFixed(2)}`);
          setLastOrder(selectedPosition);
          return selectedPosition;
        } else {
          setLastOrder(null);
          return null;
        }
      } else {
        setAllPositions([]);
        setLastOrder(null);
        return null;
      }
    } catch (error) {
      console.error('Error fetching all positions:', error);
      setAllPositions([]);
      return null;
    }
  }, []);

  // Select a specific position
  const selectPosition = useCallback((securityId: string) => {
    const position = allPositions.find(p => p.security_id === securityId);
    if (position) {
      setLastOrder(position);
      console.log('🎯 Selected position:', position.symbol);
    }
  }, [allPositions]);

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

  // Find ALL existing orders for current position (LIMIT + STOP_LOSS)
  const findAllExistingOrders = useCallback((): PendingSLOrder[] => {
    if (!lastOrder) return [];
    
    const found = pendingOrders.filter(
      (order) =>
        order.transaction_type === 'SELL' &&
        (order.order_type === 'LIMIT' || order.order_type === 'STOP_LOSS') &&
        order.security_id === lastOrder.security_id &&
        (order.status === 'PENDING' || order.status === 'TRANSIT')
    );
    
    if (found.length > 0) {
      console.log(`✅ Found ${found.length} existing order(s):`, found.map(o => `${o.order_type} (${o.order_id})`).join(', '));
    } else {
      console.log(`📭 No existing orders found`);
    }
    
    return found;
  }, [lastOrder, pendingOrders]);

  return {
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
  };
}
