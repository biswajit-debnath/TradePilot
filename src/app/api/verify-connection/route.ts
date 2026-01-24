// API Route: Verify Connection
import { NextRequest, NextResponse } from 'next/server';
import { dhanApi } from '@/lib/dhan-api';
import { getUserFromAuthHeader } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    // Extract user from Authorization header
    const authHeader = request.headers.get('Authorization');
    const user = getUserFromAuthHeader(authHeader);
    dhanApi.setUserContext(user || undefined);
    
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
