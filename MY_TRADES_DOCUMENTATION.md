# My Trades - Trade Journal Feature

## Overview

The **My Trades** page is a comprehensive trading journal that tracks, analyzes, and visualizes your completed trades with advanced filtering and analytics capabilities.

## Features

### 📊 Analytics Dashboard

- **Total Trades**: Complete count with winning and losing trade breakdown
- **Total P&L**: Overall profit and loss with profit factor calculation
- **Win Rate**: Percentage of winning trades with average profit metrics
- **Largest Win/Loss**: Track your best and worst trades

### 🔍 Advanced Filtering

1. **Symbol Filter**: View trades for specific instruments or all symbols
2. **Category Filter**: Filter by Options or Stocks
3. **Date Filter**:
   - Today
   - This Week
   - This Month
   - All Time

### 📈 Trade Journal Table

Displays detailed information for each completed trade:

- Symbol and option details (strike, type)
- Entry and exit prices
- Quantity traded
- Profit/Loss in currency and percentage
- Trade duration
- Exit timestamp

### 💰 Performance Metrics

- **Total Buy/Sell Volume**: Track total capital deployed
- **Average Profit/Loss**: Statistical analysis of winning and losing trades
- **Profit Factor**: Ratio of total profit to total loss
- **Win Rate**: Success percentage of trades

## How It Works

### Data Source

The feature uses Dhan's Order Book API to fetch all orders and automatically matches BUY and SELL orders to create complete trade entries.

### Trade Matching Logic

1. Fetches all TRADED orders from Dhan API
2. Groups orders by `securityId` and `tradingSymbol`
3. Matches BUY orders with corresponding SELL orders
4. Calculates profit/loss, duration, and percentage returns
5. Displays completed round-trip trades

### Analytics Calculation

- **Win Rate**: `(Winning Trades / Total Trades) × 100`
- **Profit Factor**: `Total Profit / Total Loss`
- **Duration**: Time difference between entry and exit
- **P&L%**: `((Exit Price - Entry Price) / Entry Price) × 100`

## API Endpoints

### GET `/api/trade-book`

Returns completed trades (TRADED orders only)

**Response:**

```json
{
  "success": true,
  "trades": [
    {
      "orderId": "...",
      "tradingSymbol": "NIFTY 21 JAN 25000 CE",
      "transactionType": "BUY/SELL",
      "quantity": 50,
      "averageTradedPrice": 150.50,
      "createTime": "2026-01-21T10:30:00",
      ...
    }
  ]
}
```

### GET `/api/order-book`

Returns all orders (used for comprehensive trade matching)

## Usage

### Accessing the Page

1. Click the hamburger menu (☰) in the navbar
2. Select **"My Trades"** with the JOURNAL badge
3. Or navigate to `/my-trades`

### Filtering Trades

1. **By Symbol**: Select specific instrument from dropdown
2. **By Category**: Choose Options or Stocks
3. **By Date**: Select time period (today, week, month, all time)
4. Click **Refresh** to update data

### Understanding the Dashboard

#### Green Numbers = Profit

- Positive P&L values
- Winning trades
- Above-average performance

#### Red Numbers = Loss

- Negative P&L values
- Losing trades
- Below-average performance

## Technical Implementation

### Components

- **Page**: `/src/app/my-trades/page.tsx`
- **API Route**: `/src/app/api/trade-book/route.ts`
- **Types**: Updated in `/src/types/index.ts`

### Key Functions

#### `journalEntries` (useMemo)

Processes raw orders into matched trade journal entries

```typescript
// Groups BUY and SELL orders by security
// Calculates P&L, duration, and percentages
// Returns sorted array of completed trades
```

#### `analytics` (useMemo)

Computes real-time analytics from filtered trades

```typescript
// Calculates win rate, profit factor, averages
// Tracks largest wins/losses
// Computes total volumes
```

#### `filteredEntries` (useMemo)

Applies user-selected filters to journal entries

```typescript
// Symbol filter
// Category filter (Options/Stocks)
// Date range filter
```

### State Management

```typescript
const [orders, setOrders] = useState<DhanOrder[]>([]);
const [selectedSymbol, setSelectedSymbol] = useState<string>("ALL");
const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
const [dateFilter, setDateFilter] = useState<
  "today" | "week" | "month" | "all"
>("today");
```

## Performance Considerations

### Optimizations

- **useMemo**: Used for expensive calculations (journal processing, analytics)
- **Filtered computation**: Only processes visible trades
- **Local state**: Reduces API calls with client-side filtering

### Limitations

- Only shows **TODAY's** orders by default (Dhan API limitation)
- Matches trades based on same-day BUY/SELL pairs
- Partial fills are counted at minimum quantity

## Future Enhancements

### Potential Features

1. **Export to CSV/Excel**: Download trade journal
2. **Charts & Graphs**: Visual P&L trends over time
3. **Trade Notes**: Add custom notes to each trade
4. **Tags & Categories**: Custom trade categorization
5. **Strategy Performance**: Track different trading strategies
6. **Multi-day Matching**: Match trades across multiple days
7. **Commission Tracking**: Include brokerage fees in P&L
8. **Risk Metrics**: Sharpe ratio, max drawdown, etc.

## Troubleshooting

### No Trades Showing

- Ensure you have completed trades (both BUY and SELL)
- Check date filter - try "All Time"
- Verify connection status in drawer menu
- Refresh the page

### Incorrect P&L

- Verify buy and sell orders are matched correctly
- Check `averageTradedPrice` in order details
- Ensure quantity matches between buy/sell

### Slow Performance

- Use specific symbol filter instead of "All Symbols"
- Apply date filters to reduce dataset size
- Consider browser performance for large trade counts

## Related Features

- **Home**: Position management and SL orders
- **Trade Live**: Real-time position monitoring
- **Trade Algo**: Automated trading algorithms

## Support

For issues or questions:

1. Check connection status (green dot in menu)
2. Review browser console for errors
3. Verify Dhan API credentials in config

---

**Built with Next.js 15, TypeScript, and Tailwind CSS**
