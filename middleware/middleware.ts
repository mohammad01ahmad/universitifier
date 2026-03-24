import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const session = request.cookies.get('session')?.value;

    // 1. Define protected routes
    const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');
    const isProfile = request.nextUrl.pathname.startsWith('/profile');

    // 2. Redirect to login if accessing protected route without session
    if (!session && (isDashboard || isProfile)) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 3. Redirect to dashboard if logged-in user tries to access login/signup
    if (session && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

// Optimization: Only run middleware on specific paths
export const config = {
    matcher: ['/dashboard/:path*', '/profile/:path*', '/login', '/signup'],
};