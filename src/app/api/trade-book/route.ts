// API Route: Get Trade Book (Completed Trades)
import { NextResponse } from 'next/server';
import { dhanApi } from '@/lib/dhan-api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    
    let trades;
    
    if (fromDate && toDate) {
      // Fetch historical trades for date range
      trades = await dhanApi.getTradeHistory(fromDate, toDate, 0);
    } else {
      // Fetch today's trades only (from order book)
      trades = await dhanApi.getTradeBook();
    }
    
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
