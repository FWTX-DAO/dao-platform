import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_PATHS = ['/onboarding'];
const PLATFORM_PATHS = [
  '/dashboard',
  '/forums',
  '/bounties',
  '/innovation-lab',
  '/meeting-notes',
  '/documents',
  '/members',
  '/directory',
  '/activity',
  '/subscriptions',
  '/profile',
  '/settings',
  '/admin',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = request.cookies.has('privy-token');

  // Allow API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/favicons/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Authenticated user hitting landing page → redirect to dashboard
  if (pathname === '/' && hasToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Unauthenticated user hitting platform routes → redirect to landing
  const isPlatformRoute = PLATFORM_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
  if (isPlatformRoute && !hasToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Unauthenticated user hitting auth routes → redirect to landing
  const isAuthRoute = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (isAuthRoute && !hasToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
