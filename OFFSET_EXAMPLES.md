# SL-Limit Order Offset Examples

## Understanding the Offset Parameter

The offset is a **positive or negative number** that gets added to the buy price to calculate the trigger price.

### Formula:
```
Trigger Price = Buy Price + Offset
Limit Price = Trigger Price - 1
```

## Examples

### Example 1: Buy Price = ₹100

| Offset | Trigger Price | Limit Price | Description |
|--------|---------------|-------------|-------------|
| -10    | ₹90          | ₹89         | Tight stop, 10% protection |
| -20    | ₹80          | ₹79         | Default, 20% protection |
| -30    | ₹70          | ₹69         | Wider stop, 30% protection |
| -50    | ₹50          | ₹49         | Very wide stop, 50% protection |

### Example 2: Buy Price = ₹50

| Offset | Trigger Price | Limit Price | Description |
|--------|---------------|-------------|-------------|
| -5     | ₹45          | ₹44         | Tight stop |
| -10    | ₹40          | ₹39         | Medium stop (default) |
| -15    | ₹35          | ₹34         | Wider stop |
| -20    | ₹30          | ₹29         | Very wide stop |

### Example 3: Buy Price = ₹200

| Offset | Trigger Price | Limit Price | Description |
|--------|---------------|-------------|-------------|
| -20    | ₹180         | ₹179        | Tight stop |
| -40    | ₹160         | ₹159        | Default (20%) |
| -60    | ₹140         | ₹139        | Wider stop |
| -100   | ₹100         | ₹99         | Very wide stop |

## Code Usage

### In JavaScript/TypeScript:

```typescript
// Default offset of -20
await apiService.placeDeepStopLossOrder();

// Custom offsets
await apiService.placeDeepStopLossOrder(-10);  // Tighter stop
await apiService.placeDeepStopLossOrder(-30);  // Wider stop
await apiService.placeDeepStopLossOrder(-50);  // Very wide stop
```

### Via API:

```bash
# Default offset (-20)
curl -X POST http://localhost:3000/api/place-sl-limit-order \
  -H "Content-Type: application/json"

# Custom offset (-30)
curl -X POST http://localhost:3000/api/place-sl-limit-order \
  -H "Content-Type: application/json" \
  -d '{"offset": -30}'
```

## Choosing the Right Offset

### Tight Stops (-5 to -15)
- ✅ Good for: Quick exits, scalping, high volatility
- ❌ Risk: May trigger on minor pullbacks

### Medium Stops (-15 to -30)
- ✅ Good for: Intraday trading, balanced approach
- ❌ Risk: Moderate loss if triggered

### Wide Stops (-30 to -50+)
- ✅ Good for: Swing trading, giving trades room to breathe
- ❌ Risk: Larger losses if triggered

## Important Notes

1. **Negative values**: Use negative offsets (e.g., -20) to place stops below buy price
2. **Percentage**: If buy price is ₹100 and offset is -20, it's 20% below
3. **Validation**: The API checks if trigger and limit prices are positive
4. **Limit Price**: Always set 1 point below trigger for better execution
5. **Market conditions**: Adjust offset based on volatility and your risk tolerance

## Risk Management

Always consider:
- Your total capital
- Position size
- Market volatility
- Time frame (intraday vs swing)
- Risk-reward ratio

A -20 offset on a ₹100 option means you're willing to lose ₹20 per lot.
If you have 1 lot (50 qty), maximum loss = ₹1000 (₹20 × 50)
