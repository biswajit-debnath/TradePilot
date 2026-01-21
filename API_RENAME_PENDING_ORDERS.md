# API Endpoint Rename: pending-sl-orders → pending-orders

## 🔄 Changes Made

Renamed the API endpoint from `/api/pending-sl-orders` to `/api/pending-orders` to make it more generic, as it handles all types of pending orders, not just SL orders.

## 📝 Files Changed

### 1. **API Route**

- **Created**: `/src/app/api/pending-orders/route.ts`
- **Deleted**: `/src/app/api/pending-sl-orders/route.ts`
- **Endpoint**: `GET /api/pending-orders`

### 2. **API Service** (`/src/services/api.ts`)

- Updated `getPendingSLOrders()` method to call `/api/pending-orders`
- Comment updated from "Get all pending SL orders" to "Get all pending orders"

### 3. **Documentation**

- **README.md**:
  - Updated API endpoints table
  - Updated project structure diagram
- **DOCUMENTATION.md**:
  - Updated project structure diagram
  - Updated API endpoint documentation section

## 🔌 API Details

### Endpoint: GET /api/pending-orders

**Description**: Get all pending orders for the current position

**Response**:

```json
{
  "success": true,
  "orders": [
    {
      "order_id": "string",
      "symbol": "string",
      "quantity": number,
      "trigger_price": number,
      "limit_price": number,
      "order_type": "string",
      "transaction_type": "string",
      "status": "string",
      "create_time": "string",
      "security_id": "string"
    }
  ]
}
```

## ✅ Migration Notes

- **No breaking changes to functionality** - only the endpoint URL changed
- Method name `getPendingSLOrders()` kept the same for backward compatibility in the codebase
- All references updated across documentation and code

## 🎯 Impact

- ✅ More accurate naming - endpoint handles all pending orders, not just SL orders
- ✅ Better API design - generic naming allows for future expansion
- ✅ Cleaner documentation - more intuitive for developers

## 📅 Date

January 21, 2026
