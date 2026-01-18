# Dhan SL Order App - Setup Guide

## 🚀 Quick Start

### 1. Configure Credentials

Edit `.env.local` file in the `dhan_sl_nextjs` folder:

```env
NEXT_PUBLIC_DHAN_CLIENT_ID=1000000003
DHAN_ACCESS_TOKEN=eyJhbGciOiJIUzUxMiJ9.eyJkaGFuQ...
NEXT_PUBLIC_SL_OFFSET=2
```

### 2. How to Get Credentials

#### **Dhan Client ID:**
- Login to https://web.dhan.co/
- Click on your profile (top right)
- Your Client ID is displayed there

#### **Access Token:**
1. Login to https://web.dhan.co/
2. Click **My Profile** (top right)
3. Click **Access DhanHQ APIs**
4. Click **Generate Access Token**
5. Copy the token and paste into `.env.local`

**Important:** Token is valid for 24 hours only. You need to regenerate it daily.

### 3. Setup Static IP (REQUIRED for placing orders)

As per SEBI guidelines, you must whitelist your static IP address:

1. Go to https://web.dhan.co/
2. Click **My Profile** → **Access DhanHQ APIs**
3. Click on **Static IP** section
4. Add your **Primary Static IP**
5. Optionally add **Secondary IP**

**Note:** 
- You need a static IP from your Internet Service Provider (ISP)
- Home broadband usually has dynamic IP (changes frequently)
- Once set, IP cannot be modified for 7 days
- Without static IP, you can only READ data, not PLACE orders

### 4. Restart the App

After editing `.env.local`, restart the dev server:

```bash
# Press Ctrl+C in the terminal to stop
# Then run again:
npm run dev
```

## 📊 Testing the App

### Test 1: Check Connection
- Open http://localhost:3000
- Top left should show: **"Connected: YOUR_CLIENT_ID"**
- If it shows "Connection error", check your credentials

### Test 2: Place a Test Trade in Dhan
1. Login to Dhan mobile app or web
2. Go to **Options** trading
3. Select any CALL or PUT option
4. Place a **BUY MARKET** order (small quantity for testing)
5. Wait for order to be **TRADED** (executed)

### Test 3: Place SL Order via App
1. Refresh the app page
2. Click **"Fetch Order"** button
3. You should see your last option trade details
4. Buy Price and SL Trigger Price will be displayed
5. Click **"Place SL-M Order"** button
6. Check Dhan UI - the SL order should appear in your orderbook

## 🔍 Troubleshooting

### "Connection error" or "401 Unauthorized"
- **Cause:** Invalid Client ID or Access Token
- **Fix:** 
  1. Verify credentials in `.env.local`
  2. Regenerate Access Token from web.dhan.co
  3. Restart the app

### "No traded option order found"
- **Cause:** No option BUY orders executed today
- **Fix:** Place a BUY order for any option in Dhan UI first

### "Failed to place SL order" or "Static IP error"
- **Cause:** Static IP not configured
- **Fix:** Setup static IP in web.dhan.co (see step 3 above)

### API returns 400 error
- **Cause:** Missing or incorrect parameters
- **Check:** Browser console (F12) for detailed error messages

### UI looks broken / no styling
- **Cause:** Tailwind CSS not loading properly
- **Fix:** 
  1. Delete `.next` folder
  2. Restart: `npm run dev`

## 📝 Environment Variables Explained

| Variable | Type | Description |
|----------|------|-------------|
| `NEXT_PUBLIC_DHAN_CLIENT_ID` | Public | Your Dhan Client ID (visible in browser) |
| `DHAN_ACCESS_TOKEN` | Private | Your Access Token (server-side only, never sent to browser) |
| `NEXT_PUBLIC_SL_OFFSET` | Public | Stop loss offset in points (default: 2) |

**Security Note:** Only variables starting with `NEXT_PUBLIC_` are accessible in the browser. `DHAN_ACCESS_TOKEN` is server-side only and never exposed to the client.

## 🎯 Flow Diagram

```
User Places Option BUY → Option Gets TRADED → Price Moves Up
                                                      ↓
                                            User Clicks "Place SL"
                                                      ↓
                                    App Fetches Last Option Order
                                                      ↓
                                    Gets Buy Price (e.g., ₹100)
                                                      ↓
                                    Calculates Trigger: ₹100 + 2 = ₹102
                                                      ↓
                                    Places SL-M SELL Order at ₹102
                                                      ↓
                                    Order Appears in Dhan UI
                                                      ↓
                        If Price Falls to ₹102 → SL Triggers → Position Exits
```

## 🔐 Security Best Practices

1. **Never commit `.env.local`** to git (it's in `.gitignore`)
2. **Keep Access Token secret** - don't share screenshots
3. **Regenerate token** if you suspect it's compromised
4. **Use strong password** on your Dhan account
5. **Enable 2FA** on Dhan account

## 📚 Additional Resources

- [Dhan API Documentation](https://dhanhq.co/docs/v2/)
- [Order Types Explained](https://dhanhq.co/docs/v2/orders/)
- [Exchange Segments](https://dhanhq.co/docs/v2/annexure/)
- [Error Codes](https://dhanhq.co/docs/v2/annexure/#trading-api-error)

## 💡 Tips

1. **Start small**: Test with 1 lot of cheap options first
2. **Check orders**: Always verify SL is placed in Dhan UI
3. **Monitor regularly**: Token expires in 24 hours
4. **Paper trade first**: Get comfortable before using real money
5. **Set alerts**: In Dhan app for SL trigger notifications

## 🐛 Common Mistakes

❌ **Forgetting to restart app** after editing `.env.local`
✅ Always restart: Ctrl+C, then `npm run dev`

❌ **Testing with pending orders** instead of traded orders
✅ Wait for order status = "TRADED" before fetching

❌ **Wrong exchange segment** (trying with equity instead of options)
✅ Only works with NSE_FNO or BSE_FNO (Options)

❌ **Using dynamic IP** to place orders
✅ Setup static IP whitelisting (mandatory)

## 📞 Support

If you encounter issues:
1. Check browser console (F12) for errors
2. Check terminal for server errors
3. Verify API status at https://dhanhq.co/
4. Read Dhan API docs for error codes
