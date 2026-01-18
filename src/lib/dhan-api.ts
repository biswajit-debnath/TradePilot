// Dhan API Service - Server-side only
import { DHAN_CONFIG } from '@/config';
import { DhanOrder, DhanProfile, PlaceOrderRequest } from '@/types';

class DhanApiService {
  private baseUrl: string;
  private accessToken: string;
  private clientId: string;

  constructor() {
    this.baseUrl = DHAN_CONFIG.BASE_URL;
    this.accessToken = DHAN_CONFIG.ACCESS_TOKEN;
    this.clientId = DHAN_CONFIG.CLIENT_ID;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'access-token': this.accessToken,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.errorMessage || 
        `HTTP Error: ${response.status} ${response.statusText}`
      );
    }

    const text = await response.text();
    return text ? JSON.parse(text) : ({ status: 'success' } as T);
  }

  /**
   * Get user profile to verify authentication
   */
  async getProfile(): Promise<DhanProfile> {
    console.log('Fetching Dhan profile to verify connection...');
    console.log(`Using Client ID: ${this.clientId}`);
    console.log(`Using Access Token: ${this.accessToken.substring(0, 5)}...`);
    console.log(`API Base URL: ${this.baseUrl}`);
    return this.request<DhanProfile>('/profile');
  }

  /**
   * Get all orders for the day
   */
  async getOrderBook(): Promise<DhanOrder[]> {
    return this.request<DhanOrder[]>('/orders');
  }

  /**
   * Get a specific order by ID
   */
  async getOrderById(orderId: string): Promise<DhanOrder> {
    return this.request<DhanOrder>(`/orders/${orderId}`);
  }

  /**
   * Place a new order
   */
  async placeOrder(orderData: PlaceOrderRequest): Promise<{ orderId: string; orderStatus: string }> {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  /**
   * Place a Stop Loss Market order
   */
  async placeStopLossMarketOrder(params: {
    transactionType: 'BUY' | 'SELL';
    exchangeSegment: string;
    productType: string;
    securityId: string;
    quantity: number;
    triggerPrice: number;
    correlationId?: string;
  }): Promise<{ orderId: string; orderStatus: string }> {
    const orderData: PlaceOrderRequest = {
      dhanClientId: this.clientId,
      transactionType: params.transactionType,
      exchangeSegment: params.exchangeSegment,
      productType: params.productType,
      orderType: 'STOP_LOSS_MARKET',
      validity: 'DAY',
      securityId: params.securityId,
      quantity: params.quantity.toString(),
      triggerPrice: params.triggerPrice.toString(),
      afterMarketOrder: false,
    };

    if (params.correlationId) {
      orderData.correlationId = params.correlationId;
    }

    return this.placeOrder(orderData);
  }

  /**
   * Place a Stop Loss Limit order
   */
  async placeStopLossLimitOrder(params: {
    transactionType: 'BUY' | 'SELL';
    exchangeSegment: string;
    productType: string;
    securityId: string;
    quantity: number;
    triggerPrice: number;
    price: number;
    correlationId?: string;
  }): Promise<{ orderId: string; orderStatus: string }> {
    const orderData: PlaceOrderRequest = {
      dhanClientId: this.clientId,
      transactionType: params.transactionType,
      exchangeSegment: params.exchangeSegment,
      productType: params.productType,
      orderType: 'STOP_LOSS',
      validity: 'DAY',
      securityId: params.securityId,
      quantity: params.quantity.toString(),
      triggerPrice: params.triggerPrice.toString(),
      price: params.price.toString(),
      afterMarketOrder: false,
    };

    if (params.correlationId) {
      orderData.correlationId = params.correlationId;
    }

    return this.placeOrder(orderData);
  }

  /**
   * Modify an existing order
   */
  async modifyOrder(params: {
    orderId: string;
    orderType: string;
    triggerPrice?: number;
    quantity?: number;
    price?: number;
    validity?: 'DAY' | 'IOC';
  }): Promise<{ orderId: string; orderStatus: string }> {
    const modifyData: Record<string, unknown> = {
      dhanClientId: this.clientId,
      orderId: params.orderId,
      orderType: params.orderType,
      legName: '',
      validity: params.validity || 'DAY',
    };

    if (params.triggerPrice !== undefined) {
      modifyData.triggerPrice = params.triggerPrice.toString();
    }
    if (params.quantity !== undefined) {
      modifyData.quantity = params.quantity.toString();
    }
    if (params.price !== undefined) {
      modifyData.price = params.price.toString();
    }

    return this.request(`/orders/${params.orderId}`, {
      method: 'PUT',
      body: JSON.stringify(modifyData),
    });
  }

  /**
   * Cancel a pending order
   */
  async cancelOrder(orderId: string): Promise<{ orderId: string; orderStatus: string }> {
    return this.request(`/orders/${orderId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Helper function to detect if a symbol is an option based on trading symbol
   * MCX options have CE (Call) or PE (Put) in their symbol
   * NSE/BSE options have CALL/PUT in drvOptionType
   */
  private isOptionOrder(order: DhanOrder): boolean {
    // For NSE/BSE, check drvOptionType
    if (['NSE_FNO', 'BSE_FNO'].includes(order.exchangeSegment)) {
      return ['CALL', 'PUT'].includes(order.drvOptionType || '');
    }
    
    // For MCX, check trading symbol for CE or PE
    if (order.exchangeSegment === 'MCX_COMM') {
      const symbol = order.tradingSymbol.toUpperCase();
      return symbol.includes('CE') || symbol.includes('PE');
    }
    
    return false;
  }

  /**
   * Get the last traded option BUY order (backwards compatibility)
   */
  async getLastTradedOptionBuyOrder(): Promise<DhanOrder | null> {
    return this.getLastTradedBuyOrder();
  }

  /**
   * Get the last traded BUY order (options or intraday stocks)
   */
  async getLastTradedBuyOrder(): Promise<DhanOrder | null> {
    const orders = await this.getOrderBook();

    if (!orders || orders.length === 0) {
      return null;
    }
    console.log(`Total orders fetched: ${orders.length}`);

    // Filter for traded BUY orders (options, futures, or intraday stocks)
    const buyOrders = orders.filter(
      (order) =>
        order.orderStatus === 'TRADED' &&
        order.transactionType === 'BUY' &&
        (
          // Options in F&O or MCX
          (['NSE_FNO', 'BSE_FNO', 'MCX_COMM'].includes(order.exchangeSegment) && this.isOptionOrder(order)) ||
          // Intraday stocks in NSE/BSE EQ
          (['NSE_EQ', 'BSE_EQ'].includes(order.exchangeSegment) && order.productType === 'INTRADAY')
        )
    );

    console.log(`Found ${buyOrders.length} eligible BUY orders (options + intraday stocks)`);
    
    if (buyOrders.length === 0) {
      return null;
    }

    // Sort by updateTime to get the most recent
    buyOrders.sort((a, b) => {
      const timeA = new Date(a.updateTime).getTime();
      const timeB = new Date(b.updateTime).getTime();
      return timeB - timeA;
    });

    const lastOrder = buyOrders[0];
    console.log('Last traded order:', JSON.stringify(lastOrder, null, 2));

    return lastOrder;
  }

  /**
   * Get all pending SL orders
   */
  async getPendingSLOrders(): Promise<DhanOrder[]> {
    const orders = await this.getOrderBook();

    return orders.filter(
      (order) =>
        order.orderStatus === 'PENDING' &&
        ['STOP_LOSS', 'STOP_LOSS_MARKET'].includes(order.orderType)
    );
  }

  /**
   * Get all open positions
   */
  async getPositions(): Promise<any[]> {
    return this.request<any[]>('/positions');
  }

  /**
   * Check if position is an option position
   */
  private isOptionPosition(position: any): boolean {
    // For NSE/BSE FNO, check drvOptionType
    if (['NSE_FNO', 'BSE_FNO'].includes(position.exchangeSegment)) {
      return ['CALL', 'PUT'].includes(position.drvOptionType || '');
    }
    
    // For MCX, check trading symbol for CE or PE
    if (position.exchangeSegment === 'MCX_COMM') {
      const symbol = position.tradingSymbol.toUpperCase();
      return symbol.includes('CE') || symbol.includes('PE');
    }
    
    return false;
  }

  /**
   * Get the last open position (options or intraday stocks with long positions)
   */
  async getLastOpenPosition(): Promise<any | null> {
    const positions = await this.getPositions();

    if (!positions || positions.length === 0) {
      return null;
    }

    console.log(`Total positions fetched: ${positions.length}`);

    // Filter for open LONG positions (options or intraday stocks)
    const openPositions = positions.filter(
      (position: any) =>
        position.netQty > 0 && // Only long positions
        position.positionType !== 'CLOSED' &&
        (
          // Options in F&O or MCX
          (['NSE_FNO', 'BSE_FNO', 'MCX_COMM'].includes(position.exchangeSegment) && this.isOptionPosition(position)) ||
          // Intraday stocks in NSE/BSE EQ
          (['NSE_EQ', 'BSE_EQ'].includes(position.exchangeSegment) && position.productType === 'INTRADAY')
        )
    );

    console.log(`Found ${openPositions.length} open LONG positions (options + intraday stocks)`);
    
    if (openPositions.length === 0) {
      return null;
    }

    // Return the first position (or you could add logic to select a specific one)
    const lastPosition = openPositions[0];
    console.log('Last open position:', JSON.stringify(lastPosition, null, 2));

    return lastPosition;
  }

  /**
   * Get all pending orders (not traded, not cancelled)
   */
  async getPendingOrders(): Promise<DhanOrder[]> {
    const orders = await this.getOrderBook();
    return orders.filter(
      (order) => order.orderStatus === 'PENDING' || order.orderStatus === 'TRANSIT'
    );
  }

  /**
   * Exit all open positions and cancel all pending orders
   */
  async exitAll(): Promise<{
    positionsExited: number;
    ordersCancelled: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let positionsExited = 0;
    let ordersCancelled = 0;

    try {
      // Get all open positions
      const positions = await this.getPositions();
      
      // Exit each position by placing opposite market order
      for (const position of positions) {
        // Only exit if there's a net position
        if (position.netQty !== 0 && position.positionType !== 'CLOSED') {
          try {
            const transactionType = position.netQty > 0 ? 'SELL' : 'BUY';
            const quantity = Math.abs(position.netQty);

            await this.placeOrder({
              dhanClientId: this.clientId,
              transactionType,
              exchangeSegment: position.exchangeSegment,
              productType: position.productType,
              orderType: 'MARKET',
              validity: 'DAY',
              securityId: position.securityId,
              quantity: quantity.toString(),
              afterMarketOrder: false,
              correlationId: `EXIT_${position.securityId}`,
            });

            positionsExited++;
            console.log(`Exited position: ${position.tradingSymbol} - ${transactionType} ${quantity}`);
          } catch (error) {
            const message = `Failed to exit ${position.tradingSymbol}: ${error instanceof Error ? error.message : 'Unknown'}`;
            errors.push(message);
            console.error(message);
          }
        }
      }

      // Get all pending orders
      const pendingOrders = await this.getPendingOrders();

      // Cancel each pending order
      for (const order of pendingOrders) {
        try {
          await this.cancelOrder(order.orderId);
          ordersCancelled++;
          console.log(`Cancelled order: ${order.orderId} - ${order.tradingSymbol}`);
        } catch (error) {
          const message = `Failed to cancel order ${order.orderId}: ${error instanceof Error ? error.message : 'Unknown'}`;
          errors.push(message);
          console.error(message);
        }
      }
    } catch (error) {
      const message = `Exit all failed: ${error instanceof Error ? error.message : 'Unknown'}`;
      errors.push(message);
      console.error(message);
    }

    return {
      positionsExited,
      ordersCancelled,
      errors,
    };
  }
}

export const dhanApi = new DhanApiService();
