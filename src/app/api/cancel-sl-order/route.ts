// API Route: Cancel SL Order
import { NextRequest, NextResponse } from 'next/server';
import { dhanApi } from '@/lib/dhan-api';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'order_id is required' },
        { status: 400 }
      );
    }

    await dhanApi.cancelOrder(orderId);

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
