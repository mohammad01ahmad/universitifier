import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const session = request.cookies.get('session')?.value;
    const { pathname } = request.nextUrl;

    // 1. Define protected routes
    const isProfile = pathname.startsWith('/profile');

    // 2. Redirect to login if accessing protected route without session
    if (!session && isProfile) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 3. Redirect to dashboard if logged-in user tries to access login/signup
    if (session && (pathname === '/login' || pathname === '/signup')) {
        return NextResponse.redirect(new URL('/profile', request.url));
    }

    // 4. Redirect to dashboard if logged-in user tries to access root page
    if (session && pathname === '/') {
        return NextResponse.redirect(new URL('/profile', request.url));
    }


    return NextResponse.next();
}

// Optimization: Only run middleware on specific paths
export const config = {
    matcher: ['/', '/dashboard/:path*', '/profile/:path*', '/login', '/signup'],
};