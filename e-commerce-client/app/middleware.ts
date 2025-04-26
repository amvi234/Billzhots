import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken')?.value ||
                     request.headers.get('authorization')?.split(' ')[1];

  // Public paths that don't require authentication.
  const publicPaths = ['/login', '/register'];
  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname === path ||
    request.nextUrl.pathname.startsWith(`${path}/`)
  );

  // If no token and trying to access protected route.
  if (!accessToken && !isPublicPath) {
    // Store the original URL to redirect back after login.
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // If has token and trying to access login/register.
  if (accessToken && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Specify which routes this middleware should run for.
export const config = {
  matcher: [
    // Match all routes except for static files, api routes, etc.
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
