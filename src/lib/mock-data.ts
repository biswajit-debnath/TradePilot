/**
 * Mock Data for TradePilot
 * Used for UI/UX development when market is closed or for testing
 */

import { 
  ConnectionStatus, 
  OrderDetails, 
  PendingSLOrder,
  PositionDetails 
} from '@/types';

// Mock Connection Status
export const mockConnectionStatus: ConnectionStatus = {
  success: true,
  client_id: '1234567890',
  token_validity: '2026-01-22 09:15:00',
  active_segments: 'NSE_EQ,NSE_FNO,BSE_EQ',
};

// Mock Positions - Mix of Options and Stocks
export const mockPositions: PositionDetails[] = [
  // Option Position 1 - NIFTY Call (Profitable)
  {
    position_id: 'POS001',
    symbol: 'NIFTY 23 JAN 23500 CE',
    category: 'OPTION',
    option_type: 'CALL',
    strike_price: 23500,
    expiry_date: '2026-01-23',
    quantity: 50,
    buy_price: 185.50,
    sl_trigger_price: 183.50,
    sl_offset: 2,
    security_id: '52175',
    exchange_segment: 'NSE_FNO',
    product_type: 'INTRADAY',
    unrealized_profit: 425.00,
    realized_profit: 0,
  },
  // Option Position 2 - BANKNIFTY Put (Loss)
  {
    position_id: 'POS002',
    symbol: 'BANKNIFTY 23 JAN 48000 PE',
    category: 'OPTION',
    option_type: 'PUT',
    strike_price: 48000,
    expiry_date: '2026-01-23',
    quantity: 30,
    buy_price: 295.75,
    sl_trigger_price: 275.75,
    sl_offset: 20,
    security_id: '41234',
    exchange_segment: 'NSE_FNO',
    product_type: 'INTRADAY',
    unrealized_profit: -315.00,
    realized_profit: 0,
  },
  // Option Position 3 - NIFTY Put (Breakeven)
  {
    position_id: 'POS003',
    symbol: 'NIFTY 23 JAN 23400 PE',
    category: 'OPTION',
    option_type: 'PUT',
    strike_price: 23400,
    expiry_date: '2026-01-23',
    quantity: 50,
    buy_price: 142.25,
    sl_trigger_price: 140.25,
    sl_offset: 2,
    security_id: '52180',
    exchange_segment: 'NSE_FNO',
    product_type: 'INTRADAY',
    unrealized_profit: 75.00,
    realized_profit: 0,
  },
  // Stock Position 1 - Reliance (Profitable)
  {
    position_id: 'POS004',
    symbol: 'RELIANCE',
    category: 'STOCK',
    option_type: null,
    strike_price: 0,
    expiry_date: '',
    quantity: 10,
    buy_price: 2845.30,
    sl_trigger_price: 2825.30,
    sl_offset: 20,
    security_id: '1333',
    exchange_segment: 'NSE_EQ',
    product_type: 'INTRADAY',
    unrealized_profit: 187.00,
    realized_profit: 0,
  },
  // Stock Position 2 - TCS (Small Loss)
  {
    position_id: 'POS005',
    symbol: 'TCS',
    category: 'STOCK',
    option_type: null,
    strike_price: 0,
    expiry_date: '',
    quantity: 5,
    buy_price: 3912.50,
    sl_trigger_price: 3882.50,
    sl_offset: 30,
    security_id: '11536',
    exchange_segment: 'NSE_EQ',
    product_type: 'INTRADAY',
    unrealized_profit: -62.50,
    realized_profit: 0,
  },
];

