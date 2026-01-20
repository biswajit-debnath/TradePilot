# SL-Limit Order Feature Documentation

## Overview
Added a new button to place Stop Loss Limit (SL-L) orders at **Buy Price - 20** points, providing wider stop loss protection for options trading.

## What's New

### 1. New SL-Limit Order Type
- **Trigger Price**: Buy Price - 20
- **Limit Price**: Buy Price - 21 (1 point below trigger for better execution)
- **Order Type**: `STOP_LOSS` (SL-L in Dhan API)

### 2. Changes Made

#### Backend Changes:

**`/src/lib/dhan-api.ts`**
- Added `placeStopLossLimitOrder()` method
- Accepts both `triggerPrice` and `price` parameters
- Uses `orderType: 'STOP_LOSS'` for SL-Limit orders

**`/src/app/api/place-sl-limit-order/route.ts`**
- New API route for placing SL-Limit orders
- Calculates: trigger = buyPrice - 20, limit = trigger - 1
- Returns order details with both trigger and limit prices

**`/src/services/api.ts`**
- Added `placeDeepStopLossOrder()` method
- Calls `/api/place-limit-order` endpoint

**`/src/types/index.ts`**
- Updated `PlaceSLOrderResponse` interface
- Added optional `limit_price` field

#### Frontend Changes:

**`/src/app/page.tsx`**
- Added new `placeDeepStopLossOrder()` function
- Added new button "🔻 Place SL-Limit Order (Buy - 20)"
  - Orange-red gradient styling
  - Shows trigger and limit price in success message
- Updated "How It Works" section with two subsections:
  - 🛡️ SL-Market Order (Buy + 2) - Green section
  - 🔻 SL-Limit Order (Buy - 20) - Orange section

## Usage

### Example Scenario:
1. You buy an option at ₹100
2. Click "🔻 Place SL-Limit Order (Buy - 20)"
3. System places SL-L order:
   - **Trigger Price**: ₹80 (100 - 20)
   - **Limit Price**: ₹79 (80 - 1)
4. If price falls to ₹80, order triggers and attempts to sell at ₹79 or better

## Comparison: SL-M vs SL-L

| Feature | SL-M (Buy + 2) | SL-L (Buy - 20) |
|---------|----------------|-----------------|
| **Trigger** | Buy + 2 | Buy - 20 |
| **Execution** | At market price | At limit price (or better) |
| **Use Case** | Quick exit, tight stop | Wider protection, controlled exit |
| **Risk** | Might execute at any price | Might not execute if price gaps down |
| **Best For** | Locking small profits | Protecting from large losses |

## API Reference

### Dhan API Order Types:
- **STOP_LOSS_MARKET**: Only needs `triggerPrice`, executes at market
- **STOP_LOSS**: Needs both `triggerPrice` and `price` (limit)

### Endpoint:
```
POST /api/place-sl-limit-order
```

### Response:
```json
{
  "success": true,
  "order_id": "123456789",
  "order_status": "PENDING",
  "buy_price": 100,
  "trigger_price": 80,
  "limit_price": 79,
  "symbol": "NIFTY 17 JAN 24000 CE",
  "quantity": 50
}
```

## Notes
- Both order types work independently
- You can place both SL-M and SL-L orders for the same position
- Ensure your buy price is > 21 to avoid negative prices
- SL-Limit offers price protection but no execution guarantee
- SL-Market guarantees execution but not price
