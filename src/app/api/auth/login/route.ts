import { NextRequest, NextResponse } from 'next/server';
import { login, register } from '@/lib/auth';
import { LoginRequest } from '@/types/auth';

/**
 * POST /api/auth/login
 * Login with username and password
 */
export async function POST(request: NextRequest) {
  try {
    const { username, password, action } = await request.json() as LoginRequest & { action?: string };

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password required' },
        { status: 400 }
      );
    }

    // Register action
    if (action === 'register') {
      const result = await register(username, password);
      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: 'User registered successfully. Please login.',
        userId: result.userId,
      });
    }

    // Login action (default)
    const result = await login({ username, password });
    if (!result.success) {
      return NextResponse.json(result, { status: 401 });
    }

    // Set token in httpOnly cookie for security
    const response = NextResponse.json({
      success: true,
      token: result.token,
      user: result.user,
    });

    response.cookies.set('auth_token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('[AUTH-API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/logout
 * Clear auth cookie
 */
export async function GET() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  response.cookies.delete('auth_token');
  return response;
}
