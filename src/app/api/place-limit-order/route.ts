// API Route: Place LIMIT Order (for SL and TP with better execution)
import { NextRequest, NextResponse } from 'next/server';
import { dhanApi } from '@/lib/dhan-api';
import { calculateQuantityFromLotSize } from '@/lib/lot-size-helper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      offset, 
      is_tp = false,
      lot_size = 1, // Number of lots to trade (for F&O)
      // Position data passed from frontend (optional - for optimization)
      position_data
    } = body;

    if (offset === undefined) {
      return NextResponse.json(
        { success: false, error: 'offset is required' },
        { status: 400 }
      );
    }

    // Use position data from frontend if provided, otherwise fetch from API
    let position;
    let buyPrice: number;
    
    if (position_data) {
      // Use cached position data from frontend
      console.log('📦 Using cached position data from frontend');
      position = {
        tradingSymbol: position_data.symbol,
        exchangeSegment: position_data.exchange_segment,
        productType: position_data.product_type,
        securityId: position_data.security_id,
        netQty: position_data.quantity,
      };
      buyPrice = position_data.buy_price;
    } else {
      // Fallback: Fetch position from API
      console.log('🔄 Fetching position from API');
      const fetchedPosition = await dhanApi.getLastOpenPosition();
      
      if (!fetchedPosition) {
        return NextResponse.json(
          { success: false, error: 'No open LONG position found' },
          { status: 400 }
        );
      }
      
      position = fetchedPosition;
      
      // Get the actual buy price from the last traded order for THIS specific position
      const lastOrder = await dhanApi.getLastTradedBuyOrder(fetchedPosition.securityId);
      buyPrice = lastOrder?.price || fetchedPosition.buyAvg;
    }

    // Calculate actual quantity from lot size
    // For F&O: quantity = lot_size × lot_multiplier (e.g., 2 lots of NIFTY = 130 qty)
    // For stocks: quantity = lot_size × 1 (e.g., 2 lots = 2 qty)
    // The helper function returns lot_multiplier=1 for non-F&O symbols
    const actualQuantity = calculateQuantityFromLotSize(position.tradingSymbol, lot_size);

    console.log(`📊 Position: ${position.tradingSymbol}`);
    console.log(`   Buy Price: ${buyPrice}`);
    console.log(`   Lot Size: ${lot_size} → Quantity: ${actualQuantity}`);
    
    let limitPrice: number;
    let correlationIdPrefix: string;
    
    if (is_tp || (offset && offset > 0)) {
      // Take Profit logic: Buy + offset (e.g., buy at 100, TP at 112)
      limitPrice = Number((buyPrice + offset).toFixed(1));
      correlationIdPrefix = 'TP_LIMIT_';
      
      console.log('🎯 Placing TP Limit Order:', {
        buyPrice,
        offset,
        limitPrice
      });
    } else {
      // Stop Loss logic: Buy + offset (offset is negative for SL)
      limitPrice = Number((buyPrice + offset).toFixed(1));
      correlationIdPrefix = 'SL_LIMIT_';
      
      console.log('🛡️ Placing SL Limit Order:', {
        buyPrice,
        offset,
        limitPrice
      });
    }

    if (limitPrice <= 0) {
      return NextResponse.json(
        { success: false, error: 'Calculated limit price is invalid (negative or zero)' },
        { status: 400 }
      );
    }

    // Place LIMIT SELL order (not STOP_LOSS, just regular LIMIT)
    const response = await dhanApi.placeLimitOrder({
      transactionType: 'SELL',
      exchangeSegment: position.exchangeSegment,
      productType: position.productType,
      securityId: position.securityId,
      quantity: actualQuantity,
      price: limitPrice,
      correlationId: `${correlationIdPrefix}${position.securityId}`,
    });

    return NextResponse.json({
      success: true,
      order_id: response.orderId,
      order_status: response.orderStatus,
      buy_price: buyPrice,
      limit_price: limitPrice,
      symbol: position.tradingSymbol,
      quantity: actualQuantity,
      lot_size: lot_size,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to place Limit order:', message);
    
    // Parse Dhan-specific errors
    let userFriendlyMessage = message;
    if (message.includes('EXCH:16052')) {
      userFriendlyMessage = 'Order placement failed: EXCH:16052 - Function Not Available. ' +
        'Possible causes:\n' +
        '1. Static IP not whitelisted in Dhan settings\n' +
        '2. Trading not allowed for this segment\n' +
        '3. Market is closed or pre-market/post-market hours\n' +
        '4. Product type or exchange segment mismatch\n\n' +
        'Please check your Dhan account settings and ensure static IP is configured.';
    } else if (message.includes('EXCH:')) {
      userFriendlyMessage = `Dhan API Error: ${message}\n\nPlease check:\n` +
        '- Your account permissions\n' +
        '- Market hours\n' +
        '- Static IP configuration';
    }
    
    return NextResponse.json(
      { success: false, error: userFriendlyMessage },
      { status: 500 }
    );
  }
}
