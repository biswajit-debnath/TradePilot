// API Route: Verify Connection
import { NextResponse } from 'next/server';
import { dhanApi } from '@/lib/dhan-api';

export async function GET() {
  try {
    const profile = await dhanApi.getProfile();
    
    return NextResponse.json({
      success: true,
      client_id: profile.dhanClientId,
      token_validity: profile.tokenValidity,
      active_segments: profile.activeSegment,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
