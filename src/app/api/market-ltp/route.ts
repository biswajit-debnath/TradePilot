import { NextRequest, NextResponse } from 'next/server';
import { dhanApi } from '@/lib/dhan-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instruments } = body;

    if (!instruments || !Array.isArray(instruments) || instruments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid instruments array' },
        { status: 400 }
      );
    }

    // Validate each instrument has required fields
    for (const instrument of instruments) {
      if (!instrument.exchangeSegment || !instrument.securityId) {
        return NextResponse.json(
          { success: false, error: 'Each instrument must have exchangeSegment and securityId' },
          { status: 400 }
        );
      }
    }

    const ltpResponse = await dhanApi.getLTP(instruments);

    // Extract LTP values for each instrument
    const ltpData: { [key: string]: number } = {};
    
    for (const instrument of instruments) {
      const segmentData = ltpResponse.data?.[instrument.exchangeSegment];
      if (segmentData && segmentData[instrument.securityId]) {
        ltpData[instrument.securityId] = segmentData[instrument.securityId].last_price;
      }
    }

    return NextResponse.json({
      success: true,
      ltp: ltpData,
      rawResponse: ltpResponse,
    });
  } catch (error) {
    console.error('Error fetching LTP:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error fetching LTP',
      },
      { status: 500 }
    );
  }
}
