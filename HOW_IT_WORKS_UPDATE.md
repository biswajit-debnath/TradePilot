# How It Works Section Update

## Changes Made

### 1. **Reduced Size and Spacing**

- **Box padding**: `p-6 mb-5` → `p-3 md:p-4 mb-4` (smaller padding, tighter margins)
- **Header text**: `text-xl` → `text-base md:text-lg` (smaller on mobile, medium on desktop)
- **Dropdown arrow**: `text-2xl` → `text-lg md:text-xl` (proportionally smaller)
- **Content margin**: `mt-6` → `mt-4` (tighter spacing when expanded)
- **Text size**: Added `text-xs md:text-sm` to content area (smaller text throughout)

### 2. **Simplified Layout**

- **Removed**: Numbered circles with gradient backgrounds (was using `.map()` with decorative elements)
- **Added**: Clean bullet list format using `<ul>` with `list-disc list-inside`
- **Spacing**: `space-y-3` between sections, `space-y-1.5` between list items
- **Box padding**: `p-5` → `p-3` (more compact boxes)

### 3. **Updated Content to Reflect Current Working**

#### **SL Limit +4 Section**

- Explains it's a LIMIT order that executes immediately if price is above limit
- Clarifies use case: quick profit/break-even locks
- Example: ₹100 → ₹104

#### **SL-Market -19.5 Section** (Updated to STOP_LOSS_MARKET)

- Correctly describes STOP_LOSS_MARKET order type
- Emphasizes it only triggers when price **falls** to level
- Then executes at market price (guaranteed fill)
- Example: ₹100 → trigger at ₹80

#### **TP Limit Section**

- Mentions adjustable offset with +/- buttons
- Shows dynamic example based on TP_OFFSET env variable
- Emphasizes automatic profit booking

### 4. **Added "Important Notes" Section** ⚡

New highlighted section with key information:

- **Single order policy**: Only ONE order active at a time
- Any button click cancels existing order first
- Refresh resets TP offset to default
- Orders are position-specific (security ID matching)

## Visual Changes

### Before:

```tsx
- Large boxes with p-5 padding
- Big numbered circles (8x8) with gradients
- .map() loops for each section
- Lots of vertical space (space-y-4, space-y-5)
- Large text (text-lg headings, regular paragraph text)
```

### After:

```tsx
- Compact boxes with p-3 padding
- Simple bullet lists (list-disc)
- Direct JSX without .map() loops
- Tighter spacing (space-y-3, space-y-1.5)
- Smaller text (text-xs md:text-sm base, text-sm md:text-base headings)
```

## Mobile Responsive

All sizing uses responsive Tailwind classes:

- `text-xs md:text-sm` - Extra small on mobile, small on desktop
- `text-sm md:text-base` - Small on mobile, base on desktop
- `p-3 md:p-4` - Less padding on mobile
- `text-base md:text-lg` - Smaller headers on mobile

## Technical Accuracy

The content now accurately reflects:

1. ✅ SL Limit +4 uses **LIMIT** order (immediate execution possible)
2. ✅ SL-Market -19.5 uses **STOP_LOSS_MARKET** order (only triggers on price fall)
3. ✅ TP Limit uses **LIMIT** order with adjustable offset
4. ✅ Single-order policy mentioned explicitly
5. ✅ Refresh behavior documented

## Files Modified

- `/src/app/page.tsx` - Lines 425-490 (How It Works section)

---

**Status**: ✅ Complete
**Date**: January 20, 2026
