# API Naming Convention Update

## Overview
Updated API endpoint names to better reflect that the app works with **positions** rather than **orders**.

## API Endpoints Naming

### New Structure

```
Position-Related:
├── GET  /api/current-position          ✅ NEW! (was /api/last-option-order)
├── POST /api/place-sl-order            ✅ (works with positions now)
└── POST /api/place-sl-limit-order      ✅ (works with positions now)

Order Management:
├── GET  /api/pending-sl-orders         ✅ (fetches pending SL orders)
├── PUT  /api/modify-sl-order           ✅ (modify existing SL order)
└── DELETE /api/cancel-sl-order         ✅ (cancel SL order)

Bulk Actions:
└── POST /api/exit-all                  ✅ (exit all positions + cancel all orders)

Other:
├── GET  /api/verify-connection         ✅ (verify Dhan connection)
└── GET  /api/order-book                ✅ (get full order book)
```

## Major Changes

### 1. New Endpoint: `/api/current-position`

**Replaces:** `/api/last-option-order`

**Purpose:** Get current open position (not last traded order)

**Response Format:**
```json
{
  "success": true,
  "position": {
    "position_id": "11536",
    "symbol": "NIFTY 24000 CE",
    "category": "OPTION",
    "option_type": "CALL",
    "strike_price": 24000,
    "expiry_date": "2026-01-30",
    "quantity": 50,
    "buy_price": 100.50,
    "sl_trigger_price": 102.50,
    "sl_offset": 2,
    "security_id": "11536",
    "exchange_segment": "NSE_FNO",
    "product_type": "INTRADAY",
    "unrealized_profit": 250.00,
    "realized_profit": 0
  }
}
```

**Key Differences from Old Format:**
- ✅ `position` instead of `order`
- ✅ `position_id` instead of `order_id`
- ✅ `category` instead of `order_category`
- ✅ Includes P&L data

### 2. Updated Types

**New Interface: `PositionDetails`**
```typescript
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
```

**Backwards Compatibility:**
- Old `OrderDetails` interface still exists
- Old `getLastOptionOrder()` method still works
- Internally maps to new position format

### 3. Updated Service Methods

**New Method:**
```typescript
async getCurrentPosition(): Promise<{ 
  success: boolean; 
  position?: PositionDetails; 
  error?: string 
}>
```

**Deprecated but Working:**
```typescript
/**
 * @deprecated Use getCurrentPosition() instead
 */
async getLastOptionOrder(): Promise<{ 
  success: boolean; 
  order?: OrderDetails; 
  error?: string 
}>
```

## Migration Guide

### For Developers Using the API

#### Old Way (Still Works):
```typescript
const response = await apiService.getLastOptionOrder();
if (response.success && response.order) {
  console.log(response.order.symbol);
  console.log(response.order.order_category);
}
```

#### New Way (Recommended):
```typescript
const response = await apiService.getCurrentPosition();
if (response.success && response.position) {
  console.log(response.position.symbol);
  console.log(response.position.category);
  console.log(response.position.unrealized_profit); // NEW!
}
```

### Updating Your Code

1. **Replace endpoint calls:**
   ```typescript
   // OLD
   fetch('/api/last-option-order')
   
   // NEW
   fetch('/api/current-position')
   ```

2. **Update type references:**
   ```typescript
   // OLD
   import { OrderDetails } from '@/types';
   
   // NEW
   import { PositionDetails } from '@/types';
   ```

3. **Update field names:**
   ```typescript
   // OLD
   order.order_id
   order.order_category
   
   // NEW
   position.position_id
   position.category
   ```

## Complete API Reference

### GET /api/current-position
**Description:** Get current open position

**Response:**
```json
{
  "success": true,
  "position": {
    "position_id": "string",
    "symbol": "string",
    "category": "OPTION" | "STOCK",
    "option_type": "CALL" | "PUT" | null,
    "strike_price": number,
    "expiry_date": "string",
    "quantity": number,
    "buy_price": number,
    "sl_trigger_price": number,
    "sl_offset": number,
    "security_id": "string",
    "exchange_segment": "string",
    "product_type": "string",
    "unrealized_profit": number,
    "realized_profit": number
  }
}
```

### POST /api/place-sl-order
**Description:** Place SL-M order for current position

**Request Body (optional):**
```json
{
  "trigger_price": 102.5  // Optional: custom trigger price
}
```

**Response:**
```json
{
  "success": true,
  "order_id": "112111182198",
  "order_status": "PENDING",
  "buy_price": 100.50,
  "trigger_price": 102.50,
  "symbol": "NIFTY 24000 CE",
  "quantity": 50
}
```

