// API Route: Place SL-Limit Order (Buy price - 20)
import { NextRequest, NextResponse } from 'next/server';
import { dhanApi } from '@/lib/dhan-api';

export async function POST(request: NextRequest) {
  try {
    // Get the last open position
    const position = await dhanApi.getLastOpenPosition();
    
    if (!position) {
      return NextResponse.json(
        { success: false, error: 'No open LONG position found' },
        { status: 400 }
      );
    }

    const buyPrice = position.buyAvg;
    
    // Calculate SL-Limit prices
    // Trigger at buy - SL_OFFSET (e.g., if bought at 100, trigger at 80)
    // Limit price slightly below trigger to ensure execution (e.g., 79)
    const slOffset = Number(process.env.NEXT_PUBLIC_SL_OFFSET_LOSS) || 20;
    const triggerPrice = Number(buyPrice.toFixed(1)) - slOffset;
    const limitPrice = triggerPrice - (Number(process.env.NEXT_PUBLIC_SL_OFFSET_LOSS_LIMIT) || 0.5); // 0.5 points below trigger for better execution

    if (triggerPrice <= 0 || limitPrice <= 0) {
      return NextResponse.json(
        { success: false, error: 'Calculated prices are invalid (negative or zero)' },
        { status: 400 }
      );
    }

    // Place SL-Limit SELL order
    const response = await dhanApi.placeStopLossLimitOrder({
      transactionType: 'SELL',
      exchangeSegment: position.exchangeSegment,
      productType: position.productType,
      securityId: position.securityId,
      quantity: position.netQty,
      triggerPrice: triggerPrice,
      price: limitPrice,
      correlationId: `SL_LIMIT_${position.securityId}`,
    });

    return NextResponse.json({
      success: true,
      order_id: response.orderId,
      order_status: response.orderStatus,
      buy_price: buyPrice,
      trigger_price: triggerPrice,
      limit_price: limitPrice,
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
