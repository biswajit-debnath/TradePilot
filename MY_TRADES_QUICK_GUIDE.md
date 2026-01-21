# My Trades Feature - Quick Start Guide

## 🚀 Quick Access

### Method 1: Via Menu

1. Click the **hamburger menu** (☰) in the top-right corner
2. Look for **"My Trades"** with the blue **JOURNAL** badge
3. Click to open the trade journal

### Method 2: Direct URL

Navigate to: `http://localhost:3000/my-trades`

---

## 📊 Understanding Your Dashboard

### Top Row - Key Metrics (4 Cards)

#### Card 1: Total Trades

```
┌─────────────────┐
│ Total Trades    │
│ 15              │ ← Total number of completed trades
│ W: 10  L: 5     │ ← Wins and Losses breakdown
└─────────────────┘
```

#### Card 2: Total P&L

```
┌─────────────────┐
│ Total P&L       │
│ ₹12,450.50      │ ← Total profit/loss (green = profit, red = loss)
│ Profit Factor: 2.5 │ ← Ratio of profits to losses
└─────────────────┘
```

#### Card 3: Win Rate

```
┌─────────────────┐
│ Win Rate        │
│ 66.7%           │ ← Percentage of winning trades
│ Avg Win: ₹1,800 │ ← Average profit per winning trade
└─────────────────┘
```

#### Card 4: Best/Worst

```
┌─────────────────┐
│ Best/Worst      │
│ Win: ₹3,500.00  │ ← Your largest winning trade
│ Loss: ₹-850.00  │ ← Your largest losing trade
└─────────────────┘
```

---

## 🔍 Using Filters

### Filter Bar Layout

```
┌────────────────────────────────────────────────────────────┐
│  Symbol: [All Symbols ▼]  Category: [All Types ▼]         │
│  Period: [Today ▼]         [↻ Refresh]                     │
└────────────────────────────────────────────────────────────┘
```

### Symbol Filter

- **ALL**: Shows all traded symbols
- **Specific Symbol**: e.g., "NIFTY 21 JAN 25000 CE"
- Use to focus on specific instrument performance

### Category Filter

- **ALL**: Shows both options and stocks
- **OPTION**: Only option trades
- **STOCK**: Only stock/equity trades

### Period Filter

- **Today**: Only today's completed trades
- **This Week**: Last 7 days
- **This Month**: Last 30 days
- **All Time**: All historical trades

---

## 📈 Reading the Trade Journal Table

### Table Columns Explained

```
┌───────────┬──────┬────────┬────────┬─────┬─────────┬────────┬──────────┬────────────┐
│ Symbol    │ Type │ Entry  │ Exit   │ Qty │ P&L     │ P&L %  │ Duration │ Exit Time  │
├───────────┼──────┼────────┼────────┼─────┼─────────┼────────┼──────────┼────────────┤
│ NIFTY CE  │ OPT  │ ₹150.50│ ₹165.00│ 50  │ ₹725.00 │ +9.63% │ 2h 15m   │ Jan 21, 3:15PM │
│ 25000     │      │        │        │     │         │        │          │            │
└───────────┴──────┴────────┴────────┴─────┴─────────┴────────┴──────────┴────────────┘
```

1. **Symbol**: Trading symbol with strike & option type
2. **Type**: OPTION or STOCK (color-coded badge)
3. **Entry**: Buy price per unit
4. **Exit**: Sell price per unit
5. **Qty**: Number of units traded
6. **P&L**: Profit/Loss in rupees (Green = Profit, Red = Loss)
7. **P&L %**: Percentage return on investment
8. **Duration**: How long you held the position
9. **Exit Time**: When the trade was closed

### Color Coding

- 🟢 **Green**: Profitable trades
- 🔴 **Red**: Losing trades
- 🟣 **Purple Badge**: Options
- 🔵 **Blue Badge**: Stocks

---

## 💡 Understanding Analytics

### Win Rate Calculation

```
Win Rate = (Number of Winning Trades / Total Trades) × 100
Example: (10 / 15) × 100 = 66.7%
```

### Profit Factor

```
Profit Factor = Total Profits / Total Losses
Example: ₹15,000 / ₹6,000 = 2.5

Interpretation:
- > 2.0: Excellent performance
- 1.5-2.0: Good performance
- 1.0-1.5: Moderate performance
- < 1.0: Losing overall
```

### P&L Percentage

```
P&L % = ((Exit Price - Entry Price) / Entry Price) × 100
Example: ((165 - 150.50) / 150.50) × 100 = +9.63%
```

