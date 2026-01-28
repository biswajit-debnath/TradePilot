// Dhan API Configuration
// Get these from https://web.dhan.co/ -> My Profile -> Access DhanHQ APIs

export const DHAN_CONFIG = {
  // Your Dhan Client ID
  CLIENT_ID: process.env.NEXT_PUBLIC_DHAN_CLIENT_ID || 'YOUR_DHAN_CLIENT_ID',
  
  // Your Access Token (generate from web.dhan.co - valid for 24 hours)
  // ⚠️ TEMPORARY: Using NEXT_PUBLIC_ for local WebSocket development
  // 🔴 TODO: Move to server-side proxy before production deployment
  ACCESS_TOKEN: process.env.NEXT_PUBLIC_DHAN_ACCESS_TOKEN || process.env.DHAN_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN',
  
  // Dhan API Base URL
  BASE_URL: process.env.NODE_ENV === 'production' || true ? 'https://api.dhan.co/v2' : 'https://sandbox.dhan.co/v2',

  // Stop Loss offset (points above buy price)
  TP_OFFSET: Number(process.env.NEXT_PUBLIC_PP_OFFSET) || 2.0,
  
  // Default lot size for F&O positions
  DEFAULT_LOT_SIZE: Number(process.env.NEXT_PUBLIC_DEFAULT_LOT_SIZE) || 1,
};

// Exchange Segments
export const EXCHANGE_SEGMENTS = {
  NSE_EQ: 'NSE_EQ',
  NSE_FNO: 'NSE_FNO',
  BSE_EQ: 'BSE_EQ',
  BSE_FNO: 'BSE_FNO',
  MCX_COMM: 'MCX_COMM',
} as const;

// Order Types
export const ORDER_TYPES = {
  MARKET: 'MARKET',
  LIMIT: 'LIMIT',
  STOP_LOSS: 'STOP_LOSS',
  STOP_LOSS_MARKET: 'STOP_LOSS_MARKET',
} as const;

// Transaction Types
export const TRANSACTION_TYPES = {
  BUY: 'BUY',
  SELL: 'SELL',
} as const;

// Product Types
export const PRODUCT_TYPES = {
  CNC: 'CNC',
  INTRADAY: 'INTRADAY',
  MARGIN: 'MARGIN',
  MTF: 'MTF',
  CO: 'CO',
  BO: 'BO',
} as const;

// Order Status
export const ORDER_STATUS = {
  TRANSIT: 'TRANSIT',
  PENDING: 'PENDING',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  TRADED: 'TRADED',
  EXPIRED: 'EXPIRED',
} as const;
