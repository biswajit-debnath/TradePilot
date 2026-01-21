// API Route: Get Trade Book (Completed Trades)
import { NextResponse } from 'next/server';
import { dhanApi } from '@/lib/dhan-api';

export async function GET() {
  try {
    const trades = await dhanApi.getTradeBook();
    
    return NextResponse.json({
      success: true,
      trades: trades,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
