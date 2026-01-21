# Pending Orders Enhancement: Points & P&L Calculation

## 🎯 Feature Overview

Enhanced the `/api/pending-orders` endpoint to show potential profit/loss calculations for pending sell orders by comparing the order's sell price with the position's buy price.

## 📊 New Fields Added

### API Response Fields

Each pending order now includes:

| Field          | Type             | Description                               |
| -------------- | ---------------- | ----------------------------------------- |
| `buy_price`    | `number \| null` | Original buy price of the position        |
| `points`       | `number \| null` | Price difference (Sell Price - Buy Price) |
| `potential_pl` | `number \| null` | Expected profit/loss (Points × Quantity)  |

### Calculation Logic

For **SELL orders** with an associated position:

- **Buy Price**: Retrieved from the position's `buyAvg` field
- **Points**: `(Trigger Price OR Limit Price) - Buy Price`
- **Potential P&L**: `Points × Quantity`

Example:

- Buy Price: ₹100.00
- Sell Trigger: ₹105.00
- Quantity: 50
- **Points**: +5.00
- **Potential P&L**: +₹250.00

## 🔧 Implementation Details

### 1. API Route (`/src/app/api/pending-orders/route.ts`)

**Changes**:

- Fetches both pending orders AND current positions in parallel using `Promise.all()`
- Creates a position map indexed by `securityId` for O(1) lookup
- Calculates points and P&L for each SELL order that has a matching position

```typescript
// Fetch both orders and positions
const [orders, positions] = await Promise.all([
  dhanApi.getPendingSLOrders(),
  dhanApi.getPositions(),
]);

// Create position lookup map
const positionMap = new Map();
positions.forEach((pos: any) => {
  if (pos.securityId && pos.buyAvg && pos.netQty !== 0) {
    positionMap.set(pos.securityId, {
      buyPrice: pos.buyAvg,
      quantity: Math.abs(pos.netQty),
      tradingSymbol: pos.tradingSymbol,
    });
  }
});

// Calculate for each order
if (position && order.transactionType === "SELL") {
  buyPrice = position.buyPrice;
  const sellPrice = order.triggerPrice || order.price;
  points = sellPrice - buyPrice;
  potentialPL = points * order.quantity;
}
```

### 2. TypeScript Types (`/src/types/index.ts`)

**Updated `PendingSLOrder` interface**:

```typescript
export interface PendingSLOrder {
  order_id: string;
  symbol: string;
  quantity: number;
  trigger_price: number;
  limit_price: number;
  order_type: string;
  transaction_type: string;
  status: string;
  create_time: string;
  security_id: string;
  buy_price: number | null; // NEW
  points: number | null; // NEW
  potential_pl: number | null; // NEW
}
```

### 3. UI Component (`/src/components/PendingOrdersCard.tsx`)

**Display enhancements**:

- Shows **Buy Price** in blue if available
- Shows **Points** with color coding (green for profit, red for loss)
- Shows **Potential P&L** with ₹ symbol and color coding
- All fields conditionally rendered (only shown when data is available)

```tsx
{
  order.buy_price && (
    <p className="text-gray-400">
      <span className="text-gray-500">Buy Price:</span>{" "}
      <span className="text-blue-400 font-semibold">
        ₹{order.buy_price.toFixed(2)}
      </span>
    </p>
  );
}

{
  order.points !== null && (
    <p className="text-gray-400">
      <span className="text-gray-500">Points:</span>{" "}
      <span
        className={`font-semibold ${order.points >= 0 ? "text-green-400" : "text-red-400"}`}
      >
        {order.points >= 0 ? "+" : ""}
        {order.points.toFixed(2)}
      </span>
    </p>
  );
}

{
  order.potential_pl !== null && (
    <p className="text-gray-400">
      <span className="text-gray-500">Potential P&L:</span>{" "}
      <span
        className={`font-semibold ${order.potential_pl >= 0 ? "text-green-400" : "text-red-400"}`}
      >
        ₹{order.potential_pl.toFixed(2)}
      </span>
    </p>
  );
}
```

## 📈 Use Cases

### Stop Loss Orders

- **SL Trigger**: ₹95.00 (Buy: ₹100.00)
- **Points**: -5.00 (red)
- **Potential P&L**: -₹250.00 for 50 qty

### Take Profit Orders

- **TP Trigger**: ₹110.00 (Buy: ₹100.00)
- **Points**: +10.00 (green)
- **Potential P&L**: +₹500.00 for 50 qty

### Exit Orders

- **Current Price**: ₹102.50 (Buy: ₹100.00)
- **Points**: +2.50 (green)
- **Potential P&L**: +₹125.00 for 50 qty

## 🔍 Edge Cases Handled

1. **BUY orders**: No P&L calculation (only SELL orders show P&L)
2. **No matching position**: Fields show as `null`, UI hides them
3. **Position closed**: If `netQty = 0`, position ignored
4. **Missing buy price**: If `buyAvg` not available, no calculation

## ⚡ Performance Optimization

- **Parallel fetching**: Orders and positions fetched simultaneously
- **O(1) lookup**: Position map enables constant-time position lookup
- **Minimal overhead**: Calculations only for SELL orders with positions

## 🎨 UI Enhancements

### Color Coding

- **Positive P&L**: Green text (profit)
- **Negative P&L**: Red text (loss)
- **Buy Price**: Blue text (reference)
- **Trigger Price**: Yellow text (alert)

### Responsive Design

- Grid layout adapts to 2 columns
- All new fields seamlessly integrate with existing layout
- Mobile-friendly with proper text sizing

## 🚀 Benefits

1. **Better Decision Making**: See potential profit/loss before order triggers
2. **Risk Assessment**: Quickly identify potential losses from SL orders
3. **Target Clarity**: View expected gains from TP orders
4. **Real-time Context**: Understand order impact relative to entry price

## 📅 Implementation Date

January 21, 2026

## ✅ Testing Checklist

- [ ] API returns correct buy_price from positions
- [ ] Points calculated correctly (sell - buy)
- [ ] Potential P&L calculated correctly (points × qty)
- [ ] Green color for positive values
- [ ] Red color for negative values
- [ ] Null fields hidden in UI
- [ ] Works for SL, TP, and Exit orders
- [ ] No calculation for BUY orders
- [ ] Handles missing positions gracefully
