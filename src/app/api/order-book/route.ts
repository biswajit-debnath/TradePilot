// API Route: Get Order Book
import { NextResponse } from 'next/server';
import { dhanApi } from '@/lib/dhan-api';

export async function GET() {
  try {
    const orders = await dhanApi.getOrderBook();
    
    return NextResponse.json({
      success: true,
      orders: orders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
