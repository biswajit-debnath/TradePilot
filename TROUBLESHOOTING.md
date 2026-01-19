# TradePilot - Troubleshooting Guide

## Common Errors and Solutions

### 🔴 Error: EXCH:16052 - Function Not Available

This is the most common error when placing orders. Here are the solutions:

#### 1. **Static IP Not Configured** (Most Common)
**Problem:** Dhan requires your IP address to be whitelisted for order placement.

**Solution:**
1. Go to [web.dhan.co](https://web.dhan.co/)
2. Click **My Profile** → **Access DhanHQ APIs**
3. Scroll to **Static IP** section
4. Add your **Primary Static IP address**
5. Wait 5-10 minutes for the change to take effect
6. Restart TradePilot

**How to get your Static IP:**
```bash
# Check your current IP
curl ifconfig.me
```

**Important Notes:**
- You need a **static IP** from your ISP (home broadband usually has dynamic IP)
- Once set, IP cannot be changed for 7 days
- Without static IP, you can only READ data, not PLACE orders

---

#### 2. **Trading Segment Not Activated**
**Problem:** Your Dhan account may not have the required trading segment activated.

**Solution:**
1. Login to [web.dhan.co](https://web.dhan.co/)
2. Go to **My Profile**
3. Check **Active Segments**
4. Ensure you have:
   - `NSE_FNO` for NSE options
   - `BSE_FNO` for BSE options
   - `MCX_COMM` for MCX commodities
   - `NSE_EQ` / `BSE_EQ` for equity intraday

If missing, activate them from your Dhan account settings.

---

#### 3. **Market Hours Issue**
**Problem:** Trying to place orders when market is closed.

**Solution:**
Check if you're within trading hours:
- **NSE/BSE Equity & F&O:** 9:15 AM - 3:30 PM IST
- **MCX Commodities:** Varies by contract (usually 9:00 AM - 11:30 PM IST)

**Pre-Market / Post-Market:**
- For pre-market orders, you need to set `afterMarketOrder: true` (not currently supported in TradePilot)

---

#### 4. **Product Type Mismatch**
**Problem:** Using wrong product type for the position.

**Common Issues:**
- Trying to place `INTRADAY` order on a `CNC` position
- Using `MARGIN` instead of `INTRADAY`

**Solution:**
TradePilot automatically uses the same product type as your position. If you see this error:
1. Check your original order's product type in Dhan
2. Ensure you're using the same product type
3. For options, use `INTRADAY` product type

---

#### 5. **Exchange Segment Mismatch**
**Problem:** Incorrect exchange segment for the security.

**Solution:**
- NSE Options/Futures: `NSE_FNO`
- BSE Options/Futures: `BSE_FNO`
- MCX Commodities: `MCX_COMM`
- NSE Equity: `NSE_EQ`
- BSE Equity: `BSE_EQ`

TradePilot auto-detects this, but ensure your position data is correct.

---

### 🟡 Other Common Errors

#### Error: "No open LONG position found"
**Cause:** No active long positions in your account.

**Solution:**
1. Place a BUY order in Dhan first (option or intraday stock)
2. Wait for order to be TRADED
3. Click **"Refresh Position"** in TradePilot
4. Position should appear

---

#### Error: "Connection error" or "401 Unauthorized"
**Cause:** Invalid credentials or expired token.

**Solution:**
1. Check `.env.local` file:
   ```env
   NEXT_PUBLIC_DHAN_CLIENT_ID=YOUR_CLIENT_ID
   DHAN_ACCESS_TOKEN=YOUR_ACCESS_TOKEN
   ```
2. Regenerate Access Token (valid for 24 hours):
   - Go to [web.dhan.co](https://web.dhan.co/)
   - **My Profile** → **Access DhanHQ APIs**
   - Click **Generate Access Token**
   - Copy and paste into `.env.local`
3. Restart the app: `Ctrl+C` then `npm run dev`

---

#### Error: "Invalid position data. Missing required fields"
**Cause:** Position data from Dhan API is incomplete.

**Solution:**
1. Check browser console (F12) for detailed logs
2. Look for the position data structure
3. Ensure the position has:
   - `exchangeSegment`
   - `productType`
   - `securityId`
   - `netQty > 0`

If any field is missing, the position might be corrupted. Try:
1. Exit the position manually in Dhan
2. Place a fresh order
3. Try again

---

#### Error: "Cannot place SL order. No long position to protect"
**Cause:** Position has `netQty <= 0` (short or closed).

**Solution:**
- TradePilot currently only supports LONG positions
- If you have a SHORT position, the SL logic is different
- Close the short position manually or wait for implementation of short position support

---

### 🔧 Debugging Steps

If you're still facing issues:

1. **Check Browser Console (F12):**
   - Look for 📤 and ❌ log messages
   - They show the exact order data being sent

2. **Check Terminal Logs:**
   - Server-side errors appear here
   - Look for Dhan API responses

3. **Verify Position Data:**
   ```javascript
   // Open browser console and check:
   console.log(lastOrder);
   ```

4. **Test in Dhan UI First:**
   - Try placing the same order manually in Dhan
   - If it fails there too, it's a Dhan account issue
   - If it works, it's a TradePilot issue

5. **Check Network Tab (F12):**
   - Look at the request to `/api/place-sl-market-order`
   - Check the response for detailed error messages

---

### 📞 Still Need Help?

1. **Check Dhan API Status:**
   - Visit [dhanhq.co](https://dhanhq.co/)
   - Check if API is down or maintenance

2. **Review Dhan API Docs:**
   - [Orders API](https://dhanhq.co/docs/v2/orders/)
   - [Error Codes](https://dhanhq.co/docs/v2/annexure/#trading-api-error)

3. **Common Dhan Error Codes:**
   - `EXCH:16052` - Function not available (static IP issue)
   - `EXCH:16053` - Order rejection (various reasons)
   - `EXCH:16003` - Invalid order parameters
   - `EXCH:16001` - Insufficient margin

---

## Quick Checklist

Before placing orders, ensure:

- ✅ Static IP configured in Dhan
- ✅ Access token is fresh (< 24 hours old)
- ✅ Market is open
- ✅ Trading segment activated
- ✅ You have an open LONG position
- ✅ Position has valid data (check console)
- ✅ TradePilot is running (`npm run dev`)

---

## Pro Tips

1. **Test with small quantity first** (1 lot)
2. **Use Dhan web UI in parallel** to verify positions
3. **Regenerate token daily** (set a reminder)
4. **Check console logs** before reporting issues
5. **Keep Dhan app open** for instant notifications

---

Last updated: January 19, 2026
