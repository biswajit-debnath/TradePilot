import { NextRequest, NextResponse } from 'next/server';
import { register } from '@/lib/auth';

/**
 * POST /api/auth/register
 * Public endpoint for user registration
 */
export async function POST(request: NextRequest) {
  try {
    const { username, password, confirmPassword } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    const result = await register(username, password);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'User registered successfully. Please login.',
      userId: result.userId,
    });
  } catch (error) {
    console.error('[AUTH-REGISTER] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}
