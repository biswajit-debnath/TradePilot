# Mock Data Feature Guide

## Overview

The TradePilot application now includes a **Mock Data Mode** that allows you to test and develop UI/UX features when the market is closed or when you don't have access to real trading data.

## How It Works

The mock data system provides realistic trading data including:

- Multiple open positions (Options & Stocks)
- Pending orders (SL-Market, SL-Limit, Limit/TP orders)
- Connection status
- Simulated API responses with realistic delays

### Architecture

```
┌─────────────────────────────────────────────┐
│         Environment Variable                │
│    NEXT_PUBLIC_USE_MOCK_DATA=true          │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│          API Service (api.ts)               │
│   ┌─────────────────────────────────────┐   │
│   │  if (USE_MOCK_DATA)                │   │
│   │    return mockApiService.method()   │   │
│   │  else                               │   │
│   │    return realApiService.method()   │   │
│   └─────────────────────────────────────┘   │
└──────────────────┬──────────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
┌─────────────────┐  ┌──────────────────┐
│  Mock API       │  │  Real API        │
│  (mock-api.ts)  │  │  (Next.js Routes)│
└────────┬────────┘  └──────────────────┘
         │
         ▼
┌─────────────────┐
│  Mock Data      │
│  (mock-data.ts) │
└─────────────────┘
```

## Quick Start

### Enable Mock Data Mode

1. Open `.env.local` file
2. Set the environment variable:
   ```bash
   NEXT_PUBLIC_USE_MOCK_DATA=true
   ```
3. Restart your development server

### Disable Mock Data Mode

1. Open `.env.local` file
2. Set the environment variable to false:
   ```bash
   NEXT_PUBLIC_USE_MOCK_DATA=false
   ```
3. Restart your development server

## Mock Data Contents

### Positions (5 positions)

1. **NIFTY 23 JAN 23500 CE** (Call Option - Profitable)
   - Quantity: 50
   - Buy Price: ₹185.50
   - Current Profit: ₹425.00
   - Security ID: 52175

2. **BANKNIFTY 23 JAN 48000 PE** (Put Option - Loss)
   - Quantity: 30
   - Buy Price: ₹295.75
   - Current Loss: -₹315.00
   - Security ID: 41234

3. **NIFTY 23 JAN 23400 PE** (Put Option - Breakeven)
   - Quantity: 50
   - Buy Price: ₹142.25
   - Current Profit: ₹75.00
   - Security ID: 52180

4. **RELIANCE** (Stock - Profitable)
   - Quantity: 10
   - Buy Price: ₹2845.30
   - Current Profit: ₹187.00
   - Security ID: 1333

5. **TCS** (Stock - Small Loss)
   - Quantity: 5
   - Buy Price: ₹3912.50
   - Current Loss: -₹62.50
   - Security ID: 11536

### Pending Orders (6 orders)

1. **SL-Market** for NIFTY Call (Trigger: ₹183.50)
2. **Limit (TP)** for NIFTY Call (₹197.50, +₹600 potential)
3. **SL-Limit** for BANKNIFTY Put (Trigger: ₹275.75)
4. **Limit (TP)** for Reliance (₹2875.30, +₹300 potential)
5. **SL-Market** for NIFTY Put (Trigger: ₹140.25)
6. **Limit (TP)** for TCS (₹3942.50, +₹150 potential)

### Connection Status

- Client ID: 1234567890
- Token Validity: 2026-01-22 09:15:00
- Active Segments: NSE_EQ, NSE_FNO, BSE_EQ

## Files Structure

```
src/
├── lib/
│   └── mock-data.ts           # Mock data definitions
├── services/
│   ├── api.ts                 # Main API service (with conditional routing)
│   └── mock-api.ts            # Mock API implementation
└── .env.local                 # Environment configuration
```

### File Descriptions

#### `src/lib/mock-data.ts`

Contains all mock data definitions including:

- Mock positions (Options & Stocks)
- Mock pending orders
- Mock connection status
- Helper functions for generating mock responses
- Mock LTP (Last Traded Price) data

#### `src/services/mock-api.ts`

Implements a mock API service that:

- Mirrors the real API service interface
- Returns mock data with simulated delays
- Logs operations with 🎭 emoji for easy identification
- Maintains consistency with real API response structure

#### `src/services/api.ts`

Main API service with conditional routing:

