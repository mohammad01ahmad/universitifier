"use server";

import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import crypto from "crypto";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

/* Generates a cryptographically secure random token and sets it in a client-accessible cookie. */
export async function setCsrfToken() {
    const token = crypto.randomBytes(32).toString("hex");
    const cookieStore = await cookies();

    cookieStore.set(CSRF_COOKIE_NAME, token, {
        httpOnly: false, // Must be FALSE so client-side JS can read it to send in header
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax", // Allows token to persist during navigation
        path: "/",
    });

    return token;
}

/* Validates that the token in the request header matches the token in the cookie. */
export async function validateCsrf(request: NextRequest): Promise<boolean> {

    // 1. Get token from the custom header
    const headerToken = request.headers.get(CSRF_HEADER_NAME);

    // 2. Get token from the cookie
    const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

    // 3. Compare them (both must exist and be identical)
    if (!headerToken || !cookieToken || headerToken !== cookieToken) {
        return false;
    }

    return true;
}

/* Deletes the CSRF token (useful on logout). */
export async function clearToken() {
    const cookieStore = await cookies();
    cookieStore.delete(CSRF_COOKIE_NAME);
}
