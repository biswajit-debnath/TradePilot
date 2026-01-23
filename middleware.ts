import { NextRequest, NextResponse } from 'next/server';
import { requestContext } from '@/lib/request-context';

/**
 * Middleware to skip auth checks for public routes and store request in context
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes - skip authentication
  const publicRoutes = ['/api/auth/login', '/api/auth/register', '/auth'];

  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Store request in AsyncLocalStorage for all API routes
  if (pathname.startsWith('/api/')) {
    return requestContext.run(request, () => NextResponse.next());
  }

  // For other routes, continue with normal flow
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
