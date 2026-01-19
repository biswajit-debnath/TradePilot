// API Route: Place SL-Limit Order (configurable for SL or TP)
import { NextRequest, NextResponse } from 'next/server';
import { dhanApi } from '@/lib/dhan-api';

export async function POST(request: NextRequest) {
  try {
    // Get optional parameters from request body
    let customOffset: number | undefined;
    let isTP = false;
    
    try {
      const body = await request.json();
      customOffset = body?.offset;
      isTP = body?.is_tp || false; // Flag to indicate if this is a Take Profit order
    } catch {
      // No body or invalid JSON, use default SL calculation
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
    
    let triggerPrice: number;
    let limitPrice: number;
    let correlationIdPrefix: string;
    
    if (isTP || (customOffset && customOffset > 0)) {
      // Take Profit logic: Buy + offset (e.g., buy at 100, TP at 112)
      const tpOffset = customOffset || Number(process.env.NEXT_PUBLIC_TP_OFFSET) || 12;
      triggerPrice = Number((buyPrice + tpOffset).toFixed(1));
      limitPrice = Number((triggerPrice - 0.5).toFixed(1)); // 0.5 below trigger for guaranteed execution
      correlationIdPrefix = 'TP_LIMIT_';
      
      console.log('🎯 Placing TP Limit Order:', {
        buyPrice,
        tpOffset,
        triggerPrice,
        limitPrice
      });
    } else {
      // Stop Loss logic: Buy - offset (e.g., buy at 100, SL at 80)
      const slOffset = customOffset ? Math.abs(customOffset) : (Number(process.env.NEXT_PUBLIC_SL_OFFSET_LOSS) || 20);
      triggerPrice = Number((buyPrice - slOffset).toFixed(1));
      limitPrice = Number((triggerPrice - 0.5).toFixed(1)); // 0.5 below trigger for better execution
      correlationIdPrefix = 'SL_LIMIT_';
      
      console.log('🛡️ Placing SL Limit Order:', {
        buyPrice,
        slOffset,
        triggerPrice,
        limitPrice
      });
    }

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
      correlationId: `${correlationIdPrefix}${position.securityId}`,
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
