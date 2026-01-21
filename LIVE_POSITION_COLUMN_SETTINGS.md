# Live Position Card - Column-Based Display Settings

## Overview

The Live Position Card now features a powerful, drag-and-drop configurable display system that allows users to organize metadata fields into three columns with complete control over what's shown and where.

## Features

### 1. **Drag-and-Drop Column Organization**

- Fields can be dragged and dropped between three columns
- Visual feedback when dragging over columns
- Fields automatically reorder within columns
- Persistent configuration saved to localStorage

### 2. **Field Categories**

Each field is categorized with visual icons:

- 📋 **Basic Info**: Symbol, Category, Quantity, Exchange
- 📊 **Option Details**: Option Type, Strike Price, Expiry Date
- 📈 **Stock Details**: Product Type
- 💰 **Price Info**: Buy Price
- ⚡ **Live Market Data**: Current Price, P&L Points, P&L%, P&L Value, Last Updated

### 3. **Configurable Fields**

#### Basic Information

- **Symbol**: Trading symbol
- **Category**: OPTION or STOCK
- **Quantity**: Position size
- **Exchange Segment**: NSE_FNO, BSE_EQ, etc.

#### Option Details (Only for Option positions)

- **Option Type**: CALL or PUT
- **Strike Price**: Option strike price
- **Expiry Date**: Option expiry date

#### Stock Details (Only for Stock positions)

- **Product Type**: INTRADAY, CNC, etc.

#### Price Information

- **Buy Price**: Entry price

#### Live Market Data (Real-time updates)

- **Current Price**: Live market price
- **P&L Points**: Points profit/loss
- **P&L Percentage**: Percentage return
- **P&L Value**: Total profit/loss in rupees
- **Last Updated**: Last update timestamp

## How to Use

### Opening Settings

1. Click the ⚙️ gear icon next to "Live Position" heading
2. Settings modal opens with current field configuration

### Organizing Fields

1. **Drag**: Click and hold any field card
2. **Drop**: Drop into any of the three columns
3. Fields automatically position themselves in the target column

### Enabling/Disabling Fields

- Check/uncheck the checkbox on each field card
- Unchecked fields are hidden from the display

### Saving Configuration

1. Click "Save Changes" to apply and persist configuration
2. Click "Reset to Default" to restore default layout
3. Click X or outside modal to cancel without saving

## Default Layout

### Column 1 - Basic Info

- Symbol
- Category
- Quantity
- Exchange Segment (hidden by default)

### Column 2 - Price & Option/Stock Info

- Buy Price
- Option Type (for options)
- Strike Price (for options)
- Expiry Date (for options, hidden by default)
- Product Type (for stocks)

### Column 3 - Live Market Data

- Current Price
- P&L Points (highlighted)
- P&L Percentage
- P&L Value
- Last Updated

## Technical Implementation

### Data Structure

```typescript
interface FieldConfig {
  id: string; // Unique field identifier
  label: string; // Display label
  enabled: boolean; // Show/hide field
  category: string; // Field category
  column: 1 | 2 | 3; // Target column
  order: number; // Position within column
}
```

### Persistence

- Configuration stored in localStorage as `livePositionFields`
- Automatically loaded on component mount
- Saved whenever user clicks "Save Changes"

### Responsive Design

- 2 columns on mobile (< md breakpoint)
- 3 columns on tablet and desktop (>= md breakpoint)
- Fields adapt to available space

## UI Improvements

### Removed Elements

- ❌ Visual P&L progress bar (simplified design)
- ❌ "Auto-updating every 1s" tag (cleaner header)

### Enhanced Elements

- ✅ Gear icon for quick access to settings
- ✅ Focused P&L points display
- ✅ Category icons for better visual organization
- ✅ Smooth drag-and-drop interactions
- ✅ Column-based layout for better organization

## Future Enhancements

- [ ] Import/export configurations
- [ ] Multiple saved layouts
- [ ] Field grouping and separators
- [ ] Custom field colors
- [ ] Conditional field display rules

## Keyboard Shortcuts (Planned)

- `Ctrl/Cmd + ,` - Open settings
- `Esc` - Close settings
- `Ctrl/Cmd + R` - Reset to default

---

Last Updated: January 21, 2026
