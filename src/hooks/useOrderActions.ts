import { useCallback } from 'react';
import { apiService } from '@/services/api';
import { PendingSLOrder } from '@/types';

interface UseOrderActionsParams {
  getPositionData: () => any;
  findAnyExistingLimitOrder: () => PendingSLOrder | null;
  findAllExistingOrders: () => PendingSLOrder[];
  setPendingOrders: React.Dispatch<React.SetStateAction<PendingSLOrder[]>>;
  fetchPendingOrders: () => Promise<PendingSLOrder[]>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  showAlert: (message: string, type: 'success' | 'error' | 'info') => void;
  lastOrder: any;
  ppOffset: number;
  lotSize: number; // Number of lots for F&O trading
}

export function useOrderActions({
  getPositionData,
  findAnyExistingLimitOrder,
  findAllExistingOrders,
  setPendingOrders,
  fetchPendingOrders,
  setIsLoading,
  showAlert,
  lastOrder,
  ppOffset,
  lotSize,
}: UseOrderActionsParams) {
  // Handle order placement/update logic
  const handleOrderAction = useCallback(async (offset: number, isTP: boolean, actionName: string) => {
    if (!lastOrder) {
      showAlert('❌ No position found. Please refresh data.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const positionData = getPositionData();
      if (!positionData) {
        showAlert('❌ Position data not available. Please refresh.', 'error');
        return;
      }

      console.log(`🔍 ${actionName} - Current Position Data:`, {
        symbol: positionData.symbol,
        buyPrice: positionData.buy_price,
        securityId: positionData.security_id,
        offset: offset,
        lastOrderSymbol: lastOrder?.symbol,
        lastOrderBuyPrice: lastOrder?.buy_price
      });

      // Check for ALL existing orders (LIMIT + STOP_LOSS_LIMIT) and cancel them
      const existingOrders = findAllExistingOrders();
      const limitPrice = Number((positionData.buy_price + offset).toFixed(1));
      
      // Cancel all existing orders first
      if (existingOrders.length > 0) {
        console.log(`🔄 Cancelling ${existingOrders.length} existing order(s) before placing ${actionName}`);
        
        for (const order of existingOrders) {
          const orderType = order.order_type === 'LIMIT' 
            ? (order.limit_price > positionData.buy_price ? 'TP' : 'SL') 
            : 'SL-Limit';
          console.log(`   ❌ Cancelling ${orderType} order (${order.order_id})`);
          await apiService.cancelSLOrder(order.order_id);
          setPendingOrders(prev => prev.filter(o => o.order_id !== order.order_id));
        }
      }
      
      // Now place the new order
      console.log(`📝 Creating new ${actionName} order with lot size: ${lotSize}`);
      const response = await apiService.placeLimitOrder({
        offset,
        is_tp: isTP,
        lot_size: lotSize,
        position_data: positionData,
      });
      
      if (response.success) {
        showAlert(`✅ Created ${actionName}! Order ID: ${response.order_id} | Limit Price: ₹${response.limit_price}`, 'success');
      }
      
      if (!response.success) {
        showAlert('❌ Failed: ' + response.error, 'error');
      } else {
        // Wait for order to be processed
        console.log('⏳ Waiting for order to be processed...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Refresh pending orders with retry
        console.log('🔄 Refreshing pending orders...');
        let retries = 3;
        while (retries > 0) {
          const orders = await fetchPendingOrders();
          
          const newOrder = orders.find(o => o.order_id === response.order_id);
          if (newOrder) {
            console.log('✅ New order found in pending orders');
            break;
          }
          
          if (retries > 1) {
            console.log(`🔄 Order not found yet, retrying... (${retries - 1} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          retries--;
        }
      }
    } catch (error) {
      showAlert('Error: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [lastOrder, getPositionData, findAllExistingOrders, setPendingOrders, fetchPendingOrders, setIsLoading, showAlert, lotSize]);

  const placeProtectiveLimitOrder = useCallback(async () => {
    console.log('🟢 PP BUTTON CLICKED - placeProtectiveLimitOrder called with ppOffset:', ppOffset);
    
    if (!lastOrder) {
      showAlert('❌ No position found. Please refresh data.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const positionData = getPositionData();
      if (!positionData) {
        showAlert('❌ Position data not available. Please refresh.', 'error');
        return;
      }

      console.log('🔍 Protective SL - Current Position Data:', {
        symbol: positionData.symbol,
        buyPrice: positionData.buy_price,
        securityId: positionData.security_id,
        lastOrderSymbol: lastOrder?.symbol,
        lastOrderBuyPrice: lastOrder?.buy_price,
        ppOffset: ppOffset,
        ppOffsetType: typeof ppOffset
      });

      // PP offset is POSITIVE - protecting profit above buy price
      const triggerPrice = Number((positionData.buy_price + ppOffset).toFixed(1));
      const limitPrice = Number((triggerPrice - 0.5).toFixed(1)); // Limit price slightly below trigger

      console.log('🎯 Protective SL Calculation:', {
        buyPrice: positionData.buy_price,
        ppOffset: ppOffset,
        calculation: `${positionData.buy_price} + ${ppOffset}`,
        triggerPrice: triggerPrice,
        limitPrice: limitPrice
      });

      // Check for ALL existing orders (LIMIT + STOP_LOSS_LIMIT) and cancel them
      const existingOrders = findAllExistingOrders();
      if (existingOrders.length > 0) {
        console.log(`🔄 Cancelling ${existingOrders.length} existing order(s) before placing Protective SL-Limit`);
        
        for (const order of existingOrders) {
          const orderType = order.order_type === 'LIMIT' 
            ? (order.limit_price > positionData.buy_price ? 'TP' : 'SL') 
            : 'SL-Limit';
          console.log(`   ❌ Cancelling ${orderType} order (${order.order_id})`);
          await apiService.cancelSLOrder(order.order_id);
          setPendingOrders(prev => prev.filter(o => o.order_id !== order.order_id));
        }
      }

      // Place STOP_LOSS_LIMIT order
      console.log(`🔻 Placing Protective SL-Limit Order: { buyPrice: ${positionData.buy_price}, ppOffset: +${ppOffset}, triggerPrice: ${triggerPrice}, limitPrice: ${limitPrice}, lotSize: ${lotSize} }`);
      
      const requestData = {
        trigger_price: triggerPrice,
        limit_price: limitPrice,
        lot_size: lotSize,
        position_data: positionData,
      };
      console.log('📤 Sending to API:', JSON.stringify(requestData, null, 2));
      
      const response = await apiService.placeStopLossLimitOrder(requestData);

      if (response.success) {
        showAlert(`✅ Protective SL-Limit Order Placed! Trigger: ₹${triggerPrice} | Limit: ₹${limitPrice}`, 'success');
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        await fetchPendingOrders();
      } else {
        showAlert('❌ Failed: ' + response.error, 'error');
      }
    } catch (error) {
      showAlert('Error: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [lastOrder, getPositionData, findAllExistingOrders, setPendingOrders, fetchPendingOrders, setIsLoading, showAlert, ppOffset, lotSize]);

  const placeMainStopLossOrder = useCallback(async () => {
    console.log('🔴 MAIN SL BUTTON CLICKED - placeMainStopLossOrder called');
    
    if (!lastOrder) {
      showAlert('❌ No position found. Please refresh data.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const positionData = getPositionData();
      if (!positionData) {
        showAlert('❌ Position data not available. Please refresh.', 'error');
        return;
      }

      console.log('🔍 Main SL - Current Position Data:', {
        symbol: positionData.symbol,
        buyPrice: positionData.buy_price,
        securityId: positionData.security_id,
        lastOrderSymbol: lastOrder?.symbol,
        lastOrderBuyPrice: lastOrder?.buy_price
      });

      const offset = -(Number(process.env.NEXT_PUBLIC_SL_OFFSET_LOSS) || 20);
      const triggerPrice = Number((positionData.buy_price + offset).toFixed(1));
      const limitPrice = Number((triggerPrice - 0.5).toFixed(1)); // Limit price slightly below trigger

      // Check for ALL existing orders (LIMIT + STOP_LOSS_LIMIT) and cancel them
      const existingOrders = findAllExistingOrders();
      if (existingOrders.length > 0) {
        console.log(`🔄 Cancelling ${existingOrders.length} existing order(s) before placing Main SL-Limit`);
        
        for (const order of existingOrders) {
          const orderType = order.order_type === 'LIMIT' 
            ? (order.limit_price > positionData.buy_price ? 'TP' : 'SL') 
            : 'SL-Limit';
          console.log(`   ❌ Cancelling ${orderType} order (${order.order_id})`);
          await apiService.cancelSLOrder(order.order_id);
          setPendingOrders(prev => prev.filter(o => o.order_id !== order.order_id));
        }
      }

      // Place STOP_LOSS_LIMIT order (works better for F&O)
      console.log(`🛡️ Placing SL-Limit Order: { buyPrice: ${positionData.buy_price}, offset: ${offset}, triggerPrice: ${triggerPrice}, limitPrice: ${limitPrice}, lotSize: ${lotSize} }`);
      const response = await apiService.placeStopLossLimitOrder({
        trigger_price: triggerPrice,
        limit_price: limitPrice,
        lot_size: lotSize,
        position_data: positionData,
      });

      if (response.success) {
        showAlert(`✅ SL-Limit Order Placed! Trigger: ₹${triggerPrice} | Limit: ₹${limitPrice}`, 'success');
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        await fetchPendingOrders();
      } else {
        showAlert('❌ Failed: ' + response.error, 'error');
      }
    } catch (error) {
      showAlert('Error: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [lastOrder, getPositionData, findAllExistingOrders, setPendingOrders, fetchPendingOrders, setIsLoading, showAlert, lotSize]);

  const placeTakeProfitOrder = useCallback((tpOffset: number) => {
    handleOrderAction(tpOffset, true, 'Take Profit');
  }, [handleOrderAction]);

  const cancelSLOrder = useCallback(async (orderId: string) => {
    try {
      const response = await apiService.cancelSLOrder(orderId);
      if (response.success) {
        showAlert('✅ Order cancelled', 'success');
        await fetchPendingOrders();
      } else {
        showAlert('❌ Failed to cancel: ' + response.error, 'error');
      }
    } catch (error) {
      showAlert('Error: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    }
  }, [fetchPendingOrders, showAlert]);

  return {
    placeProtectiveLimitOrder,
    placeMainStopLossOrder,
    placeTakeProfitOrder,
    cancelSLOrder,
  };
}
