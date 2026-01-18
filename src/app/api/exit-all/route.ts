// API Route: Exit All Positions and Cancel All Orders
import { NextResponse } from 'next/server';
import { dhanApi } from '@/lib/dhan-api';

export async function POST() {
  try {
    const result = await dhanApi.exitAll();

    if (result.errors.length > 0) {
      return NextResponse.json({
        success: true,
        positions_exited: result.positionsExited,
        orders_cancelled: result.ordersCancelled,
        errors: result.errors,
        message: `Exited ${result.positionsExited} positions, cancelled ${result.ordersCancelled} orders. ${result.errors.length} errors occurred.`,
      });
    }

    return NextResponse.json({
      success: true,
      positions_exited: result.positionsExited,
      orders_cancelled: result.ordersCancelled,
      message: `Successfully exited ${result.positionsExited} positions and cancelled ${result.ordersCancelled} orders.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
