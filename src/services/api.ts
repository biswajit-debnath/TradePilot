// API service for communicating with Next.js API routes

import { 
  ConnectionStatus, 
  OrderDetails,
  PositionDetails, 
  PendingSLOrder, 
  PlaceSLOrderResponse 
} from '@/types';

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
    return this.request<ConnectionStatus>('/api/verify-connection');
  }

  /**
   * Get current open position
   */
  async getCurrentPosition(): Promise<{ success: boolean; position?: PositionDetails; error?: string }> {
    return this.request('/api/current-position');
  }

  /**
   * @deprecated Use getCurrentPosition() instead
   * Get the last traded option buy order (backwards compatibility)
   */
  async getLastOptionOrder(): Promise<{ success: boolean; order?: OrderDetails; error?: string }> {
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
   * Place a stop loss market order
   */
  async placeSLMarketOrder(options?: { triggerPrice?: number; pointsOffset?: number }): Promise<PlaceSLOrderResponse> {
    const body: any = {};
    
    if (options?.triggerPrice !== undefined) {
      body.trigger_price = options.triggerPrice;
    }
    
    if (options?.pointsOffset !== undefined) {
      body.points_offset = options.pointsOffset;
    }
    
    return this.request<PlaceSLOrderResponse>('/api/place-sl-market-order', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * @deprecated Use placeSLMarketOrder() instead
   * Place a stop loss market order (backwards compatibility)
   */
  async placeSLOrder(triggerPrice?: number): Promise<PlaceSLOrderResponse> {
    return this.placeSLMarketOrder(triggerPrice ? { triggerPrice } : undefined);
  }

  /**
   * Place a take profit market order (sell at buy + points)
   */
  async placeTakeProfitOrder(pointsOffset: number = 12): Promise<PlaceSLOrderResponse> {
    return this.placeSLMarketOrder({ pointsOffset });
  }

  /**
   * Place a stop loss limit order (buy price - 20)
   */
  async placeSLLimitOrder(): Promise<PlaceSLOrderResponse> {
    return this.request<PlaceSLOrderResponse>('/api/place-sl-limit-order', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  /**
   * Get all pending SL orders
   */
  async getPendingSLOrders(): Promise<{ success: boolean; orders: PendingSLOrder[] }> {
    return this.request('/api/pending-sl-orders');
  }

  /**
   * Modify an existing SL order
   */
  async modifySLOrder(orderId: string, triggerPrice: number): Promise<PlaceSLOrderResponse> {
    return this.request<PlaceSLOrderResponse>('/api/modify-sl-order', {
      method: 'PUT',
      body: JSON.stringify({ order_id: orderId, trigger_price: triggerPrice }),
    });
  }

  /**
   * Cancel a pending SL order
   */
  async cancelSLOrder(orderId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.request(`/api/cancel-sl-order?order_id=${orderId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get full order book
   */
  async getOrderBook(): Promise<{ success: boolean; orders: unknown[] }> {
    return this.request('/api/order-book');
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
    return this.request('/api/exit-all', {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();
