// API Route: Modify SL Order
import { NextRequest, NextResponse } from 'next/server';
import { dhanApi } from '@/lib/dhan-api';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, trigger_price } = body;

    if (!order_id || trigger_price === undefined) {
      return NextResponse.json(
        { success: false, error: 'order_id and trigger_price are required' },
        { status: 400 }
      );
    }

    const response = await dhanApi.modifyOrder({
      orderId: order_id,
      orderType: 'STOP_LOSS_MARKET',
      triggerPrice: Number(trigger_price),
    });

    return NextResponse.json({
      success: true,
      order_id: response.orderId,
      order_status: response.orderStatus,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
