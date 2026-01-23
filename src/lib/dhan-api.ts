import { DHAN_CONFIG } from '@/config';
import { logExternalCall } from '@/lib/api-logger';
import { AuthContext } from '@/types/auth';
import { getUserFromRequest } from '@/lib/auth-middleware';
import { getRequestFromContext } from '@/lib/request-context';
import { DhanOrder, DhanProfile, PlaceOrderRequest, LTPResponse } from '@/types';

class DhanApiService {
  private baseUrl: string;
  private accessToken: string;
  private clientId: string;

  constructor() {
    this.baseUrl = DHAN_CONFIG.BASE_URL;
    this.accessToken = DHAN_CONFIG.ACCESS_TOKEN;
    this.clientId = DHAN_CONFIG.CLIENT_ID;
  }

  /**
   * Get current user from request context
   */
  private getCurrentUser(): AuthContext | undefined {
    const request = getRequestFromContext();
    console.log('[DHAN-API] Request from context:', !!request);
    if (!request) {
      console.log('[DHAN-API] No request in context, user will be anonymous');
      return undefined;
    }
    const user = getUserFromRequest(request);
    console.log('[DHAN-API] Extracted user:', user?.username || 'anonymous');
    return user || undefined;
  }

  /**
   * Set user context for the current operation (alternative to AsyncLocalStorage)
   */
  private userContext?: AuthContext;
  
  setUserContext(user: AuthContext | undefined) {
    this.userContext = user;
  }
  
