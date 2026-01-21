# Auto-Refresh Toggle Feature

## 🎯 Feature Overview

Added a combined refresh control with manual refresh button and auto-refresh toggle to the Navbar. This provides users with control over automatic data polling while maintaining a compact, space-efficient design.

## 🎨 UI Design

### Combined Button Layout

```
┌─────────────────────────────────────┐
│ [🔄 Refresh] │ [🕐 Auto]           │
└─────────────────────────────────────┘
```

**Components:**

1. **Manual Refresh Button** (Left side):
   - 🔄 Rotating icon
   - "Refresh" text (hidden on mobile)
   - Shows "Refreshing..." when active
   - Spins animation during refresh

2. **Divider**: Vertical line separator

3. **Auto-Refresh Toggle** (Right side):
   - 🕐 Clock icon
   - "Auto" text (hidden on mobile, shown on desktop)
   - Pulses when enabled (cyan)
   - Gray when disabled

### Visual States

| State          | Background | Icon Color    | Animation |
| -------------- | ---------- | ------------- | --------- |
| **Auto ON**    | Cyan glow  | Cyan (bright) | Pulse     |
| **Auto OFF**   | Gray       | Gray (dim)    | None      |
| **Refreshing** | -          | Cyan          | Spin      |

## 🔧 Technical Implementation

### 1. **Navbar Component** (`/src/components/Navbar.tsx`)

**New Props:**

```typescript
interface NavbarProps {
  // ... existing props
  autoRefresh?: boolean;
  onToggleAutoRefresh?: () => void;
}
```

**Layout:**

- Single container with gray background and border
- Flexbox layout with divider
- Responsive text (hidden on small screens)
- Smooth transitions on all interactions

### 2. **Trade Live Page** (`/src/app/trade-live/page.tsx`)

**New State:**

```typescript
const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
```

**Auto-Refresh Logic:**

```typescript
useEffect(() => {
  // Only auto-refresh if:
  // 1. No position exists (lastOrder === null)
  // 2. Auto-refresh is enabled
  if (!lastOrder && autoRefreshEnabled) {
    autoRefreshIntervalRef.current = setInterval(async () => {
      await Promise.all([fetchAllPositions(), fetchPendingOrders()]);
    }, 1000); // 1 second interval
  }

  return () => {
    clearInterval(autoRefreshIntervalRef.current);
  };
}, [lastOrder, autoRefreshEnabled]);
```

**Toggle Handler:**

```typescript
const toggleAutoRefresh = useCallback(() => {
  setAutoRefreshEnabled((prev) => {
    const newValue = !prev;
    showAlert(
      newValue ? "✅ Auto-refresh enabled" : "⏸️ Auto-refresh disabled",
      "info",
    );
    return newValue;
  });
}, [showAlert]);
```

## 📋 Behavior Details

### Auto-Refresh Conditions

Auto-refresh only activates when:

1. ✅ **No position exists** (`lastOrder === null`)
2. ✅ **User has enabled it** (`autoRefreshEnabled === true`)

### Auto-Refresh Stops When:

- ❌ User disables it via toggle
- ❌ Position is detected (switches to live updates)
- ❌ Component unmounts

### Refresh Interval

- **1 second** when waiting for position
- **Silent** - no success alerts during auto-refresh
- **Error-safe** - errors logged but don't break the loop

## 🎯 Use Cases

### 1. Waiting for Position Entry

- **Scenario**: User has placed an order but it hasn't filled yet
- **Behavior**: Auto-refresh polls every second to detect new position
- **Benefit**: Immediate detection when position opens

### 2. Manual Control

- **Scenario**: User wants to prevent constant polling (save bandwidth/CPU)
- **Behavior**: Click toggle to disable, use manual refresh as needed
- **Benefit**: User control over resource usage

### 3. Monitoring Mode

- **Scenario**: Watching multiple terminals, want automatic updates
- **Behavior**: Keep auto-refresh ON, get updates passively
- **Benefit**: Hands-free monitoring

## 🎨 Visual Feedback

### User Actions & Feedback

| Action               | Visual Change             | Alert Message            |
| -------------------- | ------------------------- | ------------------------ |
| Toggle ON            | Icon turns cyan + pulses  | ✅ Auto-refresh enabled  |
| Toggle OFF           | Icon turns gray, no pulse | ⏸️ Auto-refresh disabled |
| Manual Refresh       | Icon spins                | ✅ Data refreshed!       |
| Auto-refresh running | Clock icon pulses         | (Silent)                 |

### Console Logging

```
📡 No position detected - Starting auto-refresh (1s interval)
⏸️ Auto-refresh disabled by user
✅ Position detected - Auto-refresh stopped
```

## 📱 Responsive Design

### Mobile (< 640px)

- Manual refresh icon only
- Auto toggle shows icon only
- Compact layout

### Tablet (640px - 768px)

- Manual refresh with "Refresh" text
- Auto toggle with icon only

### Desktop (> 768px)

- Full text for both buttons
- Spacious layout with clear labeling

## ✅ Benefits

1. **Space Efficient**: Combined button takes minimal navbar space
2. **Clear Visual State**: Pulsing cyan vs. static gray makes state obvious
3. **User Control**: Easy toggle without opening settings
4. **Smart Defaults**: Auto-refresh ON by default, stops when not needed
5. **Performance**: Only polls when necessary (no position)
6. **Accessibility**: Clear hover states and tooltips

## 🚀 Future Enhancements

Potential improvements:

- [ ] Adjustable refresh interval (1s, 5s, 10s)
- [ ] Persistent user preference (localStorage)
- [ ] Auto-pause when tab is not visible
- [ ] Data usage indicator
- [ ] Last refresh timestamp display

## 📅 Implementation Date

January 21, 2026

## 🔍 Testing Checklist

- [x] Toggle ON/OFF works correctly
- [x] Auto-refresh stops when position detected
- [x] Auto-refresh restarts when position closes
- [x] Manual refresh works regardless of auto-refresh state
- [x] Visual states (cyan/gray) display correctly
- [x] Pulse animation works when enabled
- [x] Spin animation works during refresh
- [x] Alert messages show on toggle
- [x] Responsive layout on mobile/tablet/desktop
- [x] No console errors
- [x] Cleanup on unmount prevents memory leaks
