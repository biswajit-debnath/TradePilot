// API service for communicating with Next.js API routes

import { 
  ConnectionStatus, 
  OrderDetails,
  PositionDetails, 
  PendingSLOrder, 
  PlaceSLOrderResponse 
} from '@/types';
import { mockApiService } from './mock-api';

// Position data to pass to APIs
export interface PositionData {
  symbol: string;
  security_id: string;
  exchange_segment: string;
  product_type: string;
  quantity: number;
  buy_price: number;
}

// Check if mock data is enabled via environment variable
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

class ApiService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    return data;
  }

  /**
   * Verify connection to Dhan API
   */
  async verifyConnection(): Promise<ConnectionStatus> {
    if (USE_MOCK_DATA) {
      console.log('🎭 Using MOCK data mode');
      return mockApiService.verifyConnection();
    }
    return this.request<ConnectionStatus>('/api/verify-connection');
  }

  /**
   * Get current open position
   */
  async getCurrentPosition(): Promise<{ success: boolean; position?: PositionDetails; error?: string }> {
    if (USE_MOCK_DATA) return mockApiService.getCurrentPosition();
    return this.request('/api/current-position');
  }

  /**
   * Get all open positions (options and intraday stocks)
   */
  async getAllPositions(): Promise<{ success: boolean; positions?: PositionDetails[]; error?: string }> {
    if (USE_MOCK_DATA) return mockApiService.getAllPositions();
    return this.request('/api/all-positions');
  }

  /**
   * @deprecated Use getCurrentPosition() instead
   * Get the last traded option buy order (backwards compatibility)
   */
  async getLastOptionOrder(): Promise<{ success: boolean; order?: OrderDetails; error?: string }> {
    if (USE_MOCK_DATA) return mockApiService.getLastOptionOrder();
    
    // For backwards compatibility, still call the new endpoint but map response
    const response = await this.request<{ success: boolean; position?: PositionDetails; error?: string }>('/api/current-position');
    
    if (response.success && response.position) {
      // Map position to order format for backwards compatibility
      return {
        success: true,
        order: {
          order_id: response.position.position_id,
          symbol: response.position.symbol,
          order_category: response.position.category,
          option_type: response.position.option_type,
          strike_price: response.position.strike_price,
          expiry_date: response.position.expiry_date,
          quantity: response.position.quantity,
          buy_price: response.position.buy_price,
          sl_trigger_price: response.position.sl_trigger_price,
          sl_offset: response.position.sl_offset,
          security_id: response.position.security_id,
          exchange_segment: response.position.exchange_segment,
          product_type: response.position.product_type,
          unrealized_profit: response.position.unrealized_profit,
          realized_profit: response.position.realized_profit,
        }
      };
    }
    
    return { success: false, error: response.error };
  }

  /**
   * Place a new limit order
   * Uses position data from frontend to avoid extra API calls
   */
  async placeLimitOrder(options: { 
    offset: number; 
    is_tp: boolean;
    position_data: PositionData;
  }): Promise<PlaceSLOrderResponse> {
    if (USE_MOCK_DATA) return mockApiService.placeLimitOrder(options);
    
    return this.request<PlaceSLOrderResponse>('/api/place-limit-order', {
      method: 'POST',
      body: JSON.stringify({
        offset: options.offset,
        is_tp: options.is_tp,
        position_data: options.position_data
      }),
    });
  }

  /**
   * Update an existing limit order (cancels old and places new)
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
    if (USE_MOCK_DATA) return mockApiService.updateLimitOrder(options);
    
    return this.request<PlaceSLOrderResponse>('/api/update-limit-order', {
      method: 'PUT',
      body: JSON.stringify({
        order_id: options.order_id,
        limit_price: options.limit_price,
        quantity: options.quantity,
        security_id: options.security_id,
        exchange_segment: options.exchange_segment,
        transaction_type: options.transaction_type,
        product_type: options.product_type,
        buy_price: options.buy_price,
      }),
    });
  }

  /**
   * Get all pending orders
   */
  async getPendingSLOrders(): Promise<{ success: boolean; orders: PendingSLOrder[] }> {
    if (USE_MOCK_DATA) return mockApiService.getPendingSLOrders();
    return this.request('/api/pending-orders');
  }

  /**
   * Cancel a pending SL order
   */
  async cancelSLOrder(orderId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    if (USE_MOCK_DATA) return mockApiService.cancelSLOrder(orderId);
    
    return this.request(`/api/cancel-sl-order?order_id=${orderId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Place a stop-loss market order (triggers when price falls to trigger level)
   */
  async placeStopLossMarketOrder(options: {
    trigger_price: number;
    position_data: PositionData;
  }): Promise<PlaceSLOrderResponse> {
    if (USE_MOCK_DATA) return mockApiService.placeStopLossMarketOrder(options);
    
    return this.request<PlaceSLOrderResponse>('/api/place-sl-market-order', {
      method: 'POST',
      body: JSON.stringify({
        trigger_price: options.trigger_price,
      }),
    });
  }

  /**
   * Place a stop-loss limit order (better for F&O - triggers at trigger_price and executes at limit_price)
   */
  async placeStopLossLimitOrder(options: {
    trigger_price: number;
    limit_price: number;
    position_data: PositionData;
  }): Promise<PlaceSLOrderResponse> {
    if (USE_MOCK_DATA) return mockApiService.placeStopLossLimitOrder(options);
    
    return this.request<PlaceSLOrderResponse>('/api/place-sl-limit-order', {
      method: 'POST',
      body: JSON.stringify({
        trigger_price: options.trigger_price,
        limit_price: options.limit_price,
        position_data: options.position_data,
      }),
    });
  }

  /**
   * Get full order book
   */
  async getOrderBook(): Promise<{ success: boolean; orders?: any[]; error?: string }> {
    if (USE_MOCK_DATA) return mockApiService.getOrderBook();
    return this.request('/api/order-book');
  }

  /**
   * Get Last Traded Price (LTP) for instruments
   * Rate limit: 1 request per second
   */
  async getLTP(instruments: { exchangeSegment: string; securityId: string }[]): Promise<{
    success: boolean;
    ltp?: { [securityId: string]: number };
    error?: string;
  }> {
    if (USE_MOCK_DATA) {
      // Mock LTP for first instrument
      if (instruments.length > 0) {
        return mockApiService.getMarketLTP({
          exchange_segment: instruments[0].exchangeSegment,
          security_id: instruments[0].securityId,
        });
      }
    }
    
    return this.request('/api/market-ltp', {
      method: 'POST',
      body: JSON.stringify({ instruments }),
    });
  }

  /**
   * Exit a specific position and cancel its pending orders
   */
  async exitPosition(securityId: string): Promise<{ 
    success: boolean; 
    position_exited?: boolean; 
    orders_cancelled?: number; 
    message?: string; 
    errors?: string[];
    error?: string;
  }> {
    if (USE_MOCK_DATA) return mockApiService.exitPosition(securityId);
    
    return this.request('/api/exit-position', {
      method: 'POST',
      body: JSON.stringify({ security_id: securityId }),
    });
  }

  /**
   * Exit all open positions and cancel all pending orders
   */
  async exitAll(): Promise<{ 
    success: boolean; 
    positions_exited?: number; 
    orders_cancelled?: number; 
    message?: string; 
    errors?: string[];
    error?: string;
  }> {
    if (USE_MOCK_DATA) return mockApiService.exitAllPositions();
    
    return this.request('/api/exit-all', {
      method: 'POST',
    });
  }

  /**
   * Get trade book (completed trades)
   */
  async getTradeBook(): Promise<{ success: boolean; trades?: any[]; error?: string }> {
    if (USE_MOCK_DATA) return mockApiService.getTradeBook();
    return this.request('/api/trade-book');
  }
}

export const apiService = new ApiService();
