import { NextRequest } from 'next/server';
import { extractUserFromHeader } from '@/lib/auth';
import { AuthContext } from '@/types/auth';

/**
 * Extract user from Authorization header string only
 */
export function getUserFromAuthHeader(authHeader: string | null): AuthContext | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const { extractUserFromHeader } = require('@/lib/auth');
  return extractUserFromHeader(authHeader);
}

/**
 * Extract user from request (from Authorization header or cookie)
 */
export function getUserFromRequest(request: NextRequest): AuthContext | null {
  // Try Authorization header first
  const authHeader = request.headers.get('Authorization');
  console.log('[AUTH-MIDDLEWARE] Authorization header present:', !!authHeader);
  if (authHeader) {
    const user = extractUserFromHeader(authHeader);
    console.log('[AUTH-MIDDLEWARE] User from header:', user?.username || 'null');
    if (user) return user;
  }

  // Fall back to cookie (if set by login endpoint)
  const token = request.cookies.get('auth_token')?.value;
  console.log('[AUTH-MIDDLEWARE] Cookie token present:', !!token);
  if (token) {
    const { verifyToken } = require('@/lib/auth');
    const payload = verifyToken(token);
    console.log('[AUTH-MIDDLEWARE] User from cookie:', payload?.username || 'null');
    if (payload) {
      return {
        userId: payload.userId,
        username: payload.username,
      };
    }
  }

  console.log('[AUTH-MIDDLEWARE] No user found, returning null');
  return null;
}

/**
 * Middleware to ensure user is authenticated
 */
export function withAuth(handler: (req: NextRequest, context: AuthContext) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = getUserFromRequest(request);
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return handler(request, user);
  };
}
