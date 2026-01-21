/**
 * Mock API Service for TradePilot
 * Mimics the real API service but returns mock data
 * Used for UI/UX development when market is closed
 */

import { 
  ConnectionStatus, 
  OrderDetails,
  PositionDetails, 
  PendingSLOrder, 
  PlaceSLOrderResponse 
} from '@/types';
import {
  mockConnectionStatus,
  mockPositions,
  mockOrderDetails,
  mockPendingOrders,
  getMockCurrentPosition,
  getMockPendingOrdersForPosition,
  getMockOrderPlacementSuccess,
  getMockOrderCancellationSuccess,
  getMockPositionExitSuccess,
  getMockOrderBook,
  getMockTradeBook,
  getMockLTP,
  generateMockOrderId,
} from '@/lib/mock-data';
import { PositionData } from './api';

// Simulate API delay for realistic behavior
const simulateDelay = (ms: number = 300) => 
  new Promise(resolve => setTimeout(resolve, ms));

class MockApiService {
  /**
   * Verify connection to Dhan API (Mock)
   */
  async verifyConnection(): Promise<ConnectionStatus> {
    await simulateDelay(200);
    console.log('🎭 [MOCK] Verifying connection...');
    return mockConnectionStatus;
  }

  /**
   * Get current open position (Mock)
   */
  async getCurrentPosition(): Promise<{ success: boolean; position?: PositionDetails; error?: string }> {
    await simulateDelay(300);
    console.log('🎭 [MOCK] Fetching current position...');
    
    const currentPosition = mockPositions.find(p => 
      ['NSE_FNO', 'BSE_FNO', 'MCX_COMM'].includes(p.exchange_segment)
    ) || mockPositions[0];

    if (currentPosition) {
      return {
        success: true,
        position: currentPosition,
      };
    }

    return {
      success: false,
      error: 'No open positions found',
    };
  }

  /**
   * Get all open positions (Mock)
   */
  async getAllPositions(): Promise<{ success: boolean; positions?: PositionDetails[]; error?: string }> {
    await simulateDelay(350);
    console.log('🎭 [MOCK] Fetching all positions...');
    
    if (mockPositions.length > 0) {
      return {
        success: true,
        positions: mockPositions,
      };
    }

    return {
      success: false,
      error: 'No open positions found',
    };
  }

  /**
   * Get the last traded option buy order (Mock - backward compatibility)
   */
  async getLastOptionOrder(): Promise<{ success: boolean; order?: OrderDetails; error?: string }> {
    await simulateDelay(300);
    console.log('🎭 [MOCK] Fetching last option order...');
    
    const currentOrder = getMockCurrentPosition();

    if (currentOrder) {
      return {
        success: true,
        order: currentOrder,
      };
    }

    return {
      success: false,
      error: 'No option orders found',
    };
  }

  /**
   * Place a new limit order (Mock)
   */
  async placeLimitOrder(options: { 
    offset: number; 
    is_tp: boolean;
    position_data: PositionData;
  }): Promise<PlaceSLOrderResponse> {
    await simulateDelay(400);
    console.log('🎭 [MOCK] Placing limit order...', options);
    
    const limitPrice = options.is_tp 
      ? options.position_data.buy_price + options.offset
      : options.position_data.buy_price - options.offset;

    return getMockOrderPlacementSuccess('LIMIT', limitPrice);
  }

  /**
   * Update an existing limit order (Mock)
   */
  async updateLimitOrder(options: { 
    order_id: string; 
    limit_price: number;
    quantity: number;
    security_id: string;
    exchange_segment: string;
    transaction_type: 'BUY' | 'SELL';
    product_type: string;
    buy_price: number;
  }): Promise<PlaceSLOrderResponse> {
    await simulateDelay(450);
    console.log('🎭 [MOCK] Updating limit order...', options);
    
    return {
      ...getMockOrderPlacementSuccess('LIMIT', options.limit_price),
      is_updated: true,
    };
  }

