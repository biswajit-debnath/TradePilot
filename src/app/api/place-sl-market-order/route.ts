// API Route: Place SL-Market Order
import { NextRequest, NextResponse } from 'next/server';
import { dhanApi } from '@/lib/dhan-api';
import { DHAN_CONFIG } from '@/config';

export async function POST(request: NextRequest) {
  try {
    // Get optional parameters from request body
    let customTriggerPrice: number | undefined;
    let pointsOffset: number | undefined;
    
    try {
      const body = await request.json();
      customTriggerPrice = body?.trigger_price;
      pointsOffset = body?.points_offset;
    } catch {
      // No body or invalid JSON, use default calculation
    }

    // Get the last open position
    const position = await dhanApi.getLastOpenPosition();
    
    if (!position) {
      return NextResponse.json(
        { success: false, error: 'No open LONG position found' },
        { status: 400 }
      );
    }

    // Get the actual buy price from the last traded order (not average)
    const lastOrder = await dhanApi.getLastTradedBuyOrder();
    const buyPrice = lastOrder?.price || position.buyAvg;
    
    console.log(`📊 Position: ${position.tradingSymbol}`);
    console.log(`   Order Buy Price: ${lastOrder?.price || 'N/A'}`);
    console.log(`   Position Avg Price: ${position.buyAvg}`);
    console.log(`   Using: ${buyPrice} (from ${lastOrder?.price ? 'order' : 'position avg'})`);
    
    // Validate position data
    if (!position.exchangeSegment || !position.productType || !position.securityId) {
      console.error('Invalid position data:', position);
      return NextResponse.json(
        { success: false, error: 'Invalid position data. Missing required fields.' },
        { status: 400 }
      );
    }

    if (position.netQty <= 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot place SL order. No long position to protect.' },
        { status: 400 }
      );
    }
    
    // Calculate trigger price based on priority: custom price > points offset > default offset
    let triggerPrice: number;
    let correlationIdPrefix = 'SL_'; // Default for stop loss
    
    if (customTriggerPrice !== undefined) {
      triggerPrice = customTriggerPrice;
    } else if (pointsOffset !== undefined) {
      triggerPrice = buyPrice + pointsOffset;
      // If points offset is positive and large, it's likely a take profit
      if (pointsOffset > 5) {
        correlationIdPrefix = 'TP_';
      }
    } else {
      triggerPrice = buyPrice + DHAN_CONFIG.TP_OFFSET;
    }

    console.log('🎯 Order details:', {
      symbol: position.tradingSymbol,
      exchangeSegment: position.exchangeSegment,
      productType: position.productType,
      securityId: position.securityId,
      quantity: position.netQty,
      buyPrice: buyPrice,
      triggerPrice: triggerPrice,
      correlationId: `${correlationIdPrefix}${position.securityId}`
    });

    // Place SL-M SELL order
    const response = await dhanApi.placeStopLossMarketOrder({
      transactionType: 'SELL',
      exchangeSegment: position.exchangeSegment,
      productType: position.productType,
      securityId: position.securityId,
      quantity: position.netQty,
      triggerPrice: Number(triggerPrice.toFixed(1)),
      correlationId: `${correlationIdPrefix}${position.securityId}`,
    });

    return NextResponse.json({
      success: true,
      order_id: response.orderId,
      order_status: response.orderStatus,
      buy_price: buyPrice,
      trigger_price: triggerPrice,
      symbol: position.tradingSymbol,
      quantity: position.netQty,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to place SL-Market order:', message);
    
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
