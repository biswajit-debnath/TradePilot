// API Route: Place SL-Limit Order (uses data from frontend)
import { NextRequest, NextResponse } from 'next/server';
import { dhanApi } from '@/lib/dhan-api';
import { calculateQuantityFromLotSize } from '@/lib/lot-size-helper';

export async function POST(request: NextRequest) {
  try {
    // Get parameters from request body
    const body = await request.json();
    console.log('📥 Received SL-Limit Order Request:', JSON.stringify(body, null, 2));
    
    const triggerPrice = body?.trigger_price;
    const limitPrice = body?.limit_price;
    const lotSize = body?.lot_size || 1;
    const positionData = body?.position_data;

    // Validate required data
    if (
      typeof triggerPrice !== 'number' || 
      typeof limitPrice !== 'number' || 
      !positionData || 
      !positionData.symbol || 
      !positionData.security_id
    ) {
      console.error('❌ Missing or invalid required data:', {
        triggerPrice,
        triggerPriceType: typeof triggerPrice,
        limitPrice,
        limitPriceType: typeof limitPrice,
        positionData,
        hasSymbol: !!positionData?.symbol,
        hasSecurityId: !!positionData?.security_id
      });
      return NextResponse.json(
        { success: false, error: 'Missing or invalid trigger_price, limit_price, or position_data' },
        { status: 400 }
      );
    }

    // Calculate actual quantity from lot size
    // For F&O: quantity = lotSize × lot_multiplier (e.g., 2 lots NIFTY = 130 qty)
    // For stocks: quantity = lotSize × 1 (e.g., 2 lots = 2 qty)
    const actualQuantity = calculateQuantityFromLotSize(positionData.symbol, lotSize);

    console.log('✅ Using frontend data:', {
      symbol: positionData.symbol,
      buyPrice: positionData.buy_price,
      triggerPrice: triggerPrice,
      limitPrice: limitPrice,
      lotSize: lotSize,
      actualQuantity: actualQuantity,
      orderType: triggerPrice > positionData.buy_price ? 'PP (Protect Profit)' : 'SL (Stop Loss)'
    });
    
    // Determine correlation ID based on whether it's above or below buy price
    const correlationIdPrefix = triggerPrice > positionData.buy_price ? 'PP_LIMIT_' : 'SL_LIMIT_';

    // Place SL-Limit SELL order with data from frontend
    const response = await dhanApi.placeStopLossLimitOrder({
      transactionType: 'SELL',
      exchangeSegment: positionData.exchange_segment,
      productType: positionData.product_type,
      securityId: positionData.security_id,
      quantity: actualQuantity,
      triggerPrice: triggerPrice,
      price: limitPrice,
      correlationId: `${correlationIdPrefix}${positionData.security_id}`,
    });

    console.log('✅ Order placed successfully:', response.orderId);

    return NextResponse.json({
      success: true,
      order_id: response.orderId,
      order_status: response.orderStatus,
      buy_price: positionData.buy_price,
      trigger_price: triggerPrice,
      limit_price: limitPrice,
      symbol: positionData.symbol,
      quantity: actualQuantity,
      lot_size: lotSize,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error placing SL-Limit order:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
