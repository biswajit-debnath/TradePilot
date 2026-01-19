// Type definitions for TradePilot

export interface DhanOrder {
  dhanClientId: string;
  orderId: string;
  correlationId?: string;
  orderStatus: 'TRANSIT' | 'PENDING' | 'REJECTED' | 'CANCELLED' | 'TRADED' | 'EXPIRED' | 'PART_TRADED' | 'TRIGGERED';
  transactionType: 'BUY' | 'SELL';
  exchangeSegment: string;
  productType: string;
  orderType: 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'STOP_LOSS_MARKET';
  validity: 'DAY' | 'IOC';
  tradingSymbol: string;
  securityId: string;
  quantity: number;
  disclosedQuantity: number;
  price: number;
  triggerPrice: number;
  afterMarketOrder: boolean;
  boProfitValue: number;
  boStopLossValue: number;
  legName?: string;
  createTime: string;
  updateTime: string;
  exchangeTime: string;
  drvExpiryDate: string | null;
  drvOptionType: 'CALL' | 'PUT' | 'NA' | null;
  drvStrikePrice: number;
  omsErrorCode: string | null;
  omsErrorDescription: string | null;
  algoId?: string;
  remainingQuantity: number;
  averageTradedPrice: number;
  filledQty: number;
}

// Position Details Interface
export interface PositionDetails {
  position_id: string;
  symbol: string;
  category: 'OPTION' | 'STOCK';
  option_type: 'CALL' | 'PUT' | null;
  strike_price: number;
  expiry_date: string;
  quantity: number;
  buy_price: number;
  sl_trigger_price: number;
  sl_offset: number;
  security_id: string;
  exchange_segment: string;
  product_type: string;
  unrealized_profit?: number;
  realized_profit?: number;
}

// Backwards compatibility - kept for existing code
export interface OrderDetails {
  order_id: string;
  symbol: string;
  order_category: 'OPTION' | 'STOCK';
  option_type: 'CALL' | 'PUT' | null;
  strike_price: number;
  expiry_date: string;
  quantity: number;
  buy_price: number;
  sl_trigger_price: number;
  sl_offset: number;
  security_id: string;
  exchange_segment: string;
  product_type: string;
  unrealized_profit?: number;
  realized_profit?: number;
}

export interface PendingSLOrder {
  order_id: string;
  symbol: string;
  quantity: number;
  trigger_price: number;
  order_type: string;
  transaction_type: string;
  status: string;
  create_time: string;
}

export interface ConnectionStatus {
  success: boolean;
  client_id?: string;
  token_validity?: string;
  active_segments?: string;
  error?: string;
}

export interface PlaceSLOrderResponse {
  success: boolean;
  order_id?: string;
  order_status?: string;
  buy_price?: number;
  trigger_price?: number;
  limit_price?: number;
  symbol?: string;
  quantity?: number;
  error?: string;
}

export interface PlaceOrderRequest {
  dhanClientId: string;
  correlationId?: string;
  transactionType: 'BUY' | 'SELL';
  exchangeSegment: string;
  productType: string;
  orderType: 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'STOP_LOSS_MARKET';
  validity: 'DAY' | 'IOC';
  securityId: string;
  quantity: string;
  disclosedQuantity?: string;
  price?: string;
  triggerPrice?: string;
  afterMarketOrder?: boolean;
  amoTime?: string;
  boProfitValue?: string;
  boStopLossValue?: string;
}

export interface DhanProfile {
  dhanClientId: string;
  tokenValidity: string;
  activeSegment: string;
  ddpi: string;
  mtf: string;
  dataPlan: string;
  dataValidity: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
