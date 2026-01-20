# TradePilot - Complete Documentation

**Version**: 2.0  
**Last Updated**: January 20, 2026

---

## 📑 Table of Contents

1. [Introduction](#introduction)
2. [Features](#features)
3. [Quick Start](#quick-start)
4. [Setup & Configuration](#setup--configuration)
5. [Project Structure](#project-structure)
6. [Core Features](#core-features)
7. [API Reference](#api-reference)
8. [WebSocket Implementation](#websocket-implementation)
9. [Trade Live Feature](#trade-live-feature)
10. [Troubleshooting](#troubleshooting)
11. [Production Deployment](#production-deployment)
12. [Development Guide](#development-guide)

---

## Introduction

**TradePilot** is your intelligent trading co-pilot for the Dhan ecosystem. From smart stop-loss and take-profit orders to advanced algorithmic strategies with real-time WebSocket updates, TradePilot puts your trading on autopilot.

### What is TradePilot?

TradePilot is a Next.js web application that integrates with Dhan's trading APIs to provide:

- Automated stop-loss order placement
- Real-time position monitoring via WebSocket
- Take-profit automation
- Multi-asset support (Options & Intraday Stocks)
- Emergency "Exit All" functionality
- Beautiful modern UI with dark theme

### Technology Stack

- **Framework**: Next.js 16.1.2 (App Router + Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API**: Dhan Trading API v2
- **Real-time**: WebSocket (wss://api-feed.dhan.co)
- **Deployment**: Vercel (recommended)

---

## Features

### 🎯 Core Trading Features

1. **Intelligent Position Management**
   - Real-time tracking of open positions
   - Automatic detection of options and intraday stocks
   - Live P&L display with color-coded indicators
   - Position-based logic (not order-based)

2. **Smart Stop-Loss Orders**
   - **SL-Market (Buy+2)**: Quick protection at buy price + ₹2
   - **SL-Limit (Buy-20)**: Deeper protection at buy price - ₹20
   - Automatic trigger price calculation
   - One-click order placement

3. **Take-Profit Automation**
   - Auto-book profits at configurable targets
   - Default: Buy price + ₹12
   - Limit order type for better fills

4. **Multi-Asset Support**
   - NSE/BSE/MCX Options
   - NSE/BSE Intraday Stocks
   - Automatic exchange segment detection

5. **Exit All Panic Button**
   - Emergency close all positions
   - Cancel all pending orders
   - One-click risk management

6. **Real-Time Updates via WebSocket**
   - Tick-by-tick price updates (<100ms latency)
   - Three feed modes: TICKER, QUOTE, FULL
   - Auto-reconnection on disconnect
   - Efficient binary protocol

### 🎨 User Interface Features

- **Glassmorphism Design**: Modern dark theme with gradient effects
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Drawer Navigation**: Slide-out menu for easy access
- **Live Status Indicators**: Connection status, WebSocket status
- **Interactive Cards**: Position card, pending orders card
- **Modal Dialogs**: "How It Works" guide
- **Alert System**: Success/error/info notifications

---

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Dhan trading account with API access
- Static IP address (required for order placement)

### Installation

```bash
# Clone the repository
git clone https://github.com/biswajit-debnath/TradePilot.git
cd TradePilot

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your credentials
nano .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### First Steps

1. Configure your Dhan credentials in `.env.local`
2. Setup static IP in Dhan account
3. Place a test trade in Dhan
4. Open TradePilot and click "Fetch Position"
5. Place a stop-loss order

---

## Setup & Configuration

### 1. Dhan Credentials

#### Get Client ID

1. Login to [web.dhan.co](https://web.dhan.co/)
2. Click your profile (top right)
3. Your Client ID is displayed there

#### Get Access Token

1. Login to [web.dhan.co](https://web.dhan.co/)
2. Click **My Profile** → **Access DhanHQ APIs**
3. Click **Generate Access Token**
4. Copy the token (valid for 24 hours)

### 2. Environment Configuration

Create `.env.local` file in the root directory:

```env
# Dhan API Credentials
NEXT_PUBLIC_DHAN_CLIENT_ID=1000000003
DHAN_ACCESS_TOKEN=eyJhbGciOiJIUzUxMiJ9.eyJkaGFuQ...

# WebSocket (Client-side - DEV ONLY)
NEXT_PUBLIC_DHAN_ACCESS_TOKEN=eyJhbGciOiJIUzUxMiJ9.eyJkaGFuQ...

# Trading Configuration
NEXT_PUBLIC_SL_OFFSET=2
NEXT_PUBLIC_SL_LIMIT_OFFSET=-20
NEXT_PUBLIC_TAKE_PROFIT_OFFSET=12
```

### 3. Static IP Setup (REQUIRED)

**Why**: SEBI guidelines require IP whitelisting for order placement.

**Steps**:

1. Go to [web.dhan.co](https://web.dhan.co/)
2. Navigate to **My Profile** → **Access DhanHQ APIs**
3. Scroll to **Static IP** section
4. Add your **Primary Static IP address**
5. Wait 5-10 minutes for activation
6. Restart TradePilot

**Get Your IP**:

```bash
curl ifconfig.me
```

**Important Notes**:

- You need a static IP from your ISP
- Home broadband usually has dynamic IP (changes frequently)
- Once set, IP cannot be changed for 7 days
- Without static IP: READ ONLY access (no order placement)

### 4. Trading Segments Activation

Ensure these segments are activated in your Dhan account:

- `NSE_FNO` - NSE Options & Futures
- `BSE_FNO` - BSE Options & Futures
- `MCX_COMM` - MCX Commodities
- `NSE_EQ` - NSE Equity (for intraday stocks)
- `BSE_EQ` - BSE Equity (for intraday stocks)

### 5. Data APIs Subscription (for WebSocket)

**Required for**: Trade Live WebSocket feature

**Steps**:

1. Login to [web.dhan.co](https://web.dhan.co/)
2. Go to API settings/subscriptions
3. Enable **Data APIs** (separate from Trading APIs)
4. May require additional payment

**Without Data APIs**: You can still use all other features except real-time WebSocket updates.

---

## Project Structure

```
dhan_sl_nextjs/
├── src/
│   ├── app/
│   │   ├── page.tsx                      # Main dashboard page
│   │   ├── trade-live/                   # REST API live updates
│   │   │   └── page.tsx
│   │   ├── trade-live-ws/                # WebSocket live updates ⚡
│   │   │   └── page.tsx
│   │   ├── globals.css                   # Global styles
│   │   ├── layout.tsx                    # Root layout
│   │   └── api/                          # API Routes (Next.js)
│   │       ├── verify-connection/
│   │       ├── current-position/
│   │       ├── place-sl-market-order/
│   │       ├── place-sl-limit-order/
│   │       ├── place-limit-order/
│   │       ├── pending-sl-orders/
│   │       ├── modify-sl-order/
│   │       ├── cancel-sl-order/
│   │       ├── exit-all/
│   │       ├── order-book/
│   │       └── last-option-order/
│   │
│   ├── components/                       # React Components
│   │   ├── Alert.tsx                     # Alert notifications
│   │   ├── Navbar.tsx                    # Top navigation bar
│   │   ├── DrawerMenu.tsx                # Slide-out menu
│   │   ├── HowItWorksModal.tsx           # Help modal
│   │   ├── PositionCard.tsx              # Position display card
│   │   ├── LivePositionCard.tsx          # Live position with P&L
│   │   └── PendingOrdersCard.tsx         # Pending orders list
│   │
│   ├── hooks/                            # Custom React Hooks
│   │   ├── useTradingData.ts             # Data fetching logic
│   │   └── useOrderActions.ts            # Order placement logic
│   │
│   ├── lib/                              # Libraries
│   │   ├── dhan-api.ts                   # Dhan API wrapper
│   │   └── dhan-websocket.ts             # WebSocket service ⚡
│   │
│   ├── services/                         # Services
│   │   └── api.ts                        # API service layer
│   │
│   ├── types/                            # TypeScript Types
│   │   └── index.ts                      # Type definitions
│   │
│   └── config/                           # Configuration
│       └── index.ts                      # App configuration
│
├── public/                               # Static assets
├── .env.local                            # Environment variables (create this)
├── package.json                          # Dependencies
├── tsconfig.json                         # TypeScript config
├── next.config.ts                        # Next.js config
└── DOCUMENTATION.md                      # This file
```

### Key Files Explained

#### Core Application

- **`src/app/page.tsx`**: Main dashboard with position and order management
- **`src/app/layout.tsx`**: Root layout with metadata and global styles
- **`src/app/globals.css`**: Tailwind CSS configuration and custom styles

#### Real-Time Features

- **`src/app/trade-live-ws/page.tsx`**: WebSocket-based live P&L tracking (RECOMMENDED)
- **`src/lib/dhan-websocket.ts`**: WebSocket service class for Dhan market feed
- **`src/components/LivePositionCard.tsx`**: UI component for live position display

#### Business Logic

- **`src/hooks/useTradingData.ts`**: Data fetching, position management
- **`src/hooks/useOrderActions.ts`**: Order placement, modification, cancellation
- **`src/lib/dhan-api.ts`**: Low-level Dhan API wrapper
- **`src/services/api.ts`**: High-level API service layer

#### API Routes (Server-side)

All API routes are in `src/app/api/` and handle server-side Dhan API calls.

---

## Core Features

### 1. Position Management

#### Current Position Display

The app automatically detects your open positions:

```typescript
// Position Detection Logic
- Checks for LONG positions only
- Filters by product type: INTRADAY
- Supports: NSE_FNO, BSE_FNO, MCX_COMM, NSE_EQ, BSE_EQ
- Displays: Symbol, Buy Price, Quantity, P&L
```

**Position Card Shows**:

- Trading symbol (e.g., NIFTY2401624000CE)
- Exchange segment (NSE_FNO, MCX_COMM, etc.)
- Buy average price
- Net quantity
- Realized/Unrealized P&L
- Security ID (for order placement)

#### Refresh Position

Click the refresh button to fetch latest position data:

- Updates buy price
- Updates quantity
- Recalculates P&L
- Fetches related pending orders

### 2. Stop-Loss Orders

#### SL-Market Order (Buy+2)

**Purpose**: Quick protection at a level slightly above your buy price.

**Example**:

- You bought NIFTY CE at ₹100
- Click "SL-M +2"
- Places SL-Market order with trigger: ₹102
- If price falls to ₹102, exits at market price

**Use Case**: Protect small profits, minimize losses in volatile markets.

**Configuration**:

```env
NEXT_PUBLIC_SL_OFFSET=2
```

#### SL-Limit Order (Buy-20)

**Purpose**: Deeper protection, accepts larger drawdown.

**Example**:

- You bought NIFTY CE at ₹100
- Click "SL-Limit -20"
- Places SL-Limit order with:
  - Trigger: ₹80
  - Limit: ₹78
- If price falls to ₹80, exits between ₹78-₹80

**Use Case**: Give trade more room, avoid premature exits.

**Configuration**:

```env
NEXT_PUBLIC_SL_LIMIT_OFFSET=-20
```

#### How SL Orders Work

1. **Trigger Price**: The price at which order activates
2. **Order Type**:
   - **SL-Market**: Executes at market price after trigger
   - **SL-Limit**: Executes at limit price (or better) after trigger
3. **Product Type**: Matches your position (INTRADAY)
4. **Exchange**: Auto-detected from position
5. **Quantity**: Matches your net quantity

### 3. Take-Profit Orders

**Purpose**: Automatically book profits at target price.

**Example**:

- You bought at ₹100
- Click "Take Profit +12"
- Places LIMIT order to sell at ₹112
- Order executes when price reaches ₹112

**Configuration**:

```env
NEXT_PUBLIC_TAKE_PROFIT_OFFSET=12
```

**Order Type**: LIMIT (not SL) for better fills at target price.

### 4. Exit All Feature

**Purpose**: Emergency risk management.

**What It Does**:

1. Closes all open positions at market price
2. Cancels all pending SL orders
3. Cancels all pending limit orders
4. Provides immediate exit from all trades

**Use Case**: Market crash, sudden news, risk management.

**How to Use**:

1. Click "Exit All" button in navbar
2. Confirm action
3. All positions closed, all orders cancelled
4. Refresh to see updated status

**Warning**: This is irreversible. Use with caution.

### 5. Order Management

#### View Pending Orders

See all pending SL and limit orders:

- Order ID
- Trading symbol
- Order type (SL-M, SL-L, LIMIT)
- Trigger price
- Status (PENDING, TRANSIT, REJECTED)

#### Modify Orders

Change trigger price of pending SL orders:

1. Click "Modify" on any pending order
2. Enter new trigger price
3. Confirm modification
4. Order updated in Dhan

**Limitations**:

- Can only modify trigger price
- Cannot change order type or quantity
- Order must be in PENDING status

#### Cancel Orders

Cancel any pending order:

1. Click "Cancel" on any pending order
2. Confirm cancellation
3. Order removed from Dhan orderbook

---

## API Reference

### Authentication

All API calls require:

- **Client ID**: In query params or headers
- **Access Token**: In Authorization header

```typescript
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

### Endpoints

#### GET /api/verify-connection

Verify Dhan API credentials and connection.

**Response**:

```json
{
  "success": true,
  "clientId": "1000000003",
  "userName": "John Doe"
}
```

#### GET /api/current-position

Get current open LONG position (options or intraday stock).

**Response**:

```json
{
  "tradingSymbol": "NIFTY2401624000CE",
  "exchangeSegment": "NSE_FNO",
  "securityId": "49081",
  "buyAvg": 368.15,
  "netQty": 50,
  "realizedProfit": 0,
  "unrealizedProfit": 117.5,
  "productType": "INTRADAY"
}
```

#### POST /api/place-sl-market-order

Place SL-Market order for current position.

**Request**:

```json
{
  "securityId": "49081",
  "exchangeSegment": "NSE_FNO",
  "transactionType": "SELL",
  "quantity": 50,
  "productType": "INTRADAY",
  "triggerPrice": 370.15
}
```

**Response**:

```json
{
  "success": true,
  "orderId": "123456789",
  "orderStatus": "PENDING"
}
```

#### POST /api/place-sl-limit-order

Place SL-Limit order for current position.

**Request**:

```json
{
  "securityId": "49081",
  "exchangeSegment": "NSE_FNO",
  "transactionType": "SELL",
  "quantity": 50,
  "productType": "INTRADAY",
  "price": 348.15,
  "triggerPrice": 350.15
}
```

#### POST /api/place-limit-order

Place LIMIT order (for take-profit).

**Request**:

```json
{
  "securityId": "49081",
  "exchangeSegment": "NSE_FNO",
  "transactionType": "SELL",
  "quantity": 50,
  "productType": "INTRADAY",
  "price": 380.15
}
```

#### GET /api/pending-sl-orders

Get all pending orders for current position.

**Query Params**:

- `securityId`: Security ID of position

**Response**:

```json
[
  {
    "orderId": "123456789",
    "tradingSymbol": "NIFTY2401624000CE",
    "orderType": "SL",
    "orderStatus": "PENDING",
    "triggerPrice": 370.15,
    "price": 368.15,
    "quantity": 50,
    "transactionType": "SELL"
  }
]
```

#### PUT /api/modify-sl-order

Modify trigger price of pending SL order.

**Request**:

```json
{
  "orderId": "123456789",
  "newTriggerPrice": 375.0
}
```

#### DELETE /api/cancel-sl-order

Cancel a pending order.

**Query Params**:

- `orderId`: Order ID to cancel

#### POST /api/exit-all

Exit all positions and cancel all orders.

**Response**:

```json
{
  "success": true,
  "positionsExited": 2,
  "ordersCancelled": 5
}
```

#### GET /api/order-book

Get full order book for today.

**Response**: Array of all orders placed today.

---

## WebSocket Implementation

### Overview

TradePilot uses Dhan's WebSocket API for real-time market data updates. This provides tick-by-tick price updates with sub-100ms latency.

### Architecture

```
┌─────────┐         ┌──────────────┐         ┌──────────┐
│ Browser │◄──WS───►│ DhanWebSocket│◄──WS───►│ Dhan API │
│         │         │   Service    │         │  Server  │
└─────────┘         └──────────────┘         └──────────┘
```

### WebSocket Service Class

**File**: `src/lib/dhan-websocket.ts`

#### Initialization

```typescript
import { DhanWebSocketService } from "@/lib/dhan-websocket";

const wsService = new DhanWebSocketService({
  feedMode: "QUOTE", // TICKER | QUOTE | FULL
  onConnect: () => console.log("Connected"),
  onDisconnect: () => console.log("Disconnected"),
  onError: (error) => console.error("Error:", error),
  onTickerUpdate: (data) => {
    console.log("Price:", data.ltp);
  },
  onReconnect: (attempt) => console.log("Reconnecting:", attempt),
});
```

#### Connection

```typescript
// Connect to WebSocket
await wsService.connect();

// Check connection status
if (wsService.isConnected()) {
  console.log("Connected!");
}
```

#### Subscription

```typescript
// Subscribe to instruments
wsService.subscribe(
  [
    {
      exchangeSegment: "NSE_FNO",
      securityId: "49081",
    },
    {
      exchangeSegment: "MCX_COMM",
      securityId: "488355",
    },
  ],
  "QUOTE",
); // Optional: Override feed mode
```

#### Disconnection

```typescript
// Gracefully disconnect
wsService.disconnect();
```

### Feed Modes

TradePilot supports three feed modes for different use cases:

#### 1. TICKER Mode (Request Code: 15)

**Update Frequency**: 1 second  
**Bandwidth**: ~1 KB/min per instrument  
**Latency**: ~1000ms

**Best For**:

- Slower internet connections
- Basic price tracking
- Position monitoring
- Battery-conscious mobile users

**Use Case**: You check prices every few seconds, not actively trading.

#### 2. QUOTE Mode (Request Code: 17) ✨ **DEFAULT**

**Update Frequency**: ~5 updates/second (~200ms)  
**Bandwidth**: ~15 KB/min per instrument  
**Latency**: ~200ms

**Best For**:

- Active day trading
- Most users
- Real-time feel without overwhelming device
- Balanced speed and stability

**Additional Data**: Full trade information, OHLC, volume (not currently parsed)

**Use Case**: Active intraday trading with good internet.

#### 3. FULL Mode (Request Code: 21)

**Update Frequency**: ~10 updates/second (~100ms)  
**Bandwidth**: ~120 KB/min per instrument  
**Latency**: ~100ms

**Best For**:

- Scalping
- High-frequency trading
- Professional traders
- Desktop with fast internet

**Additional Data**: Complete market depth, 5 levels bid/ask (not currently parsed)

**Use Case**: Every tick matters, need fastest updates possible.

### Feed Mode Comparison

| Feature         | TICKER  | QUOTE    | FULL  |
| --------------- | ------- | -------- | ----- |
| Updates/sec     | 1       | ~5       | ~10   |
| Latency         | 1000ms  | 200ms    | 100ms |
| Bandwidth       | Low     | Medium   | High  |
| CPU Usage       | Low     | Medium   | High  |
| Battery Impact  | Minimal | Moderate | High  |
| For Scalping    | ❌      | ⚠️       | ✅    |
| For Day Trading | ⚠️      | ✅       | ✅    |
| For Position    | ✅      | ✅       | ❌    |
| Mobile Friendly | ✅      | ✅       | ❌    |

### Binary Data Format

WebSocket data is in binary format (Little Endian):

#### Response Header (8 bytes)

```
Offset | Type   | Size | Description
-------|--------|------|------------------
0      | uint8  | 1    | Feed Response Code
1-2    | uint16 | 2    | Message Length
3      | uint8  | 1    | Exchange Segment Code
4-7    | int32  | 4    | Security ID
```

#### Ticker Packet (16 bytes total)

```
Offset | Type    | Size | Description
-------|---------|------|------------------
0-7    | header  | 8    | Response Header
8-11   | float32 | 4    | Last Traded Price (LTP)
12-15  | int32   | 4    | Last Trade Time (EPOCH)
```

### Exchange Segment Codes

```typescript
const EXCHANGE_SEGMENT_CODE = {
  NSE_EQ: 0,
  NSE_FNO: 1,
  NSE_CURR: 2,
  BSE_EQ: 3,
  BSE_FNO: 4,
  BSE_CURR: 5,
  MCX_COMM: 6,
  IDX_I: 13,
};
```

### Auto-Reconnection

The service handles disconnections gracefully:

- **Max Attempts**: 5
- **Delay**: 3 seconds × attempt number (3s, 6s, 9s, 12s, 15s)
- **Re-subscription**: Automatically re-subscribes to all instruments
- **User Notification**: Triggers `onReconnect` callback

### Connection Limits

- **Max Connections**: 5 per user
- **Max Instruments per Connection**: 5000
- **Max Instruments per Subscription Message**: 100

### Ping-Pong Mechanism

- Server sends ping every 10 seconds
- Browser automatically responds
- Connection closes after 40 seconds of no response
- TradePilot logs heartbeat in console

### Error Codes

- **805**: More than 5 connections
- **806**: Data APIs not subscribed
- **1006**: Connection closed abnormally
- **40s timeout**: No ping-pong response

---

## Trade Live Feature

### Navigation

- **REST Version**: http://localhost:3000/trade-live
- **WebSocket Version**: http://localhost:3000/trade-live-ws ⚡ **RECOMMENDED**

### Feature Comparison

| Feature    | REST API      | WebSocket             |
| ---------- | ------------- | --------------------- |
| Speed      | 1 sec updates | <100ms                |
| Method     | HTTP polling  | Persistent connection |
| Efficiency | 3600 calls/hr | Event-driven          |
| Real-time  | ❌            | ✅                    |
| Bandwidth  | High          | Low                   |
| Best For   | Testing       | Production            |

### How to Use

1. **Place a Trade in Dhan**
   - Buy any option or intraday stock
   - Wait for order to be TRADED

2. **Open Trade Live Page**
   - Click menu (☰) → "Trade Live (WebSocket)"
   - OR navigate to http://localhost:3000/trade-live-ws

3. **Select Feed Mode**
   - Choose TICKER, QUOTE, or FULL
   - QUOTE is recommended for most users
   - Cannot change while updates are running

4. **Enable Live Updates**
   - Toggle "Live Updates" switch to ON
   - Watch WebSocket connection status
   - See real-time price updates

5. **Monitor P&L**
   - Live price displayed
   - P&L in points
   - P&L in percentage
   - P&L in rupees
   - Color-coded (green = profit, red = loss)

### Live Position Card

Displays:

- Trading symbol
- Exchange segment
- Buy price
- Current price (live)
- P&L points (+2.35)
- P&L percentage (+0.64%)
- Total P&L (₹117.50)
- Last updated timestamp
- WebSocket connection status

### Feed Mode Selector

Three buttons to choose update speed:

- **TICKER**: 1 sec updates (most stable)
- **QUOTE**: ~200ms updates (recommended)
- **FULL**: ~100ms updates (fastest)

Descriptions:

- TICKER: "📊 Updates every 1 second - Most stable, lowest bandwidth"
- QUOTE: "🚀 Fast updates (~5 per second) - Recommended for most users"
- FULL: "⚡ Fastest updates (~10 per second) with market depth - Highest bandwidth"

### WebSocket Status Indicator

Shows connection status:

- 🟢 **Connected**: Active connection
- 🔴 **Disconnected**: No connection
- 🟡 **Reconnecting (N)**: Attempting to reconnect

### Performance

**WebSocket Advantages**:

- Real-time: <100ms latency
- Efficient: Event-driven, no polling
- Scalable: 5000 instruments per connection
- Auto-reconnect: Handles disconnections

**REST API**:

- 1 second delay
- Fixed polling (even when no changes)
- 3600 API calls per hour
- Good for testing only

---

## Troubleshooting

### Connection Issues

#### Error: "Connection error" or "401 Unauthorized"

**Cause**: Invalid Client ID or Access Token

**Solution**:

1. Verify credentials in `.env.local`
2. Regenerate Access Token from [web.dhan.co](https://web.dhan.co/)
3. Ensure no extra spaces in token
4. Restart the development server

```bash
# Restart server
# Press Ctrl+C, then:
npm run dev
```

#### Error: "EXCH:16052 - Function Not Available"

**Cause**: Static IP not configured (most common)

**Solution**:

1. Go to [web.dhan.co](https://web.dhan.co/)
2. Navigate to **My Profile** → **Access DhanHQ APIs**
3. Add your static IP address
4. Wait 5-10 minutes
5. Restart TradePilot

**Get Your IP**:

```bash
curl ifconfig.me
```

**Alternative Causes**:

- Trading segment not activated
- Market hours issue (outside trading hours)
- Product type mismatch

### Position Issues

#### "No open LONG position found"

**Cause**: No active long positions in account

**Solution**:

1. Place a BUY order in Dhan (option or intraday stock)
2. Wait for order to be TRADED (executed)
3. Click "Refresh Position" in TradePilot
4. Position should appear

#### Position shows wrong price

**Cause**: Using average buy price instead of last order price

**Solution**:

- TradePilot uses last traded order's buy price
- If you have multiple buys, it picks the most recent
- Check your orderbook in Dhan to verify

### WebSocket Issues

#### WebSocket not connecting

**Cause**: Data APIs not subscribed

**Solution**:

1. Login to [web.dhan.co](https://web.dhan.co/)
2. Go to API settings
3. Enable **Data APIs** subscription
4. May require additional payment
5. Restart TradePilot after enabling

**Error Code**: 806 - "Data APIs not Subscribed"

#### WebSocket keeps disconnecting

**Causes & Solutions**:

1. **Too many connections** (Error 805)
   - Max 5 connections per user
   - Close other TradePilot tabs/windows
   - Check if Dhan web UI is also using WebSocket

2. **Network issues**
   - Check internet connection
   - Try different network (WiFi vs mobile data)
   - Reduce feed mode (FULL → QUOTE → TICKER)

3. **Token expired**
   - Tokens expire after 24 hours
   - Regenerate token from Dhan
   - Update `.env.local`
   - Restart server

#### No price updates in WebSocket

**Checks**:

1. Is WebSocket connected? (check status indicator)
2. Is position valid? (check security ID)
3. Is market open? (check trading hours)
4. Try refreshing position
5. Check browser console for errors (F12)

### Order Placement Issues

#### Order placement fails

**Common Causes**:

1. **Static IP not set**: See "EXCH:16052" above
2. **Segment not activated**: Enable in Dhan account
3. **Market closed**: Check trading hours
4. **Invalid trigger price**: Check calculated price
5. **Insufficient margin**: Check account balance

#### Order placed but not showing in Dhan

**Solution**:

1. Wait 2-3 seconds (order processing delay)
2. Check orderbook in Dhan web/app
3. Check TradePilot pending orders section
4. Click "Refresh Orders" button
5. If still missing, check API response in browser console

### UI Issues

#### UI looks broken / no styling

**Cause**: CSS not loaded or build issue

**Solution**:

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Restart server
npm run dev
```

#### Buttons not working

**Cause**: JavaScript errors

**Solution**:

1. Open browser console (F12)
2. Look for red error messages
3. Refresh page (Ctrl+R / Cmd+R)
4. Clear browser cache
5. Try incognito/private window

### API Rate Limits

#### Getting rate limit errors

**Dhan Limits**:

- 1 request per second per endpoint
- Multiple endpoints can be called simultaneously
- WebSocket has separate limits

**Solution**:

- Use WebSocket for real-time data (more efficient)
- Avoid clicking "Refresh" repeatedly
- Add delays between API calls in code

### Market Hours

**Trading Hours** (IST):

- **NSE/BSE Equity**: 9:15 AM - 3:30 PM
- **NSE/BSE F&O**: 9:15 AM - 3:30 PM
- **NSE Currency**: 9:00 AM - 5:00 PM
- **MCX Commodities**: Varies by contract (usually 9:00 AM - 11:30 PM)

**Pre-Market**: 9:00 AM - 9:15 AM (not fully supported in TradePilot)

---

## Production Deployment

### ⚠️ CRITICAL: Security Issues

**Current Status**: 🚨 **DEV ONLY - NOT PRODUCTION SAFE**

**Issue**: WebSocket access token is exposed in browser via `NEXT_PUBLIC_DHAN_ACCESS_TOKEN`

**Risk**:

- Token visible in browser DevTools
- Anyone can steal your token
- Unauthorized trading possible
- Financial and compliance risks

### Production Checklist

Before deploying to production:

- [ ] **DO NOT** deploy current WebSocket implementation
- [ ] Implement server-side WebSocket proxy (see TODO_PRODUCTION_WEBSOCKET.md)
- [ ] Remove `NEXT_PUBLIC_DHAN_ACCESS_TOKEN` from env
- [ ] Use Socket.IO for client-server communication
- [ ] Keep token server-side only
- [ ] Implement authentication/authorization
- [ ] Add rate limiting
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure production environment variables
- [ ] Test with real trading scenarios
- [ ] Document deployment process

### Recommended Architecture (Production)

```
Browser ──Socket.IO──> Next.js Server ──WebSocket──> Dhan API
                       (Token hidden here)
```

**Benefits**:

- Token stays on server
- Client cannot see credentials
- Add authentication layer
- Rate limiting possible
- Better error handling

**Implementation Time**: 7-8 hours

**Files Needed**:

1. `src/lib/websocket-proxy-server.ts` - Server-side WebSocket handler
2. `server.js` - Custom Next.js server with Socket.IO
3. `src/lib/socket-client.ts` - Client-side Socket.IO wrapper
4. Update `src/app/trade-live-ws/page.tsx` - Use Socket.IO instead of direct WebSocket

**For Full Implementation**: See `TODO_PRODUCTION_WEBSOCKET.md` (744 lines)

### Deployment Platforms

#### Vercel (Recommended for REST-only)

**Pros**:

- Easy deployment
- Auto-scaling
- Built-in CI/CD
- Free tier available

**Cons**:

- Serverless (stateless)
- Cannot maintain WebSocket connections
- Custom server not supported

**Use For**: All features except WebSocket live updates

#### VPS / Cloud Server (Required for WebSocket)

**Platforms**:

- DigitalOcean Droplet
- AWS EC2
- Google Cloud Compute Engine
- Linode
- Vultr

**Requirements**:

- Node.js 18+
- PM2 or similar process manager
- Nginx reverse proxy (optional)
- SSL certificate (Let's Encrypt)
- Static IP

**Deployment**:

```bash
# On server
git clone <repo>
cd TradePilot
npm install
npm run build

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "tradepilot" -- start
pm2 save
pm2 startup
```

### Environment Variables (Production)

```env
# Server-side only
DHAN_ACCESS_TOKEN=<your_token>
DHAN_CLIENT_ID=<your_client_id>
NODE_ENV=production

# Public (safe to expose)
NEXT_PUBLIC_DHAN_CLIENT_ID=<your_client_id>
NEXT_PUBLIC_SL_OFFSET=2
NEXT_PUBLIC_SL_LIMIT_OFFSET=-20
NEXT_PUBLIC_TAKE_PROFIT_OFFSET=12

# Do NOT use in production:
# NEXT_PUBLIC_DHAN_ACCESS_TOKEN=<token>  ❌ UNSAFE
```

### Monitoring & Alerts

**Recommended Tools**:

- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Datadog**: Performance monitoring
- **PagerDuty**: Incident alerts

**Key Metrics to Monitor**:

- API error rates
- WebSocket connection failures
- Order placement success rate
- Average response times
- Token expiry warnings

---

## Development Guide

### Getting Started

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/my-new-feature
   ```
3. **Make changes**
4. **Test thoroughly**
5. **Commit with descriptive message**
   ```bash
   git commit -m "Add new feature: description"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/my-new-feature
   ```
7. **Create Pull Request**

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier (auto-format on save)
- **Linting**: ESLint
- **Components**: Functional components with hooks
- **Naming**: PascalCase for components, camelCase for functions
- **Comments**: Explain "why", not "what"

### Project Conventions

#### Component Structure

```typescript
'use client';  // If using client-side features

import { useState } from 'react';

interface MyComponentProps {
  title: string;
  count: number;
}

export default function MyComponent({ title, count }: MyComponentProps) {
  const [value, setValue] = useState(0);

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

#### Custom Hooks

```typescript
import { useState, useEffect } from "react";

export function useMyHook(initialValue: string) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    // Side effects
  }, [value]);

  return { value, setValue };
}
```

#### API Routes

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // API logic
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
```

### Testing

#### Manual Testing Checklist

- [ ] Connection verification works
- [ ] Position fetching works
- [ ] SL-Market order placement works
- [ ] SL-Limit order placement works
- [ ] Take-profit order placement works
- [ ] Order modification works
- [ ] Order cancellation works
- [ ] Exit all functionality works
- [ ] WebSocket connection works
- [ ] WebSocket updates are real-time
- [ ] Auto-reconnection works
- [ ] All three feed modes work
- [ ] Responsive design on mobile
- [ ] All buttons are clickable
- [ ] Alerts show correctly

#### Test with Different Assets

- [ ] NSE options (NIFTY, BANKNIFTY)
- [ ] BSE options
- [ ] MCX commodities (CRUDEOIL, GOLD, SILVER)
- [ ] NSE intraday stocks
- [ ] BSE intraday stocks

### Adding New Features

#### 1. Create API Route

**File**: `src/app/api/my-feature/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { DhanAPI } from "@/lib/dhan-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const api = new DhanAPI();

    // Your logic here
    const result = await api.someMethod(body);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
```

#### 2. Add Service Method

**File**: `src/services/api.ts`

```typescript
async myNewFeature(params: any) {
  const response = await fetch('/api/my-feature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return response.json();
}
```

#### 3. Create Component

**File**: `src/components/MyNewComponent.tsx`

```typescript
'use client';

import { useState } from 'react';

export default function MyNewComponent() {
  const [state, setState] = useState(null);

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      {/* Your component UI */}
    </div>
  );
}
```

#### 4. Add to Main Page

**File**: `src/app/page.tsx`

```typescript
import MyNewComponent from '@/components/MyNewComponent';

// In the return statement:
<MyNewComponent />
```

### Debugging Tips

#### Browser Console

```typescript
// Add console logs
console.log("🔍 Debug:", variable);
console.error("❌ Error:", error);
console.table(arrayData);
```

#### Network Tab

- Check API requests/responses
- Verify request headers
- Check response status codes
- Inspect WebSocket frames

#### React DevTools

- Inspect component state
- Track re-renders
- Profile performance

#### Common Issues

1. **State not updating**: Check if using previous state correctly
2. **Re-render loops**: Check useEffect dependencies
3. **API not working**: Verify .env.local variables
4. **WebSocket not connecting**: Check Data APIs subscription

---

## Additional Resources

### Official Documentation

- **Dhan API Docs**: https://dhanhq.co/docs/v2/
- **Next.js Docs**: https://nextjs.org/docs
- **React Docs**: https://react.dev/
- **Tailwind CSS**: https://tailwindcss.com/docs

### Dhan API Endpoints

- **API Base**: https://api.dhan.co/v2
- **WebSocket**: wss://api-feed.dhan.co
- **Auth**: https://api.dhan.co/v2/auth

### Support

- **GitHub Issues**: https://github.com/biswajit-debnath/TradePilot/issues
- **Dhan Support**: support@dhan.co
- **API Support**: dhanhq.co/support

---

## License

MIT License - See LICENSE file for details

---

## Credits

**Developed By**: Biswajit Debnath  
**GitHub**: https://github.com/biswajit-debnath  
**Repository**: https://github.com/biswajit-debnath/TradePilot

**Built With**:

- Next.js 16.1.2
- React 18
- TypeScript
- Tailwind CSS
- Dhan Trading API v2

---

## Changelog

### Version 2.0 (January 2026)

- Added WebSocket real-time updates
- Added three feed modes (TICKER, QUOTE, FULL)
- Added Trade Live feature
- Improved UI with glassmorphism
- Added drawer navigation
- Enhanced error handling
- Added auto-reconnection

### Version 1.0 (December 2025)

- Initial release
- Basic position management
- SL order placement
- Take-profit orders
- Exit all functionality

---

**Last Updated**: January 20, 2026  
**Version**: 2.0  
**Status**: Development (WebSocket requires production fixes before deployment)

---

_For the most up-to-date information, visit the [GitHub repository](https://github.com/biswajit-debnath/TradePilot)._
