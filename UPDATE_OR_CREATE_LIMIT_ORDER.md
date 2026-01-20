# Update or Create Limit Order Feature

## Overview
This feature implements smart order management that automatically detects existing limit orders and updates them instead of creating duplicates. This ensures you only have one active limit order at a time for your position.

## How It Works

### User Flow
1. User clicks any of the three buttons:
   - **SL Limit +2** (Protective order at buy price + 2)
   - **SL Limit -20** (Main stop loss at buy price - 20)
   - **TP Limit +12** (Take profit at buy price + 12)

2. The system performs the following checks:
   - ✅ Checks if there's an open position
   - ✅ Checks if there's already a pending LIMIT order for that position
   - ✅ If existing order found → **Updates** the limit price to the new value
   - ✅ If no order found → **Creates** a new limit order

3. User gets clear feedback:
   - 🔄 "Updated Limit Order!" - when an existing order is modified
   - ✅ "Created Limit Order!" - when a new order is placed

## Technical Implementation

### New Files Created

#### `/src/app/api/update-limit-order/route.ts`
- **Purpose**: Main API endpoint that handles the update-or-create logic
- **Key Features**:
  - Fetches the current open position
  - Calculates limit price based on offset (buy price + offset)
  - Searches for existing pending LIMIT orders
  - Updates existing order or creates new one accordingly
  - Returns `is_updated` flag to indicate action taken

### Modified Files

#### `/src/services/api.ts`
- **Added**: `updateOrCreateLimitOrder()` method
  - Central method that calls the new API endpoint
  - Accepts offset and is_tp parameters
  
- **Updated**: All three order placement methods now use `updateOrCreateLimitOrder()`:
  - `placeProtectiveLimitOrder()` - SL +2
  - `placeMainStopLossOrder()` - SL -20
  - `placeTakeProfitOrder()` - TP +12

#### `/src/app/page.tsx`
- **Updated**: All three button handlers to show appropriate messages:
  - Shows "🔄 Updated" when order is modified
  - Shows "✅ Created" when order is newly placed
  - Both messages include Order ID and Limit Price

#### `/src/types/index.ts`
- **Updated**: `PlaceSLOrderResponse` interface
  - Added optional `is_updated?: boolean` field
  - Indicates whether the order was updated or created

## Benefits

### 1. **No Duplicate Orders**
- Prevents multiple limit orders from accumulating
- Only one active limit order per position at any time

### 2. **Easy Price Adjustment**
- Click any button multiple times to adjust the limit price
- No need to manually cancel and recreate orders

### 3. **Clear Feedback**
- User always knows if order was updated or created
- Provides confidence that the system is working correctly

### 4. **Better Order Management**
- Reduces clutter in order book
- Easier to track active positions and orders

## Example Scenarios

### Scenario 1: First Time Order Placement
```
1. Buy position at ₹100
2. Click "SL Limit +2" button
3. Result: ✅ "Created Limit Order! Order ID: 123456 | Limit Price: ₹102"
```

### Scenario 2: Changing from SL to TP
```
1. Existing SL limit order at ₹102
2. Click "TP Limit +12" button
3. Result: 🔄 "Updated Limit Order! Order ID: 123456 | Limit Price: ₹112"
   (Same order ID, new limit price)
```

### Scenario 3: Adjusting Existing Order
```
1. Existing TP limit order at ₹112
2. Click "SL Limit -20" button
3. Result: 🔄 "Updated Limit Order! Order ID: 123456 | Limit Price: ₹80"
   (Adjusted from profit target to stop loss)
```

## API Flow

```
┌─────────────────┐
│  User clicks    │
│  SL/TP button   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Frontend: page.tsx      │
│ placeProtectiveLimitOrder() │
│ placeMainStopLossOrder()    │
│ placeTakeProfitOrder()      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ API Service: api.ts     │
│ updateOrCreateLimitOrder() │
└────────┬────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ API Route:                   │
│ /api/update-limit-order      │
├──────────────────────────────┤
│ 1. Get open position         │
│ 2. Calculate limit price     │
│ 3. Check pending orders      │
│ 4. Update OR Create order    │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Dhan API Service         │
│ modifyOrder() OR         │
│ placeLimitOrder()        │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Dhan Trading Platform    │
│ Order executed/updated   │
└──────────────────────────┘
```

## Order Detection Logic

The system identifies existing limit orders using these criteria:
- ✅ Transaction Type: `SELL` (exit order)
- ✅ Order Type: `LIMIT` (not STOP_LOSS or MARKET)
- ✅ Security ID matches current position
- ✅ Order Status: `PENDING` or `TRANSIT`

If all criteria match → **Update** the existing order
If no match found → **Create** a new order

## Important Notes

1. **Single Order Policy**: Only one limit order can be active per position
2. **Automatic Override**: Clicking any button will update the existing order to the new price
3. **No Confirmation**: Updates happen automatically without confirmation prompts
4. **Same Order ID**: When updating, the order ID remains the same (only price changes)
5. **Flexibility**: You can switch between SL and TP strategies instantly

## Future Enhancements

Possible improvements:
- [ ] Allow multiple limit orders with different strategies
- [ ] Add confirmation dialog before updating existing orders
- [ ] Show preview of price change before executing update
- [ ] Track order history (created/updated timestamps)
- [ ] Add manual override to force new order creation
