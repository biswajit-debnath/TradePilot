# Intraday Stocks Support Feature

## Overview
Extended the application to support **both Options and Intraday Stocks**, making it a comprehensive SL order management tool for all intraday trading needs.

## What Changed

### Previously: Options Only
- ✅ CALL/PUT options in NSE_FNO, BSE_FNO, MCX_COMM
- ❌ No support for intraday equity stocks

### Now: Options + Intraday Stocks
- ✅ CALL/PUT options in NSE_FNO, BSE_FNO, MCX_COMM
- ✅ **Intraday stocks in NSE_EQ, BSE_EQ** (NEW!)

## Implementation Details

### 1. Backend Changes (`dhan-api.ts`)

**New Function: `getLastTradedBuyOrder()`**
```typescript
async getLastTradedBuyOrder(): Promise<DhanOrder | null>
```
- Fetches the last traded BUY order
- Includes:
  - Options: NSE_FNO, BSE_FNO, MCX_COMM with CALL/PUT type
  - Intraday Stocks: NSE_EQ, BSE_EQ with productType === 'INTRADAY'
- Sorts by `updateTime` to get the most recent

**Backwards Compatibility:**
- Old `getLastTradedOptionBuyOrder()` still works
- Now internally calls `getLastTradedBuyOrder()`

### 2. API Route Changes (`last-option-order/route.ts`)

**New Helper Functions:**
```typescript
getOptionType() // Returns CALL, PUT, or null (for stocks)
getOrderCategory() // Returns 'OPTION' or 'STOCK'
```

**Enhanced Response:**
```json
{
  "success": true,
  "order": {
    "order_id": "123456789",
    "symbol": "RELIANCE",
    "order_category": "STOCK",  // NEW!
    "option_type": null,        // null for stocks
    "strike_price": 0,          // 0 for stocks
    "expiry_date": "",          // empty for stocks
    "quantity": 100,
    "buy_price": 2500.50,
    "sl_trigger_price": 2502.50,
    ...
  }
}
```

### 3. Type Updates (`types/index.ts`)

**Updated `OrderDetails` Interface:**
```typescript
export interface OrderDetails {
  order_id: string;
  symbol: string;
  order_category: 'OPTION' | 'STOCK';  // NEW!
  option_type: 'CALL' | 'PUT' | null;  // null for stocks
  strike_price: number;                // 0 for stocks
  expiry_date: string;                 // empty for stocks
  quantity: number;
  buy_price: number;
  sl_trigger_price: number;
  sl_offset: number;
  security_id: string;
  exchange_segment: string;
  product_type: string;
}
```

### 4. UI Changes (`page.tsx`)

**Dynamic Title:**
```
📊 Last Traded Order (OPTION)
📊 Last Traded Order (STOCK)
```

**Smart Card Display:**

For **Options:**
```
┌─────────────────────┬─────────────────────┐
│ Symbol: NIFTY 24000 │ Category: 📊 Option │
├─────────────────────┼─────────────────────┤
│ Type: CALL          │ Strike: ₹24000      │
├─────────────────────┼─────────────────────┤
│ Quantity: 50        │ Buy Price: ₹100     │
├─────────────────────┼─────────────────────┤
│ SL Trigger: ₹102    │                     │
└─────────────────────┴─────────────────────┘
```

For **Stocks:**
```
┌─────────────────────┬─────────────────────┐
│ Symbol: RELIANCE    │ Category: 📈 Stock  │
├─────────────────────┴─────────────────────┤
│ Product Type: INTRADAY                    │
├─────────────────────┬─────────────────────┤
│ Quantity: 100       │ Buy Price: ₹2500    │
├─────────────────────┼─────────────────────┤
│ SL Trigger: ₹2502   │                     │
└─────────────────────┴─────────────────────┘
```

