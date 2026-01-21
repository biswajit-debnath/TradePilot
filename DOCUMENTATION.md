# TradePilot

**Automate. Trade. Win.**

Your intelligent trading co-pilot for the Dhan ecosystem. From smart stop-loss and take-profit orders to advanced algorithmic strategies, TradePilot puts your trading on autopilot.

## ðŸ“‹ Features

- **Intelligent Position Management** - Real-time tracking with P&L display
- **Smart Stop-Loss Orders** - SL-Market (Buy+2) and SL-Limit (Buy-20) protection
- **Take-Profit Automation** - Auto-book profits at configurable targets
- **Multi-Asset Support** - Options (NSE/BSE/MCX) and intraday stocks
- **Exit All Panic Button** - Emergency close all positions with one click
- **Beautiful Glassmorphism UI** - Dark theme with gradient effects
- **Real-time Order Management** - View, modify, and cancel pending orders
- **Position-Based Logic** - Tracks actual holdings, not historical orders

## ðŸš€ How It Works

1. You place a CALL/PUT option or intraday stock buy order in Dhan (e.g., at â‚¹100)
2. Price moves in your favor (e.g., â‚¹100 â†’ â‚¹106)
3. Open TradePilot and see your current position with live P&L
4. Click **"+ SL-M +2"** to protect profits at â‚¹102 (buy + 2)
5. Or click **"ðŸ”» SL-Limit -20"** for deeper protection at â‚¹80
6. Or click **"ðŸŽ¯ Take Profit +12"** to auto-exit at â‚¹112
7. Orders appear in TradePilot's pending orders section
8. Monitor and manage all orders from one place

## ðŸ“¦ Installation

1. **Install dependencies:**

   ```bash
   cd tradepilot
   npm install
   ```

2. **Configure credentials:**

   Copy the example env file:

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` with your Dhan credentials:

   ```env
   NEXT_PUBLIC_DHAN_CLIENT_ID=YOUR_CLIENT_ID
   DHAN_ACCESS_TOKEN=YOUR_ACCESS_TOKEN
   NEXT_PUBLIC_PP_OFFSET=2
   ```

   **Getting Access Token:**
   - Login to [web.dhan.co](https://web.dhan.co/)
   - Click on **My Profile** â†’ **Access DhanHQ APIs**
   - Generate Access Token (valid for 24 hours)

3. **Setup Static IP (Required for Order Placement):**
   - Go to [web.dhan.co](https://web.dhan.co/) â†’ My Profile â†’ DhanHQ APIs
   - Set your primary (and optionally secondary) static IP
   - Note: You need a static IP from your ISP

4. **Run the development server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## ðŸ“Š API Routes

| Endpoint                     | Method | Description                                |
| ---------------------------- | ------ | ------------------------------------------ |
| `/api/verify-connection`     | GET    | Verify Dhan API connection                 |
| `/api/current-position`      | GET    | Get current open position (options/stocks) |
| `/api/place-sl-market-order` | POST   | Place SL-Market order for position         |
| `/api/place-sl-limit-order`  | POST   | Place SL-Limit order for position          |
| `/api/pending-orders`        | GET    | Get pending orders                         |
| `/api/modify-sl-order`       | PUT    | Modify SL trigger price                    |
| `/api/cancel-sl-order`       | DELETE | Cancel SL order                            |
| `/api/exit-all`              | POST   | Exit all positions & cancel all orders     |
| `/api/order-book`            | GET    | Get full order book                        |

## ðŸ“ Project Structure

```
tradepilot/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”œâ”€â”€ api/                    # API Routes
â”‚   â”‚   â”‚   â”œâ”€â”€ verify-connection/
â”‚   â”‚   â”‚   â”œâ”€â”€ last-option-order/
â”‚   â”‚   â”‚   â”œâ”€â”€ place-sl-order/
â”‚   â”‚   â”‚   â”œâ”€â”€ pending-orders/
â”‚   â”‚   â”‚   â”œâ”€â”€ modify-sl-order/
â”‚   â”‚   â”‚   â”œâ”€â”€ cancel-sl-order/
â”‚   â”‚   â”‚   â””â”€â”€ order-book/
â”‚   â”‚   â”œâ”€â”€ globals.css
â”‚   â”‚   â”œâ”€â”€ layout.tsx
â”‚   â”‚   â””â”€â”€ page.tsx               # Main UI
â”‚   â”œâ”€â”€ config/
â”‚   â”‚   â””â”€â”€ index.ts               # Configuration
â”‚   â”œâ”€â”€ lib/
â”‚   â”‚   â””â”€â”€ dhan-api.ts            # Dhan API client
â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â””â”€â”€ api.ts                 # Frontend API service
â”‚   â””â”€â”€ types/
â”‚       â””â”€â”€ index.ts               # TypeScript types
â”œâ”€â”€ .env.local.example
â”œâ”€â”€ package.json
â””â”€â”€ README.md
```

## âš ï¸ Important Notes

1. **Static IP Required**: Dhan requires static IP whitelisting for order placement APIs (SEBI requirement).

2. **Access Token Validity**: Token is valid for 24 hours. Regenerate daily from web.dhan.co.

3. **Server-side API Calls**: All Dhan API calls happen server-side via Next.js API routes. Your access token is never exposed to the browser.

4. **Order Types**:
   - `STOP_LOSS_MARKET` (SL-M): Triggers at trigger price, executes at market
   - `STOP_LOSS` (SL-L): Triggers at trigger price, executes at limit price

## ðŸ”§ Customization

### Change SL Offset

Edit `.env.local`:

```env
NEXT_PUBLIC_PP_OFFSET=3
```

Or edit `src/config/index.ts` directly.

### Custom Trigger Price

The Place SL Order API accepts an optional body:

```json
{
  "trigger_price": 105.5
}
```

## ðŸ“š Dhan API Documentation

- [Orders API](https://dhanhq.co/docs/v2/orders/)
- [Authentication](https://dhanhq.co/docs/v2/authentication/)
- [Annexure](https://dhanhq.co/docs/v2/annexure/)

## ðŸ› ï¸ Tech Stack

- **Next.js 14** - React framework with API routes
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Dhan API v2** - Trading API

