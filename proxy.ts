import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from './lib/Database/firebaseAdmin';

export default function proxy(request: NextRequest) {
    const session = request.cookies.get('session')?.value;
    const { pathname } = request.nextUrl;

    // 1. Define protected routes (require authentication)
    const protectedRoutes = ['/profile'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    // 2. Define public routes (accessible without authentication)
    const publicRoutes = ['/login', '/signup', '/'];

    // 3. Redirect unauthenticated users trying to access protected routes
    if (!session && isProtectedRoute) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 4. Redirect authenticated users away from auth pages
    if (session && (pathname === '/login' || pathname === '/signup')) {
        return NextResponse.redirect(new URL('/profile', request.url));
    }

    // 5. Redirect authenticated users from homepage to dashboard
    if (session && pathname === '/') {
        return NextResponse.redirect(new URL('/profile', request.url));
    }

    // 6. Allow all other requests (public routes)
    return NextResponse.next();
}

// Optimization: Only run middleware on specific paths
export const config = {
    matcher: ['/', '/profile/:path*', '/login', '/signup'],
};