- Checks `NEXT_PUBLIC_USE_MOCK_DATA` flag
- Routes to mock or real API based on flag
- Transparent to rest of application
- No changes needed in components/hooks

## Benefits

✅ **UI/UX Development** - Test layouts with realistic data  
✅ **Market Closed Testing** - Develop anytime, not just during market hours  
✅ **No API Calls** - Save API rate limits during development  
✅ **Consistent Testing** - Same data every time for reproducible tests  
✅ **Zero Component Changes** - Works with existing code  
✅ **Type Safe** - Uses same TypeScript interfaces  
✅ **Realistic Delays** - Simulates network latency

## Testing Different Scenarios

### Test Multiple Positions

Mock data includes 5 positions - the UI should show a dropdown to switch between them.

### Test Pending Orders

Each position has associated pending orders to test the pending orders card.

### Test Profit/Loss Display

Positions have varying P&L values (positive, negative, near-zero) to test styling.

### Test Different Order Types

- SL-Market orders
- SL-Limit orders
- Limit orders (Take Profit)

### Test Actions

All actions (place order, cancel order, exit position) work in mock mode:

- They return success responses
- Generate mock order IDs
- Simulate realistic delays

## Console Indicators

When mock data mode is active, you'll see:

```
🎭 Using MOCK data mode
🎭 [MOCK] Verifying connection...
🎭 [MOCK] Fetching all positions...
🎭 [MOCK] Fetching pending orders...
🎭 [MOCK] Placing limit order...
```

The 🎭 emoji makes it easy to identify mock operations in the console.

## Customizing Mock Data

### Adding More Positions

Edit `src/lib/mock-data.ts` and add to `mockPositions` array:

```typescript
{
  position_id: 'POS006',
  symbol: 'INFY',
  category: 'STOCK',
  option_type: null,
  strike_price: 0,
  expiry_date: '',
  quantity: 20,
  buy_price: 1450.50,
  sl_trigger_price: 1430.50,
  sl_offset: 20,
  security_id: '1594',
  exchange_segment: 'NSE_EQ',
  product_type: 'INTRADAY',
  unrealized_profit: 250.00,
  realized_profit: 0,
}
```

### Adding More Pending Orders

Add to `mockPendingOrders` array in `src/lib/mock-data.ts`:

```typescript
{
  order_id: 'ORD007',
  symbol: 'INFY',
  quantity: 20,
  trigger_price: 1430.50,
  limit_price: 0,
  order_type: 'STOP_LOSS_MARKET',
  transaction_type: 'SELL',
  status: 'PENDING',
  create_time: '2026-01-21 11:30:00',
  security_id: '1594',
  buy_price: 1450.50,
  points: -20.00,
  potential_pl: -400.00,
}
```

### Adjusting Simulated Delays

Edit delay values in `src/services/mock-api.ts`:

```typescript
const simulateDelay = (ms: number = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));
```

## Troubleshooting

### Mock data not working?

1. Check `.env.local` has `NEXT_PUBLIC_USE_MOCK_DATA=true`
2. Restart the development server (required after env changes)
3. Clear browser cache and reload
4. Check console for 🎭 indicators

### Seeing real API errors in mock mode?

- Ensure you restarted the dev server after changing `.env.local`
- Check that the flag is `NEXT_PUBLIC_USE_MOCK_DATA` (with `NEXT_PUBLIC_` prefix)

### Want to test with partial mock data?

You can modify `src/services/api.ts` to mock only specific endpoints while keeping others real.

## Best Practices

1. **Always use mock mode during UI development** to preserve API rate limits
2. **Switch to real mode** before production testing
3. **Keep mock data realistic** - use actual price ranges and formats
4. **Update mock data** when adding new fields or changing data structures
5. **Test both modes** before deploying to ensure consistency

## Production Usage

⚠️ **IMPORTANT**: Mock data mode is for development only!

Before deploying to production:

1. Set `NEXT_PUBLIC_USE_MOCK_DATA=false` in production environment
2. Ensure real API credentials are configured
3. Test thoroughly with real data
4. Never commit `.env.local` with real credentials to version control

## Summary

The mock data feature provides a complete, realistic trading environment for UI/UX development without requiring live market access or consuming API rate limits. It's fully type-safe, transparent to the application, and easy to toggle on/off via a simple environment variable.

Happy coding! 🚀
