import { useCallback } from 'react';
import { apiService } from '@/services/api';
import { PendingSLOrder } from '@/types';

interface UseOrderActionsParams {
  getPositionData: () => any;
  findAnyExistingLimitOrder: () => PendingSLOrder | null;
  setPendingOrders: React.Dispatch<React.SetStateAction<PendingSLOrder[]>>;
  fetchPendingOrders: () => Promise<PendingSLOrder[]>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  showAlert: (message: string, type: 'success' | 'error' | 'info') => void;
  lastOrder: any;
}

export function useOrderActions({
  getPositionData,
  findAnyExistingLimitOrder,
  setPendingOrders,
  fetchPendingOrders,
  setIsLoading,
  showAlert,
  lastOrder,
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

      // Check for ANY existing LIMIT order (not just same type)
      const existingOrder = findAnyExistingLimitOrder();
      const limitPrice = Number((positionData.buy_price + offset).toFixed(1));
      
      let response;
      
      if (existingOrder) {
        const existingType = existingOrder.limit_price > positionData.buy_price ? 'TP' : 'SL';
        const newType = limitPrice > positionData.buy_price ? 'TP' : 'SL';
        console.log(`🔄 Replacing existing ${existingType} order (${existingOrder.order_id}) with new ${newType} order`);
        
        // Immediately remove the old order from state to prevent duplicate detection
        setPendingOrders(prev => prev.filter(o => o.order_id !== existingOrder.order_id));
        
        // Update existing order - cancel and replace with new order
        response = await apiService.updateLimitOrder({
          order_id: existingOrder.order_id,
          limit_price: limitPrice,
          quantity: existingOrder.quantity,
          security_id: positionData.security_id,
          exchange_segment: positionData.exchange_segment,
          transaction_type: 'SELL',
          product_type: positionData.product_type,
          buy_price: positionData.buy_price,
        });
        
        if (response.success) {
          showAlert(`🔄 Replaced ${existingType} with ${actionName}! Order ID: ${response.order_id} | Limit Price: ₹${limitPrice}`, 'success');
        }
      } else {
        console.log(`📝 Creating new order for ${actionName}`);
        // Create new order
        response = await apiService.placeLimitOrder({
          offset,
          is_tp: isTP,
          position_data: positionData,
        });
        
        if (response.success) {
          showAlert(`✅ Created ${actionName}! Order ID: ${response.order_id} | Limit Price: ₹${response.limit_price}`, 'success');
        }
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
  }, [lastOrder, getPositionData, findAnyExistingLimitOrder, setPendingOrders, fetchPendingOrders, setIsLoading, showAlert]);

  const placeProtectiveLimitOrder = useCallback(() => {
    const offset = Number(process.env.NEXT_PUBLIC_SL_OFFSET || 2);
    handleOrderAction(offset, false, 'Protective SL');
  }, [handleOrderAction]);

  const placeMainStopLossOrder = useCallback(async () => {
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

      const offset = -(Number(process.env.NEXT_PUBLIC_SL_OFFSET_LOSS) || 20);
      const triggerPrice = Number((positionData.buy_price + offset).toFixed(1));

      // Check for ANY existing order and cancel it
      const existingOrder = findAnyExistingLimitOrder();
      if (existingOrder) {
        const existingType = existingOrder.limit_price > positionData.buy_price ? 'TP' : 'SL';
        console.log(`🔄 Replacing existing ${existingType} order (${existingOrder.order_id}) with SL-M order`);
        
        await apiService.cancelSLOrder(existingOrder.order_id);
        setPendingOrders(prev => prev.filter(o => o.order_id !== existingOrder.order_id));
      }

      // Place STOP_LOSS_MARKET order
      console.log(`🛡️ Placing SL-Market Order: { buyPrice: ${positionData.buy_price}, offset: ${offset}, triggerPrice: ${triggerPrice} }`);
      const response = await apiService.placeStopLossMarketOrder({
        trigger_price: triggerPrice,
        position_data: positionData,
      });

      if (response.success) {
        showAlert(`✅ SL-Market Order Placed! Trigger: ₹${triggerPrice}`, 'success');
        
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
  }, [lastOrder, getPositionData, findAnyExistingLimitOrder, setPendingOrders, fetchPendingOrders, setIsLoading, showAlert]);

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