  /**
   * Get all pending orders (Mock)
   */
  async getPendingSLOrders(): Promise<{ success: boolean; orders: PendingSLOrder[] }> {
    await simulateDelay(250);
    console.log('🎭 [MOCK] Fetching pending orders...');
    
    return {
      success: true,
      orders: mockPendingOrders,
    };
  }

  /**
   * Cancel a pending SL order (Mock)
   */
  async cancelSLOrder(orderId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    await simulateDelay(400);
    console.log('🎭 [MOCK] Cancelling order...', orderId);
    
    const order = mockPendingOrders.find(o => o.order_id === orderId);
    
    if (order) {
      return getMockOrderCancellationSuccess(orderId);
    }

    return {
      success: false,
      error: 'Order not found',
    };
  }

  /**
   * Place a stop-loss market order (Mock)
   */
  async placeStopLossMarketOrder(options: {
    trigger_price: number;
    position_data: PositionData;
  }): Promise<PlaceSLOrderResponse> {
    await simulateDelay(400);
    console.log('🎭 [MOCK] Placing stop-loss market order...', options);
    
    return {
      ...getMockOrderPlacementSuccess('STOP_LOSS_MARKET', 0),
      trigger_price: options.trigger_price,
    };
  }

  /**
   * Place a stop-loss limit order (Mock)
   */
  async placeStopLossLimitOrder(options: {
    trigger_price: number;
    limit_price: number;
    position_data: PositionData;
  }): Promise<PlaceSLOrderResponse> {
    await simulateDelay(400);
    console.log('🎭 [MOCK] Placing stop-loss limit order...', options);
    
    return {
      ...getMockOrderPlacementSuccess('STOP_LOSS', options.limit_price),
      trigger_price: options.trigger_price,
    };
  }

  /**
   * Modify an existing SL order (Mock)
   */
  async modifySLOrder(options: {
    order_id: string;
    new_trigger_price: number;
    new_limit_price?: number;
    quantity: number;
    security_id: string;
    exchange_segment: string;
    transaction_type: 'BUY' | 'SELL';
    product_type: string;
  }): Promise<{ success: boolean; message?: string; error?: string }> {
    await simulateDelay(450);
    console.log('🎭 [MOCK] Modifying SL order...', options);
    
    return {
      success: true,
      message: `Order ${options.order_id} modified successfully`,
    };
  }

  /**
   * Exit a position (Mock)
   */
  async exitPosition(securityId: string): Promise<{ 
    success: boolean; 
    message?: string; 
    errors?: string[];
    error?: string;
  }> {
    await simulateDelay(500);
    console.log('🎭 [MOCK] Exiting position...', securityId);
    
    const position = mockPositions.find(p => p.security_id === securityId);
    
    if (position) {
      return getMockPositionExitSuccess();
    }

    return {
      success: false,
      error: 'Position not found',
    };
  }

  /**
   * Exit all positions (Mock)
   */
  async exitAllPositions(): Promise<{
    success: boolean;
    message?: string;
    errors?: string[];
    error?: string;
  }> {
    await simulateDelay(600);
    console.log('🎭 [MOCK] Exiting all positions...');
    
    return {
      success: true,
      message: 'All positions exited successfully',
      errors: [],
    };
  }

  /**
   * Get order book (Mock)
   */
  async getOrderBook(): Promise<any> {
    await simulateDelay(300);
    console.log('🎭 [MOCK] Fetching order book...');
    
    return getMockOrderBook();
  }

  /**
   * Get trade book (Mock)
   */
  async getTradeBook(): Promise<any> {
    await simulateDelay(300);
    console.log('🎭 [MOCK] Fetching trade book...');
    
    return getMockTradeBook();
  }

  /**
   * Get market LTP (Mock)
   */
  async getMarketLTP(options: {
    exchange_segment: string;
    security_id: string;
  }): Promise<any> {
    await simulateDelay(200);
    console.log('🎭 [MOCK] Fetching market LTP...', options);
    
    return getMockLTP(options.security_id);
  }
}

// Export singleton instance
export const mockApiService = new MockApiService();
