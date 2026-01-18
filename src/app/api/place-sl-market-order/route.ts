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

    const buyPrice = position.buyAvg;
    
    // Calculate trigger price based on priority: custom price > points offset > default offset
    let triggerPrice: number;
    if (customTriggerPrice !== undefined) {
      triggerPrice = customTriggerPrice;
    } else if (pointsOffset !== undefined) {
      triggerPrice = buyPrice + pointsOffset;
    } else {
      triggerPrice = buyPrice + DHAN_CONFIG.SL_OFFSET;
    }

    // Place SL-M SELL order
    const response = await dhanApi.placeStopLossMarketOrder({
      transactionType: 'SELL',
      exchangeSegment: position.exchangeSegment,
      productType: position.productType,
      securityId: position.securityId,
      quantity: position.netQty,
      triggerPrice: Number(triggerPrice.toFixed(1)),
      correlationId: `SL_${position.securityId}`,
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
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
