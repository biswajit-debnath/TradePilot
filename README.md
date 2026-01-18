# Dhan SL Order App (Next.js)

A Next.js application for placing Stop Loss Market (SL-M) orders on your option trades using the Dhan API.

## 📋 Features

- **Full Stack Next.js** - No separate backend needed
- Automatically fetches your last traded option BUY order
- Places SL-M order at **Buy Price + 2 points** (configurable)
- Beautiful dark theme UI with Tailwind CSS
- View and manage pending SL orders
- Real-time connection status

## 🚀 How It Works

1. You place a CALL/PUT option buy order in Dhan UI (e.g., at ₹100)
2. Price moves in your favor (e.g., ₹100 → ₹106)
3. Click **"Place SL Order"** button
4. App fetches your buy price (₹100) and places SL-M at ₹102 (buy price + 2)
5. The SL order appears in Dhan UI
6. If price falls to ₹102, SL triggers and position exits at market price

## 📦 Installation

1. **Install dependencies:**
   ```bash
   cd dhan_sl_nextjs
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
   NEXT_PUBLIC_SL_OFFSET=2
   ```

   **Getting Access Token:**
   - Login to [web.dhan.co](https://web.dhan.co/)
   - Click on **My Profile** → **Access DhanHQ APIs**
   - Generate Access Token (valid for 24 hours)

3. **Setup Static IP (Required for Order Placement):**
   - Go to [web.dhan.co](https://web.dhan.co/) → My Profile → DhanHQ APIs
   - Set your primary (and optionally secondary) static IP
   - Note: You need a static IP from your ISP

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

## 📊 API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/verify-connection` | GET | Verify Dhan API connection |
| `/api/current-position` | GET | Get current open position (options/stocks) |
| `/api/place-sl-market-order` | POST | Place SL-Market order for position |
| `/api/place-sl-limit-order` | POST | Place SL-Limit order for position |
| `/api/pending-sl-orders` | GET | Get pending SL orders |
| `/api/modify-sl-order` | PUT | Modify SL trigger price |
| `/api/cancel-sl-order` | DELETE | Cancel SL order |
| `/api/exit-all` | POST | Exit all positions & cancel all orders |
| `/api/order-book` | GET | Get full order book |

## 📁 Project Structure

```
dhan_sl_nextjs/
├── src/
│   ├── app/
│   │   ├── api/                    # API Routes
│   │   │   ├── verify-connection/
│   │   │   ├── last-option-order/
│   │   │   ├── place-sl-order/
│   │   │   ├── pending-sl-orders/
│   │   │   ├── modify-sl-order/
│   │   │   ├── cancel-sl-order/
│   │   │   └── order-book/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx               # Main UI
│   ├── config/
│   │   └── index.ts               # Configuration
│   ├── lib/
│   │   └── dhan-api.ts            # Dhan API client
│   ├── services/
│   │   └── api.ts                 # Frontend API service
│   └── types/
│       └── index.ts               # TypeScript types
├── .env.local.example
├── package.json
└── README.md
```

## ⚠️ Important Notes

1. **Static IP Required**: Dhan requires static IP whitelisting for order placement APIs (SEBI requirement).

2. **Access Token Validity**: Token is valid for 24 hours. Regenerate daily from web.dhan.co.

3. **Server-side API Calls**: All Dhan API calls happen server-side via Next.js API routes. Your access token is never exposed to the browser.

4. **Order Types**:
   - `STOP_LOSS_MARKET` (SL-M): Triggers at trigger price, executes at market
   - `STOP_LOSS` (SL-L): Triggers at trigger price, executes at limit price

## 🔧 Customization

### Change SL Offset
Edit `.env.local`:
```env
NEXT_PUBLIC_SL_OFFSET=3
```

Or edit `src/config/index.ts` directly.

### Custom Trigger Price
The Place SL Order API accepts an optional body:
```json
{
  "trigger_price": 105.5
}
```

## 📚 Dhan API Documentation

- [Orders API](https://dhanhq.co/docs/v2/orders/)
- [Authentication](https://dhanhq.co/docs/v2/authentication/)
- [Annexure](https://dhanhq.co/docs/v2/annexure/)

## 🛠️ Tech Stack

- **Next.js 14** - React framework with API routes
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Dhan API v2** - Trading API
