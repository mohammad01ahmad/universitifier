import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from './lib/database/firebaseAdmin';
import { v4 as uuidv4 } from 'uuid'

export default async function proxy(request: NextRequest) {
    // 1. Initialize Request ID and Headers
    const requestId = uuidv4();
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-request-id', requestId);

    const session = request.cookies.get('session')?.value;
    const { pathname } = request.nextUrl;

    const protectedRoutes = ['/profile'];
    const authRoutes = ['/login'];

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isAuthRoute = authRoutes.includes(pathname);
    const isRoot = pathname === '/';

    // 1. If no session exists, handle protected routes early
    if (!session) {
        if (isProtectedRoute) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        // Pass requestHeaders to next() so API routes can see the ID
        const response = NextResponse.next({ request: { headers: requestHeaders } });
        response.headers.set('x-request-id', requestId);
        return response;
    }

    // 2. If a session exists, verify it ONCE
    try {
        await adminAuth.verifySessionCookie(session);

        // 3. Authenticated users should not see login/signup OR the landing page (if desired)
        if (isAuthRoute || isRoot) {
            return NextResponse.redirect(new URL('/profile', request.url));
        }
    } catch (error) {
        // Session invalid: create response, delete cookie, set ID header
        const response = NextResponse.next({ request: { headers: requestHeaders } });
        response.cookies.delete('session');
        response.headers.set('x-request-id', requestId);

        // If they were trying to access a protected route with an invalid session
        if (isProtectedRoute) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return response;
    }

    // 3. Final Default Response
    const finalResponse = NextResponse.next({
        request: { headers: requestHeaders },
    });
    finalResponse.headers.set('x-request-id', requestId);
    return finalResponse;
}

export const config = {
    matcher: ['/', '/profile/:path*', '/login'],
};
