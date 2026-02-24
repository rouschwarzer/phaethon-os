import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const session = request.cookies.get('active_identity');

    // Bypass for internal Next.js requests and API
    if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    const isLoginPage = pathname.startsWith('/login');

    if (!session && !isLoginPage) {
        // Only redirect if it's a standard page request, not an RSC/Action request
        // which might handle unauthorized errors more gracefully/differently
        if (request.headers.get('accept')?.includes('text/html')) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    if (session && isLoginPage) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|.*\\.png$|.*\\.webp$|.*\\.svg$|.*\\.ico$|favicon.ico).*)',
    ],
};
