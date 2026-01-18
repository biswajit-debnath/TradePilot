# Exit All Feature Documentation

## Overview
Added a powerful "⛔ Exit All" button that allows you to instantly exit all open positions and cancel all pending orders with a single click. This is a panic button for quickly closing out everything.

## What It Does

### 1. Exit All Open Positions
- Fetches all open positions from Dhan
- For each position with `netQty ≠ 0`:
  - **Long positions (netQty > 0)**: Places MARKET SELL order
  - **Short positions (netQty < 0)**: Places MARKET BUY order
- Uses absolute quantity value to ensure full position exit

### 2. Cancel All Pending Orders
- Fetches all pending orders (`PENDING` or `TRANSIT` status)
- Cancels each order one by one
- Includes SL orders, limit orders, and any other pending orders

## Implementation

### Backend Changes:

**`/src/lib/dhan-api.ts`**
- Added `getPositions()` - Fetches open positions from `/positions` endpoint
- Added `getPendingOrders()` - Gets all pending/transit orders
- Added `exitAll()` - Main function that:
  - Loops through positions and places opposite market orders
  - Loops through pending orders and cancels them
  - Returns summary with counts and errors

**`/src/app/api/exit-all/route.ts`**
- New API route `POST /api/exit-all`
- Calls `dhanApi.exitAll()`
- Returns success status, counts, and any errors

**`/src/services/api.ts`**
- Added `exitAll()` method
- Calls `/api/exit-all` endpoint

### Frontend Changes:

**`/src/app/page.tsx`**
- Added `exitAll()` function with double confirmation
- Added "⛔ Exit All" button in status bar (red gradient styling)
- Shows warning dialog before execution
- Displays success/error messages with counts
- Disabled while loading

## Usage

### How to Use:
1. Click **"⛔ Exit All"** button in the top status bar
2. Confirm the warning dialog
3. System will:
   - Exit all open positions at market price
   - Cancel all pending orders
4. See results in alert message

### Example Scenarios:

**Scenario 1: Normal Exit**
```
Positions: 2 open (1 CALL long, 1 PUT long)
Orders: 3 pending (2 SL orders, 1 limit order)

Result:
✅ Successfully exited 2 positions and cancelled 3 orders.
```

**Scenario 2: With Errors**
```
Positions: 2 open
Orders: 2 pending (1 fails to cancel)

Result:
⚠️ Partially completed: Exited 2 positions, cancelled 1 orders. 1 errors occurred.
Errors: Failed to cancel order 123456789: Order already cancelled
```

**Scenario 3: No Open Positions**
```
Positions: 0 open
Orders: 1 pending

Result:
✅ Successfully exited 0 positions and cancelled 1 orders.
```

## API Reference

### Endpoint:
```
POST /api/exit-all
```

### Response:
```json
{
  "success": true,
  "positions_exited": 2,
  "orders_cancelled": 3,
  "message": "Successfully exited 2 positions and cancelled 3 orders.",
  "errors": [] // Optional, only if errors occurred
}
```

### Error Response:
```json
{
  "success": true,
  "positions_exited": 2,
  "orders_cancelled": 1,
  "errors": [
    "Failed to cancel order 123456789: Order already executed"
  ],
  "message": "Exited 2 positions, cancelled 1 orders. 1 errors occurred."
}
```

## Position Types Handled

The function correctly handles:
- **LONG positions** (netQty > 0): Places SELL order
- **SHORT positions** (netQty < 0): Places BUY order
- **CLOSED positions**: Skipped (no action needed)
- **Zero netQty**: Skipped

## Safety Features

### 1. Double Confirmation
```javascript
confirm('⚠️ WARNING: This will EXIT ALL open positions and CANCEL ALL pending orders!\n\nAre you absolutely sure?')
```

### 2. Error Handling
- Individual errors don't stop the entire process
- Each position/order is handled independently
- All errors are collected and reported

### 3. Loading State
- Button disabled while processing
- Prevents multiple simultaneous executions

### 4. Detailed Feedback
- Shows counts of positions exited
- Shows counts of orders cancelled
- Lists all errors if any occurred

## Important Notes

⚠️ **CRITICAL WARNINGS:**

1. **Market Orders**: Positions are exited using MARKET orders
   - ✅ Guaranteed execution
   - ⚠️ Price not guaranteed (may get slippage)

2. **Irreversible**: Once executed, cannot be undone
   - Positions will be closed immediately
   - Orders will be cancelled permanently

3. **Use Cases**:
   - ✅ Emergency exit during high volatility
   - ✅ End of day cleanup
   - ✅ Risk management when unable to monitor
   - ❌ NOT for selective position management

4. **Network Issues**: 
   - If partially completed, refresh to see updated status
   - Some positions may exit while others fail
   - Check order book and positions after execution

## UI Location

```
┌─────────────────────────────────────────────┐
│ 📈 Dhan SL Order App                        │
├─────────────────────────────────────────────┤
│ ● Connected: 1234567  [⛔ Exit All] [🔄]   │  ← HERE
└─────────────────────────────────────────────┘
```

## Testing Recommendations

1. **Test with small positions first**
2. **Verify in paper trading/sandbox if available**
3. **Check positions and orders after execution**
4. **Monitor for any partial executions**

## Code Flow

```
User clicks "⛔ Exit All"
    ↓
Confirmation dialog
    ↓
Frontend: exitAll()
    ↓
API: POST /api/exit-all
    ↓
Backend: dhanApi.exitAll()
    ↓
├─→ getPositions() → Place opposite market orders
└─→ getPendingOrders() → Cancel all pending orders
    ↓
Return results with counts and errors
    ↓
Display success/error message to user
```

## Future Enhancements (Optional)

1. Add option to exit only specific segments (FNO/EQ)
2. Add option to exit only options or only futures
3. Add dry-run mode to preview what would be closed
4. Add position summary before confirmation
5. Add option to use limit orders instead of market orders
