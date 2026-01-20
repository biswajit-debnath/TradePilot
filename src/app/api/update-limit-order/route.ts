// API Route: Update an existing Limit Order
// This route cancels the existing order and places a new one (workaround for modify API issues)
import { NextRequest, NextResponse } from 'next/server';
import { dhanApi } from '@/lib/dhan-api';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, limit_price, quantity, security_id, exchange_segment, transaction_type, product_type, buy_price } = body;

    console.log('Update Limit Order - Received body:', { order_id, limit_price, quantity, security_id, exchange_segment, transaction_type, product_type, buy_price });

    if (!order_id || limit_price === undefined || !quantity || !security_id || !exchange_segment || !transaction_type || !product_type) {
      return NextResponse.json(
        { success: false, error: 'order_id, limit_price, quantity, security_id, exchange_segment, transaction_type, and product_type are required' },
        { status: 400 }
      );
    }

    // Determine if this is TP or SL based on limit_price vs buy_price
    const isTP = buy_price ? limit_price > buy_price : false;
    const correlationIdPrefix = isTP ? 'TP_LIMIT_' : 'SL_LIMIT_';
    const correlationId = `${correlationIdPrefix}${security_id}`;
    
    console.log(`📊 Order type: ${isTP ? 'Take Profit' : 'Stop Loss'}`);
    console.log(`Step 1: Cancelling existing order ${order_id}`);
    
    // Step 1: Cancel the existing order
    const cancelResponse = await dhanApi.cancelOrder(order_id);
    console.log('Order cancelled:', cancelResponse);

    console.log(`Step 2: Placing new LIMIT order with price=${limit_price}, quantity=${quantity}, correlationId=${correlationId}`);
    
    // Step 2: Place a new order with updated parameters and correlation ID
    const newOrderResponse = await dhanApi.placeLimitOrder({
      securityId: security_id,
      exchangeSegment: exchange_segment,
      transactionType: transaction_type,
      quantity: quantity,
      price: limit_price,
      productType: product_type,
      correlationId: correlationId,
    });

    console.log('New order placed:', newOrderResponse);

    return NextResponse.json({
      success: true,
      order_id: newOrderResponse.orderId,
      order_status: newOrderResponse.orderStatus,
      limit_price: limit_price,
      message: 'Order updated (cancelled old and placed new)',
    });
  } catch (error) {
    console.error('Error in update-limit-order:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
