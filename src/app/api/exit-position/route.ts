// API Route: Exit specific position and cancel its orders
import { NextResponse } from 'next/server';
import { dhanApi } from '@/lib/dhan-api';

export async function POST(request: Request) {
  try {
    const { security_id } = await request.json();

    if (!security_id) {
      return NextResponse.json(
        { success: false, error: 'security_id is required' },
        { status: 400 }
      );
    }

    const result = await dhanApi.exitPosition(security_id);

    if (result.errors.length > 0) {
      return NextResponse.json({
        success: true,
        position_exited: result.positionExited,
        orders_cancelled: result.ordersCancelled,
        errors: result.errors,
        message: `${result.positionExited ? 'Exited position' : 'No position to exit'}, cancelled ${result.ordersCancelled} orders. ${result.errors.length} errors occurred.`,
      });
    }

    return NextResponse.json({
      success: true,
      position_exited: result.positionExited,
      orders_cancelled: result.ordersCancelled,
      message: `Successfully ${result.positionExited ? 'exited position and ' : ''}cancelled ${result.ordersCancelled} orders.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
