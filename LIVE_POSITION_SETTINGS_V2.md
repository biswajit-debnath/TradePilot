# Live Position Settings - Order-Based Configuration

## Overview

The Live Position Card now features an intuitive single-column list where users can drag and drop fields to control their display order. Each field shows its position number and can be easily reordered.

## ✨ Key Features

### 1. **Single-Column List with Position Numbers**

- All fields displayed in one organized list
- Each field shows its position number (1, 2, 3, ...)
- Fields render in the UI based on their order position

### 2. **Drag-and-Drop Reordering**

- Click and drag the **☰ hamburger icon** to reorder fields
- Visual feedback when dragging (highlighted drop zones)
- Smooth animations during reordering
- Real-time position number updates

### 3. **Arrow Button Fine Control**

- **↑ Up arrow**: Move field up one position
- **↓ Down arrow**: Move field down one position
- Arrows appear on hover for cleaner UI
- Disabled automatically at list boundaries

### 4. **Toggle Visibility**

- Modern toggle switch for each field
- Green = Visible, Gray = Hidden
- Hidden fields show a "Hidden" badge
- Changes reflect instantly in the live position card

### 5. **Categorized Fields with Icons**

- 📋 **BASIC**: Core position info (Symbol, Category, Quantity)
- 📊 **OPTION**: Option-specific data (Type, Strike, Expiry)
- 📈 **STOCK**: Stock-specific data (Product Type)
- 💰 **PRICE**: Pricing information (Buy Price)
- ⚡ **LIVE**: Real-time market data (Current Price, P&L metrics)

## 📋 Available Fields

### Basic Information (📋)

1. **Symbol** - Trading symbol
2. **Category** - OPTION or STOCK
3. **Quantity** - Position size
4. **Exchange Segment** - NSE_FNO, BSE_EQ, etc. (Hidden by default)

### Option Details (📊)

5. **Option Type** - CALL or PUT
6. **Strike Price** - Option strike
7. **Expiry Date** - Expiry date (Hidden by default)

### Stock Details (📈)

8. **Product Type** - INTRADAY, CNC, MTF, etc.

### Price Information (💰)

9. **Buy Price** - Entry price

### Live Market Data (⚡)

10. **Current Price** - Real-time market price
11. **P&L Points** - Points profit/loss (Highlighted with star ⭐)
12. **P&L Percentage** - Percentage return
13. **P&L Value** - Total P&L in rupees
14. **Last Updated** - Last update timestamp

## 🎮 How to Use

### Opening Settings

1. Click the **⚙️ gear icon** next to "Live Position" heading
2. Settings modal opens with current field configuration

### Reordering Fields

#### Method 1: Drag and Drop

1. Click and hold the **☰ hamburger icon** on any field
2. Drag the field up or down in the list
3. Drop it at the desired position
4. Position numbers update automatically

#### Method 2: Arrow Buttons

1. Hover over any field card
2. Click **↑** to move up one position
3. Click **↓** to move down one position
4. Repeat until desired order is achieved

### Show/Hide Fields

1. Click the **toggle switch** on the right of each field
2. **Green** = Field is visible in live position card
3. **Gray** = Field is hidden from display
4. A "Hidden" badge appears on disabled fields

### Saving Configuration

1. **Save Changes**: Apply and persist your configuration
2. **Reset to Default**: Restore original field order and visibility
3. **Close (X)**: Cancel without saving changes

## 📊 Display Behavior

### Position Metadata Grid

- Fields with `BASIC`, `OPTION`, `STOCK`, `PRICE` categories
- Displays in a 2-3 column responsive grid
- Fields appear in the order you set (1, 2, 3, ...)
- Only enabled fields are shown

### Live Market Data Section

- Fields with `LIVE` category
- Displays in a separate highlighted section
- 2-4 column responsive grid
- P&L Points gets special highlighting with border and star ⭐
- Only shows if at least one live field is enabled

## 💾 Persistence

- Configuration automatically saved to localStorage
- Persists across browser sessions
- Survives page refreshes
- New fields automatically added when app updates

## 🎨 Visual Features

### Field Cards

- Position number badge (cyan gradient)
- Category icon and label
- "Hidden" badge for disabled fields
- Hover effects for better UX
- Smooth animations

### Interaction States

- **Normal**: Black background with gray border
- **Hover**: Cyan border, arrows appear
- **Dragging**: Reduced opacity, scaled down
- **Drop zone**: Cyan highlight, slightly scaled up

### Summary Stats

- Total fields count
- Visible fields count
- Hidden fields count

## ⌨️ Keyboard Support (Future)

- `Ctrl/Cmd + ↑`: Move selected field up
- `Ctrl/Cmd + ↓`: Move selected field down
- `Space`: Toggle field visibility
- `Esc`: Close settings modal

## 🔄 Migration

- Old column-based configurations automatically migrated
- New fields added to existing configurations
- Backward compatible with previous versions

## 🎯 Benefits

### For Users

✅ **Intuitive**: Clear position numbers, easy to understand  
✅ **Flexible**: Organize fields exactly how you want  
✅ **Visual**: See position changes in real-time  
✅ **Fast**: Multiple ways to reorder (drag or arrows)  
✅ **Persistent**: Settings saved automatically

### For Developers

✅ **Maintainable**: Single list, simple data structure  
✅ **Extensible**: Easy to add new fields  
✅ **Type-safe**: TypeScript interfaces  
✅ **Performance**: Efficient rendering with React

## 📝 Example Configuration

```typescript
// Default order
const fields = [
  { id: "symbol", order: 0, enabled: true }, // Position 1
  { id: "category", order: 1, enabled: true }, // Position 2
  { id: "quantity", order: 2, enabled: true }, // Position 3
  { id: "buyPrice", order: 3, enabled: true }, // Position 4
  { id: "currentPrice", order: 4, enabled: true }, // Position 5
  { id: "gainLossPoints", order: 5, enabled: true }, // Position 6
  // ... more fields
];
```

## 🐛 Troubleshooting

### Fields not showing in settings?

- Clear browser localStorage
- Refresh the page
- New fields will be automatically added

### Drag and drop not working?

- Ensure you're dragging by the hamburger icon
- Try using arrow buttons instead
- Check browser console for errors

### Configuration not saving?

- Check browser localStorage permissions
- Try incognito mode to test
- Clear cache and try again

---

**Last Updated**: January 21, 2026  
**Version**: 2.0 - Single-Column Order-Based Configuration