// Convert PositionDetails to OrderDetails (for backward compatibility)
export const mockOrderDetails: OrderDetails[] = mockPositions.map(pos => ({
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

// Mock Pending Orders - Mix of different types
export const mockPendingOrders: PendingSLOrder[] = [
  // SL-Market order for NIFTY Call
  {
    order_id: 'ORD001',
    symbol: 'NIFTY 23 JAN 23500 CE',
    quantity: 50,
    trigger_price: 183.50,
    limit_price: 0,
    order_type: 'STOP_LOSS_MARKET',
    transaction_type: 'SELL',
    status: 'PENDING',
    create_time: '2026-01-21 09:30:15',
    security_id: '52175',
    buy_price: 185.50,
    points: -2.00,
    potential_pl: -100.00,
  },
  // Limit order (TP) for NIFTY Call
  {
    order_id: 'ORD002',
    symbol: 'NIFTY 23 JAN 23500 CE',
    quantity: 50,
    trigger_price: 0,
    limit_price: 197.50,
    order_type: 'LIMIT',
    transaction_type: 'SELL',
    status: 'PENDING',
    create_time: '2026-01-21 09:32:45',
    security_id: '52175',
    buy_price: 185.50,
    points: 12.00,
    potential_pl: 600.00,
  },
  // SL-Limit order for BANKNIFTY Put
  {
    order_id: 'ORD003',
    symbol: 'BANKNIFTY 23 JAN 48000 PE',
    quantity: 30,
    trigger_price: 275.75,
    limit_price: 273.75,
    order_type: 'STOP_LOSS',
    transaction_type: 'SELL',
    status: 'PENDING',
    create_time: '2026-01-21 09:45:20',
    security_id: '41234',
    buy_price: 295.75,
    points: -20.00,
    potential_pl: -600.00,
  },
  // Limit order (TP) for Reliance
  {
    order_id: 'ORD004',
    symbol: 'RELIANCE',
    quantity: 10,
    trigger_price: 0,
    limit_price: 2875.30,
    order_type: 'LIMIT',
    transaction_type: 'SELL',
    status: 'PENDING',
    create_time: '2026-01-21 10:15:30',
    security_id: '1333',
    buy_price: 2845.30,
    points: 30.00,
    potential_pl: 300.00,
  },
  // SL-Market order for NIFTY Put
  {
    order_id: 'ORD005',
    symbol: 'NIFTY 23 JAN 23400 PE',
    quantity: 50,
    trigger_price: 140.25,
    limit_price: 0,
    order_type: 'STOP_LOSS_MARKET',
    transaction_type: 'SELL',
    status: 'PENDING',
    create_time: '2026-01-21 10:22:10',
    security_id: '52180',
    buy_price: 142.25,
    points: -2.00,
    potential_pl: -100.00,
  },
  // Limit order (TP) for TCS
  {
    order_id: 'ORD006',
    symbol: 'TCS',
    quantity: 5,
    trigger_price: 0,
    limit_price: 3942.50,
    order_type: 'LIMIT',
    transaction_type: 'SELL',
    status: 'PENDING',
    create_time: '2026-01-21 11:05:45',
    security_id: '11536',
    buy_price: 3912.50,
    points: 30.00,
    potential_pl: 150.00,
  },
];

// Helper function to get current position (first F&O position or first position)
export function getMockCurrentPosition(): OrderDetails | null {
  if (mockOrderDetails.length === 0) return null;
  
  const fnoPosition = mockOrderDetails.find(p => 
    ['NSE_FNO', 'BSE_FNO', 'MCX_COMM'].includes(p.exchange_segment)
  );
  
  return fnoPosition || mockOrderDetails[0];
}

// Helper function to get pending orders for a specific position
export function getMockPendingOrdersForPosition(securityId: string): PendingSLOrder[] {
  return mockPendingOrders.filter(order => order.security_id === securityId);
}

// Helper function to simulate order placement response
export function generateMockOrderId(): string {
  return `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Mock successful order placement response
export function getMockOrderPlacementSuccess(orderType: string = 'LIMIT', limitPrice: number = 0) {
  return {
    success: true,
    order_id: generateMockOrderId(),
    order_status: 'PENDING',
    buy_price: mockOrderDetails[0]?.buy_price,
    limit_price: limitPrice,
    trigger_price: limitPrice - 2,
    symbol: mockOrderDetails[0]?.symbol,
    quantity: mockOrderDetails[0]?.quantity,
    is_updated: false,
  };
}

// Mock successful order cancellation response
export function getMockOrderCancellationSuccess(orderId: string) {
  return {
    success: true,
    message: `Order ${orderId} cancelled successfully`,
    order_id: orderId,
  };
}

// Mock successful position exit response
export function getMockPositionExitSuccess() {
  return {
    success: true,
    message: 'Position exited and all pending orders cancelled successfully',
    errors: [],
  };
}

// Mock order book data
export function getMockOrderBook() {
  return {
    success: true,
    orders: [
      {
        orderId: 'ORD001',
        orderStatus: 'PENDING',
        transactionType: 'SELL',
        exchangeSegment: 'NSE_FNO',
        productType: 'INTRADAY',
        orderType: 'STOP_LOSS_MARKET',
        tradingSymbol: 'NIFTY 23 JAN 23500 CE',
        securityId: '52175',
        quantity: 50,
        price: 0,
        triggerPrice: 183.50,
        createTime: '2026-01-21 09:30:15',
      },
      {
        orderId: 'ORD002',
        orderStatus: 'PENDING',
        transactionType: 'SELL',
        exchangeSegment: 'NSE_FNO',
        productType: 'INTRADAY',
        orderType: 'LIMIT',
        tradingSymbol: 'NIFTY 23 JAN 23500 CE',
        securityId: '52175',
        quantity: 50,
        price: 197.50,
        triggerPrice: 0,
        createTime: '2026-01-21 09:32:45',
      },
    ],
  };
}

// Mock trade book data
export function getMockTradeBook() {
  return {
    success: true,
    trades: [
      {
        tradeId: 'TRD001',
        orderId: 'BUY001',
        symbol: 'NIFTY 23 JAN 23500 CE',
        transactionType: 'BUY',
        quantity: 50,
        price: 185.50,
        tradeTime: '2026-01-21 09:25:30',
      },
      {
        tradeId: 'TRD002',
        orderId: 'BUY002',
        symbol: 'BANKNIFTY 23 JAN 48000 PE',
        transactionType: 'BUY',
        quantity: 30,
        price: 295.75,
        tradeTime: '2026-01-21 09:40:15',
      },
    ],
  };
}

// Mock LTP (Last Traded Price) data
export function getMockLTP(securityId: string) {
  const ltpMap: Record<string, number> = {
    '52175': 194.00, // NIFTY Call - in profit
    '41234': 285.25, // BANKNIFTY Put - in loss
    '52180': 143.75, // NIFTY Put - small profit
    '1333': 2864.00, // Reliance - in profit
    '11536': 3900.00, // TCS - in loss
  };

  return {
    success: true,
    data: {
      NSE_FNO: {
        [securityId]: {
          last_price: ltpMap[securityId] || 0,
        },
      },
      NSE_EQ: {
        [securityId]: {
          last_price: ltpMap[securityId] || 0,
        },
      },
    },
  };
}
