# Stop-Loss Order Type Fix

## Problem

When placing a "SL-Limit -19.5" order **below** the market price (e.g., trigger at ₹1279.2 when market is ₹1298.7), the order was executing **immediately** instead of waiting for the price to fall.

### Root Cause

The app was using a **LIMIT order** for stop-loss functionality:

- A SELL LIMIT order at ₹1279.2 means "sell at ₹1279.2 **or better**"
- Since market is at ₹1298.7, you can sell above ₹1279.2 right now
- Order executes immediately instead of waiting

## Solution

Changed "SL-Limit -19.5" button to use **STOP_LOSS_MARKET** order type:

- Trigger Price: ₹1279.2 (buy_price - 19.5)
- Order only triggers when price **falls to** ₹1279.2
- Then executes at **market price** for guaranteed fill

## Order Types in the App

### 1. **SL Limit +4** (Protective Stop-Loss Above Buy)

- **Type**: LIMIT order
- **Purpose**: Quick exit slightly above buy price
- **Behavior**: Executes immediately if price is above limit
- **Use Case**: Lock in small profit or break-even exit

### 2. **🛡️ SL-Market -19.5** (Main Stop-Loss Below Buy)

- **Type**: STOP_LOSS_MARKET order ✅ **FIXED**
- **Purpose**: Protect against large losses
- **Behavior**: Only triggers when price falls to trigger level
- **Use Case**: Safety net for downside protection

### 3. **TP +offset** (Take Profit Above Buy)

- **Type**: LIMIT order
- **Purpose**: Lock in profits at target price
- **Behavior**: Executes when price reaches or exceeds limit
- **Use Case**: Sell at profit target

## Technical Changes

### 1. Modified `placeMainStopLossOrder()` function in `page.tsx`

```typescript
// OLD: Used handleOrderAction() → placeLimitOrder()
const placeMainStopLossOrder = () => {
  const offset = -(Number(process.env.NEXT_PUBLIC_SL_OFFSET_LOSS) || 20);
  handleOrderAction(offset, false, "Main SL");
};

// NEW: Direct STOP_LOSS_MARKET order placement
const placeMainStopLossOrder = async () => {
  // ... validation code ...

  const offset = -(Number(process.env.NEXT_PUBLIC_SL_OFFSET_LOSS) || 20);
  const triggerPrice = Number((positionData.buy_price + offset).toFixed(1));

  // Cancel any existing order first (single-order policy)
  const existingOrder = findAnyExistingLimitOrder();
  if (existingOrder) {
    await apiService.cancelSLOrder(existingOrder.order_id);
  }

  // Place STOP_LOSS_MARKET order
  const response = await apiService.placeStopLossMarketOrder({
    trigger_price: triggerPrice,
    position_data: positionData,
  });
};
```

### 2. Added method to `api.ts`

```typescript
async placeStopLossMarketOrder(options: {
  trigger_price: number;
  position_data: PositionData;
}): Promise<PlaceSLOrderResponse> {
  return this.request<PlaceSLOrderResponse>('/api/place-sl-market-order', {
    method: 'POST',
    body: JSON.stringify({
      trigger_price: options.trigger_price,
    }),
  });
}
```

### 3. Updated UI Labels

- Button: "🔻 SL-Limit -19.5" → "🛡️ SL-Market -19.5"
- Section Header: "🔻 SL-Limit Order" → "🛡️ SL-Market Order"
- Description: Updated to mention "triggers at" and "executes at MARKET price"

## Testing

### Before Fix

1. Buy at ₹1298.7
2. Click "SL-Limit -19.5"
3. Order at ₹1279.2 executes **immediately** ❌
4. Position closed even though price is still at ₹1298.7

### After Fix

1. Buy at ₹1298.7
2. Click "🛡️ SL-Market -19.5"
3. STOP_LOSS_MARKET order placed with trigger at ₹1279.2 ✅
4. Order shows as "PENDING" until price falls to ₹1279.2
5. Only executes when price actually reaches trigger level

## Important Notes

### Why Not Use STOP_LOSS (Stop-Loss Limit)?

- STOP_LOSS_MARKET guarantees execution (fills at market)
- STOP_LOSS (limit) might not fill if price gaps below limit
- For protective stop-loss, you want guaranteed exit

### Single-Order Policy

- The app maintains only ONE order per position at a time
- Clicking "SL-Market" will cancel any existing TP or SL order
- This prevents confusion with multiple orders

### Order Status in Pending Orders

- STOP_LOSS_MARKET orders show as "SL-Market" (green badge)
- LIMIT orders show as "Limit" (purple badge) for TP/SL Limit +4
- Easy to identify which type of protection is active

## API Endpoints Used

- **POST** `/api/place-sl-market-order` - Places STOP_LOSS_MARKET order
- **POST** `/api/place-limit-order` - Places LIMIT order (for TP and SL +4)
- **PUT** `/api/update-limit-order` - Updates LIMIT orders (cancel + replace)
- **DELETE** `/api/cancel-sl-order` - Cancels any order

## Files Modified

1. `/src/app/page.tsx` - Modified `placeMainStopLossOrder()`, updated UI labels
2. `/src/services/api.ts` - Added `placeStopLossMarketOrder()` method
3. Button labels and section headers updated to reflect SL-Market

---

**Status**: ✅ Fixed and tested
**Date**: January 20, 2026
