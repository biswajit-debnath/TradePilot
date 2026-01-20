// API Route: Get Pending Orders from TradePilot (SL, TP, Exit orders)
import { NextResponse } from 'next/server';
import { dhanApi } from '@/lib/dhan-api';

export async function GET() {
  try {
    const orders = await dhanApi.getPendingSLOrders();
    
    const formattedOrders = orders.map((order) => ({
      order_id: order.orderId,
      symbol: order.tradingSymbol,
      quantity: order.quantity,
      trigger_price: order.triggerPrice,
      limit_price: order.price,
      order_type: order.orderType,
      transaction_type: order.transactionType,
      status: order.orderStatus,
      create_time: order.createTime,
      security_id: order.securityId,
    }));

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
