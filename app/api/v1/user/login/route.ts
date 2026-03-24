import { adminAuth } from "@/lib/Database/firebaseAdmin";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { idToken } = await request.json();

        // Set session expiration (5 days)
        const expiresIn = 60 * 60 * 24 * 5 * 1000;

        // Create the session cookie using Firebase Admin
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

        // Set the cookie in the browser
        const cookieStore = await cookies();
        cookieStore.set("session", sessionCookie, {
            maxAge: expiresIn,
            httpOnly: true, // Prevents XSS attacks
            secure: process.env.NODE_ENV === "production", // Only over HTTPS in prod
            sameSite: "strict",
            path: "/",
        });

        return NextResponse.json({ status: "success" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Login API Error" }, { status: 500 });
    }
}