**Updated Messages:**
- Header: "Quick Stop Loss Orders for **Options & Intraday Stocks**"
- Empty state: "Place a BUY order in Dhan (**Options or Intraday Stocks**)"
- How it works: "Place a BUY order in Dhan (**Options or Intraday Stocks**)"

## Filter Logic

### What Gets Included:

#### Options ✅
- **Exchange Segments**: NSE_FNO, BSE_FNO, MCX_COMM
- **Transaction**: BUY
- **Status**: TRADED
- **Validation**: 
  - NSE/BSE: `drvOptionType` = CALL or PUT
  - MCX: Trading symbol contains 'CE' or 'PE'

#### Intraday Stocks ✅
- **Exchange Segments**: NSE_EQ, BSE_EQ
- **Transaction**: BUY
- **Status**: TRADED
- **Product Type**: INTRADAY
- **Note**: Only intraday, not CNC/delivery

### What Gets Excluded:

❌ CNC/Delivery stock orders (productType = 'CNC')
❌ SELL orders
❌ Pending/Rejected orders
❌ Futures contracts (no option type)
❌ Currency pairs
❌ Commodity futures (only commodity options included)

## Usage Examples

### Example 1: Option Order
```
Buy: NIFTY 24000 CE @ ₹100
Category: OPTION
Type: CALL
SL-M: Places at ₹102
SL-L: Places at ₹80 trigger, ₹79 limit
```

### Example 2: Intraday Stock Order
```
Buy: RELIANCE @ ₹2500 (Intraday)
Category: STOCK
SL-M: Places at ₹2502
SL-L: Places at ₹2480 trigger, ₹2479 limit
```

### Example 3: MCX Option Order
```
Buy: CRUDEOIL 6000 CE @ ₹50
Category: OPTION
Type: CALL (extracted from symbol)
SL-M: Places at ₹52
SL-L: Places at ₹30 trigger, ₹29 limit
```

## Benefits

### 1. **Unified Experience**
- Single interface for all intraday trading
- Same SL logic works for both options and stocks

### 2. **Flexibility**
- Day traders can manage stocks and options together
- No need to switch between different tools

### 3. **Risk Management**
- Apply consistent SL strategy across all positions
- Protect both option and stock positions

### 4. **Time Saving**
- Quick SL placement for any intraday position
- Automated trigger price calculation

## Important Notes

⚠️ **Key Points:**

1. **Intraday Only**: Only fetches stocks with `productType = 'INTRADAY'`
   - CNC/Delivery orders are excluded
   - This is by design for day trading focus

2. **Most Recent Order**: Always picks the latest traded order
   - Sorted by `updateTime`
   - Could be option or stock, whichever is most recent

3. **SL Offsets Apply to Both**:
   - SL-M: Buy + 2 (works for ₹2 stocks and ₹200 stocks)
   - SL-L: Buy - 20 (might be large for low-priced stocks)

4. **Exit All**: Works for both options and stocks
   - Closes all positions regardless of type
   - Cancels all pending orders

## Testing Checklist

✅ Test with NSE FNO option order
✅ Test with BSE FNO option order
✅ Test with MCX option order
✅ Test with NSE EQ intraday stock
✅ Test with BSE EQ intraday stock
✅ Verify CNC stock orders are excluded
✅ Verify most recent order is selected
✅ Test SL-M order for stock
✅ Test SL-L order for stock
✅ Test Exit All with mixed positions

## Future Enhancements (Optional)

1. **Filter by Type**: Add option to show only options or only stocks
2. **Multiple Orders View**: Show last 5 orders instead of just 1
3. **CNC Support**: Add option to include delivery orders
4. **Custom SL for Stocks**: Different SL offset for low-priced stocks
5. **Order History**: Show all orders placed today with categories

## API Compatibility

All existing API routes work without changes:
- `/api/place-sl-order` ✅
- `/api/place-sl-limit-order` ✅
- `/api/exit-all` ✅
- `/api/cancel-sl-order` ✅

The system automatically detects whether it's an option or stock and handles accordingly!