  private getUser(): AuthContext | undefined {
    // Try userContext first, then fall back to request context
    if (this.userContext) {
      console.log('[DHAN-API] Using explicit user context:', this.userContext.username);
      return this.userContext;
    }
    return this.getCurrentUser();
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
    const startedAt = Date.now();
    const requestBody = this.extractBody(options.body);
    const currentUser = this.getUser();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const responseText = await response.text();
      const parsedResponse = responseText ? JSON.parse(responseText) : ({ status: 'success' } as T);

      if (!response.ok) {
        const errorMessage = (parsedResponse as any)?.errorMessage || (parsedResponse as any)?.message || `HTTP Error: ${response.status} ${response.statusText}`;

        await logExternalCall({
          endpoint: url,
          method: options.method || 'GET',
          requestBody,
          responseStatus: response.status,
          responseBody: parsedResponse,
          errorMessage,
          durationMs: Date.now() - startedAt,
          user: currentUser,
        });

        throw new Error(errorMessage);
      }

      await logExternalCall({
        endpoint: url,
        method: options.method || 'GET',
        requestBody,
        responseStatus: response.status,
        responseBody: parsedResponse,
        durationMs: Date.now() - startedAt,
        user: currentUser,
      });

      return parsedResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await logExternalCall({
        endpoint: url,
        method: options.method || 'GET',
        requestBody,
        errorMessage,
        durationMs: Date.now() - startedAt,
        user: currentUser,
      });

      throw error;
    }
  }

  private extractBody(body: BodyInit | null | undefined): unknown {
    if (!body) return undefined;
    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        return body;
      }
    }
    return '[unlogged body]';
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
   * Get Last Traded Price (LTP) for instruments
   * Rate limit: 1 request per second, max 1000 instruments per request
   */
  async getLTP(instruments: { exchangeSegment: string; securityId: string }[]): Promise<LTPResponse> {
    // Group instruments by exchange segment
    const requestBody: { [key: string]: number[] } = {};
    
    for (const instrument of instruments) {
      if (!requestBody[instrument.exchangeSegment]) {
        requestBody[instrument.exchangeSegment] = [];
      }
      requestBody[instrument.exchangeSegment].push(parseInt(instrument.securityId));
    }

    console.log('📊 Fetching LTP for instruments:', JSON.stringify(requestBody));

    const response = await this.request<LTPResponse>('/marketfeed/ltp', {
      method: 'POST',
      headers: {
        'client-id': this.clientId,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📊 LTP Response:', JSON.stringify(response));
    return response;
  }

  /**
   * Get all orders for the day
   */
  async getOrderBook(): Promise<DhanOrder[]> {
    return this.request<DhanOrder[]>('/orders');
  }

  /**
   * Get trade history (filled orders)
   */
  async getTradeBook(): Promise<DhanOrder[]> {
    const orders = await this.getOrderBook();
    // Filter only TRADED orders (completed trades)
    return orders.filter(order => 
      order.orderStatus === 'TRADED' || 
      (order.orderStatus === 'PART_TRADED' && order.filledQty > 0)
    );
  }

  /**
   * Get trade history for a specific date range
   * @param fromDate - Start date in YYYY-MM-DD format
   * @param toDate - End date in YYYY-MM-DD format
   * @param page - Page number (default 0)
   */
  async getTradeHistory(fromDate: string, toDate: string, page: number = 0): Promise<any[]> {
    console.log(`📊 Fetching trade history from ${fromDate} to ${toDate}, page ${page}`);
    return this.request<any[]>(`/trades/${fromDate}/${toDate}/${page}`);
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

    console.log('📤 Placing SL-Market Order with params:', {
      exchangeSegment: params.exchangeSegment,
      productType: params.productType,
      securityId: params.securityId,
      quantity: params.quantity,
      triggerPrice: params.triggerPrice,
      transactionType: params.transactionType
    });
    
    try {
      const result = await this.placeOrder(orderData);
      console.log('✅ Order placed successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Order placement failed:', error);
      throw error;
    }
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
   * Place a Limit order (regular LIMIT order for better execution control)
   */
  async placeLimitOrder(params: {
    transactionType: 'BUY' | 'SELL';
    exchangeSegment: string;
    productType: string;
    securityId: string;
    quantity: number;
    price: number;
    correlationId?: string;
  }): Promise<{ orderId: string; orderStatus: string }> {
    const orderData: PlaceOrderRequest = {
      dhanClientId: this.clientId,
      transactionType: params.transactionType,
      exchangeSegment: params.exchangeSegment,
      productType: params.productType,
      orderType: 'LIMIT',
      validity: 'DAY',
      securityId: params.securityId,
      quantity: params.quantity.toString(),
      price: params.price.toString(),
      afterMarketOrder: false,
    };

    if (params.correlationId) {
      orderData.correlationId = params.correlationId;
    }

    console.log('📤 Placing Limit Order with params:', {
      exchangeSegment: params.exchangeSegment,
      productType: params.productType,
      securityId: params.securityId,
      quantity: params.quantity,
      price: params.price,
      transactionType: params.transactionType
    });
    
    try {
      const result = await this.placeOrder(orderData);
      console.log('✅ Limit Order placed successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Limit Order placement failed:', error);
      throw error;
    }
  }

  /**
   * Modify an existing order
   * Based on DhanHQ Python library implementation
   * Note: dhanClientId is automatically added by the library's _send_request method
   */
  async modifyOrder(params: {
    orderId: string;
    orderType: string;
    triggerPrice?: number;
    quantity?: number;
    price?: number;
    validity?: 'DAY' | 'IOC';
    legName?: string;
    disclosedQuantity?: number;
  }): Promise<{ orderId: string; orderStatus: string }> {
    // The Python library includes orderId in payload + adds dhanClientId automatically
    // All values are sent as raw numbers (not strings)
    const modifyData: Record<string, unknown> = {
      dhanClientId: this.clientId,
      orderId: params.orderId,
      orderType: params.orderType,
      legName: params.legName || '',
      quantity: params.quantity || 0,
      price: params.price || 0,
      disclosedQuantity: params.disclosedQuantity || 0,
      triggerPrice: params.triggerPrice || "",
      validity: params.validity || 'DAY',
    };

    console.log('🔧 Modify Order Request:', JSON.stringify(modifyData, null, 2));

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
  async getLastTradedBuyOrder(securityId?: string): Promise<DhanOrder | null> {
    const orders = await this.getOrderBook();

    if (!orders || orders.length === 0) {
      return null;
    }
    console.log(`Total orders fetched: ${orders.length}`);

    // Filter for traded BUY orders (options, futures, or intraday stocks)
    let buyOrders = orders.filter(
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

    // If securityId is provided, filter for that specific security
    if (securityId) {
      buyOrders = buyOrders.filter(order => order.securityId === securityId);
      console.log(`Filtering for securityId: ${securityId}`);
    }

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
   * Get all pending orders placed from the app (includes SL, TP, and exit orders)
   * Filters by correlationId to show only orders placed by this app
   */
  async getPendingSLOrders(): Promise<DhanOrder[]> {
    const orders = await this.getOrderBook();

    return orders.filter(
      (order) =>
        order.orderStatus === 'PENDING' &&
        // Include orders with our correlation IDs (SL_, TP_, EXIT_, SL_LIMIT_, TP_LIMIT_)
        order.correlationId &&
        (order.correlationId.startsWith('SL_') || 
         order.correlationId.startsWith('TP_') || 
         order.correlationId.startsWith('EXIT_') ||
         order.correlationId.startsWith('SL_LIMIT_') ||
         order.correlationId.startsWith('TP_LIMIT_'))
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

    // If only one position, return it
    if (openPositions.length === 1) {
      console.log('Single open position:', JSON.stringify(openPositions[0], null, 2));
      return openPositions[0];
    }

    // If multiple positions, find the most recent by matching with the latest BUY order
    try {
      const lastBuyOrder = await this.getLastTradedBuyOrder();
      if (lastBuyOrder) {
        const matchingPosition = openPositions.find(
          (p: any) => p.securityId === lastBuyOrder.securityId
        );
        if (matchingPosition) {
          console.log('Found position matching most recent BUY order:', JSON.stringify(matchingPosition, null, 2));
          return matchingPosition;
        }
      }
    } catch (error) {
      console.error('Error finding position by order:', error);
    }

    // Fallback: Return the last position in the array
    const lastPosition = openPositions[openPositions.length - 1];
    console.log('Fallback: Using last position in array:', JSON.stringify(lastPosition, null, 2));

    return lastPosition;
  }

  /**
   * Get all pending orders (not traded, not cancelled)
   */
  async getPendingOrders(): Promise<DhanOrder[]> {
    const orders = await this.getOrderBook();
    //**To debug the issue of placing a zero order  */
    
    console.log(`Found ${orders.length} orders in the order book.`);

    return orders.filter(
      (order) => (order.orderStatus === 'PENDING' || order.orderStatus === 'TRANSIT') || order.orderStatus === "TRIGGERED"
    );
  }

  /**
   * Exit a specific position and cancel all its pending orders
   */
  async exitPosition(securityId: string): Promise<{
    positionExited: boolean;
    ordersCancelled: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let positionExited = false;
    let ordersCancelled = 0;

    try {
      // Get all open positions and find the specific one
      const positions = await this.getPositions();
      const position = positions.find(p => p.securityId === securityId);
      
      if (!position) {
        errors.push(`Position not found for security ID: ${securityId}`);
        console.log(`⚠️ No position found for security ID: ${securityId}`);
      } else {
        console.log(`Found position: ${position.tradingSymbol} - Net Qty: ${position.netQty}, Type: ${position.positionType}`);
        
        // Only exit if there's a net position
        if (position.netQty !== 0 && position.positionType !== 'CLOSED') {
          try {
            const transactionType = position.netQty > 0 ? 'SELL' : 'BUY';
            const quantity = Math.abs(position.netQty);
            
            console.log(`Placing exit order: ${transactionType} ${quantity} of ${position.tradingSymbol}`);

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

            positionExited = true;
            console.log(`✅ Exited position: ${position.tradingSymbol} - ${transactionType} ${quantity}`);
          } catch (error) {
            const message = `Failed to exit ${position.tradingSymbol}: ${error instanceof Error ? error.message : 'Unknown'}`;
            errors.push(message);
            console.error(message);
          }
        } else {
          console.log(`⚠️ Position already closed or zero quantity for ${position.tradingSymbol}`);
        }
      }

      // Get all pending orders for this security
      const pendingOrders = await this.getPendingOrders();
      const positionOrders = pendingOrders.filter(order => order.securityId === securityId);

      console.log(`Found ${positionOrders.length} pending orders for security ${securityId} to cancel.`);

      // Cancel each pending order for this position
      for (const order of positionOrders) {
        try {
          console.log(`Cancelling order: ${order.orderId} - ${order.tradingSymbol}`);

          await this.cancelOrder(order.orderId);
          ordersCancelled++;
          console.log(`✅ Cancelled order: ${order.orderId} - ${order.tradingSymbol}`);
        } catch (error) {
          const message = `Failed to cancel order ${order.orderId}: ${error instanceof Error ? error.message : 'Unknown'}`;
          errors.push(message);
          console.error(message);
        }
      }

      console.log(`Total: Position exited: ${positionExited}, Orders cancelled: ${ordersCancelled}`);

    } catch (error) {
      const message = `Exit position failed: ${error instanceof Error ? error.message : 'Unknown'}`;
      errors.push(message);
      console.error(message);
    }

    return {
      positionExited,
      ordersCancelled,
      errors,
    };
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
     //**To debug the issue of placing a zero order  */
     // Primary flow
        // First buy the positions
        // Comment the order placing part i.e position one  
        // Test the and check the order cancelling flow without enabling it
        // Comment the order cancelling part
        // Test the order placing part without enabling it
        // Test the order placing part by enabling it
        // If issue not found in the placing part then enable the cancelling part and test the full flow

    try {
      // Get all open positions
      const positions = await this.getPositions();
      //**To debug the issue of placing a zero order  */
      // Cancel the orders part
      // First buy the positions
        // Comment the cancelling part temporarily line no 415
        // Comment the placeOrder part temporarily line no 390
        // Check the console for the orders and there cancellation flow with the placed consoles
      console.log(`Found ${positions.length} open positions to exit.`);
      
      // Exit each position by placing opposite market order
      for (const position of positions) {
        // Only exit if there's a net position
        //**To debug the issue of placing a zero order  */

        console.log(`Processing position: ${position.tradingSymbol} - Net Qty: ${position.netQty}, Type: ${position.positionType}`);
        
        if (position.netQty !== 0 && position.positionType !== 'CLOSED') {
          try {
            const transactionType = position.netQty > 0 ? 'SELL' : 'BUY';
            const quantity = Math.abs(position.netQty);
            //**To debug the issue of placing a zero order  */
            console.log(`Placing order: ${transactionType} ${quantity} of ${position.tradingSymbol}`);
            console.log(`Position details: Exchange Segment - ${position.exchangeSegment}, Product Type - ${position.productType}, Security ID - ${position.securityId}`);

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

      //**To debug the issue of placing a zero order  */
      // Cancelling order part
        // First buy the positions
        // Comment the cancelling part temporarily line no 415
        // Check the console for the orders and there cancellation flow with the placed consoles
      console.log(`Found ${pendingOrders.length} pending orders to cancel.`);

      // Cancel each pending order
      for (const order of pendingOrders) {
        try {
          //**To debug the issue of placing a zero order  */
          console.log(`Cancelling order: ${order.orderId} - ${order.tradingSymbol}`);

          await this.cancelOrder(order.orderId);
          ordersCancelled++;
          console.log(`Cancelled order: ${order.orderId} - ${order.tradingSymbol}`);
        } catch (error) {
          const message = `Failed to cancel order ${order.orderId}: ${error instanceof Error ? error.message : 'Unknown'}`;
          errors.push(message);
          console.error(message);
        }
      }
      //**To debug the issue of placing a zero order  */
      console.log("Total orders cancelled:", ordersCancelled);

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