### POST /api/place-sl-limit-order
**Description:** Place SL-Limit order for current position (buy - 20)

**Response:**
```json
{
  "success": true,
  "order_id": "112111182199",
  "order_status": "PENDING",
  "buy_price": 100.00,
  "trigger_price": 80.00,
  "limit_price": 79.50,
  "symbol": "NIFTY 24000 CE",
  "quantity": 50
}
```

### GET /api/pending-sl-orders
**Description:** Get all pending SL orders

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "order_id": "112111182198",
      "symbol": "NIFTY 24000 CE",
      "quantity": 50,
      "trigger_price": 102.50,
      "order_type": "STOP_LOSS_MARKET",
      "transaction_type": "SELL",
      "status": "PENDING",
      "create_time": "2026-01-16 10:30:00"
    }
  ]
}
```

### DELETE /api/cancel-sl-order?order_id={orderId}
**Description:** Cancel a pending SL order

**Response:**
```json
{
  "success": true,
  "message": "Order cancelled successfully"
}
```

### POST /api/exit-all
**Description:** Exit all positions and cancel all pending orders

**Response:**
```json
{
  "success": true,
  "positions_exited": 2,
  "orders_cancelled": 3,
  "message": "Successfully exited 2 positions and cancelled 3 orders.",
  "errors": []  // Optional: only if errors occurred
}
```

### GET /api/verify-connection
**Description:** Verify Dhan API connection

**Response:**
```json
{
  "success": true,
  "client_id": "1000000003",
  "token_validity": "24 hours",
  "active_segments": "NSE_EQ, NSE_FNO"
}
```

## Backwards Compatibility

### Old Endpoint Still Works

The old `/api/last-option-order` endpoint still exists and returns the old format:

```json
{
  "success": true,
  "order": {
    "order_id": "11536",
    "symbol": "NIFTY 24000 CE",
    "order_category": "OPTION",
    "option_type": "CALL",
    ...
  }
}
```

**However:**
- Internally it calls the new position API
- Maps response to old format
- ⚠️ Marked as deprecated
- 🎯 **Recommended:** Migrate to new `/api/current-position`

## File Structure

```
src/app/api/
├── current-position/
│   └── route.ts              ✅ NEW! Main position endpoint
├── last-option-order/
│   └── route.ts              ⚠️  Deprecated (but still works)
├── place-sl-order/
│   └── route.ts              ✅ Updated to use positions
├── place-sl-limit-order/
│   └── route.ts              ✅ Updated to use positions
├── pending-sl-orders/
│   └── route.ts              ✅ Order management
├── cancel-sl-order/
│   └── route.ts              ✅ Order management
├── modify-sl-order/
│   └── route.ts              ✅ Order management
├── exit-all/
│   └── route.ts              ✅ Bulk action
├── verify-connection/
│   └── route.ts              ✅ Connection check
└── order-book/
    └── route.ts              ✅ Order history
```

## Summary of Changes

| Aspect | Before | After |
|--------|--------|-------|
| **Main Endpoint** | `/api/last-option-order` | `/api/current-position` |
| **Response Key** | `order` | `position` |
| **ID Field** | `order_id` | `position_id` |
| **Category Field** | `order_category` | `category` |
| **Data Source** | Order book (historical) | Positions (current) |
| **Includes P&L** | ❌ No | ✅ Yes |
| **Quantity** | Original order qty | Net qty (current holding) |
| **Price** | Average traded | Buy average |

## Benefits

1. ✅ **Clearer Naming** - "position" is more accurate than "order"
2. ✅ **Better Semantics** - API names reflect what they actually do
3. ✅ **Consistent** - Position-based operations use position terminology
4. ✅ **Backwards Compatible** - Old code still works
5. ✅ **Future Ready** - Foundation for position-centric features

## Next Steps for Developers

1. **Update your imports:**
   ```typescript
   import { PositionDetails } from '@/types';
   ```

2. **Use new method:**
   ```typescript
   const { position } = await apiService.getCurrentPosition();
   ```

3. **Update field access:**
   ```typescript
   position.category    // instead of order.order_category
   position.position_id // instead of order.order_id
   ```

4. **Leverage new data:**
   ```typescript
   if (position.unrealized_profit > 0) {
     console.log('In profit!');
   }
   ```

## Migration Timeline

- **Phase 1 (Current)**: Both endpoints work, old is deprecated
- **Phase 2 (Future)**: Update all frontend code to use new endpoint
- **Phase 3 (Later)**: Remove old endpoint after ensuring no usage

For now, both work seamlessly! 🚀