---

## 📱 Mobile Usage Tips

### On Small Screens

- Swipe left/right on the table to see all columns
- Filter cards stack vertically
- Analytics cards show in 1-2 column grid
- Use landscape mode for better table view

---

## 🎯 Common Use Cases

### 1. Review Today's Performance

```
1. Set Period to "Today"
2. Check Total P&L card
3. Review win rate
4. Analyze individual trades in table
```

### 2. Analyze Specific Symbol

```
1. Select symbol from dropdown
2. View all trades for that symbol
3. Check if consistently profitable
4. Review entry/exit patterns
```

### 3. Compare Options vs Stocks

```
1. Filter by Category: "OPTION"
2. Note the P&L and win rate
3. Switch to Category: "STOCK"
4. Compare performance metrics
```

### 4. Find Best/Worst Trades

```
1. Check "Best/Worst" card for quick view
2. Sort table by P&L column (click header)
3. Review what worked and what didn't
```

---

## 📊 Additional Stats Section

At the bottom, you'll find two more cards:

### Volume Stats

```
┌───────────────────────┐
│ Volume Stats          │
│ Total Buy: ₹125,000   │ ← Capital deployed
│ Total Sell: ₹137,450  │ ← Capital returned
└───────────────────────┘
```

### Average Stats

```
┌───────────────────────┐
│ Average Stats         │
│ Avg Profit: ₹1,800    │ ← Per winning trade
│ Avg Loss: ₹600        │ ← Per losing trade
└───────────────────────┘
```

---

## ⚠️ Important Notes

### Data Limitations

- **Dhan API** returns today's orders by default
- Historical data requires separate API calls
- Only **completed trades** (TRADED status) are shown
- Partial fills are calculated at minimum quantity

### Trade Matching

- Automatically pairs BUY and SELL orders
- Matches by Security ID and Symbol
- Same-day trades only (current implementation)
- Unmatched orders won't appear in journal

### Refresh Behavior

- Click **Refresh** to update from Dhan API
- Filters apply to cached data (no new API call)
- Connection status shows in menu (green dot)

---

## 🔧 Troubleshooting

### "No completed trades found"

✅ Solutions:

- Ensure you have both BUY and SELL orders executed
- Try "All Time" filter instead of "Today"
- Click Refresh to reload data
- Check connection status (green dot in menu)

### Incorrect P&L Values

✅ Check:

- Verify buy and sell prices in original orders
- Ensure quantity matches between BUY/SELL
- Check for partial fills or amendments

### Slow Loading

✅ Optimize:

- Use specific symbol filter
- Apply date filters to reduce data
- Refresh browser if sluggish
- Check network connection

---

## 🎓 Tips for Better Analysis

### Daily Review Habit

```
1. Open My Trades at end of day
2. Review P&L and win rate
3. Note best performing symbols
4. Identify patterns in losses
5. Adjust strategy accordingly
```

### Weekly Analysis

```
1. Set filter to "This Week"
2. Compare with previous week
3. Track improvement in win rate
4. Review capital efficiency
5. Document learnings
```

### Strategy Testing

```
1. Tag trades mentally by strategy
2. Filter by symbol/category
3. Compare P&L across strategies
4. Double down on winners
5. Eliminate losers
```

---

## 🚀 Power User Tips

### Keyboard Shortcuts

- **F5**: Refresh page (updates data)
- **Ctrl + F**: Search in table (browser feature)
- **Tab**: Navigate between filters

### Quick Filters

1. **Profitable Symbols**: Filter ALL → Find green P&L → Note symbols
2. **Problem Areas**: Look for red P&L patterns
3. **Time Analysis**: Compare morning vs afternoon trades

### Export Data (Future)

- Currently view-only
- Screenshot for records
- Copy table data to spreadsheet
- Future: CSV export feature planned

---

## 📞 Need Help?

1. **Check connection**: Green dot in menu = connected
2. **Verify API**: Ensure Dhan credentials are valid
3. **Browser console**: F12 for error messages
4. **Documentation**: Read MY_TRADES_DOCUMENTATION.md

---

## ✨ Feature Highlights

✅ Real-time analytics calculation
✅ Smart trade matching algorithm
✅ Beautiful, responsive UI
✅ Multiple filter options
✅ Performance insights
✅ Mobile-friendly design
✅ Zero configuration needed

---

**Happy Trading! 📈💰**

_Use this journal to learn, improve, and grow your trading skills._
