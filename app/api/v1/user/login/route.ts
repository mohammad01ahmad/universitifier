import { adminAuth, adminDb } from "@/lib/Database/firebaseAdmin";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { validateCsrf } from "@/lib/security/csrfProtection";

export async function POST(request: NextRequest) {
    try {
        const { idToken } = await request.json();
        const cookieStore = await cookies();

        if (!(await validateCsrf(request))) {
            return NextResponse.json({ error: "UNAUTHORIZED REQUEST!" }, { status: 403 });
        }

        // Set session expiration (5 days)
        const expiresIn = 60 * 60 * 24 * 5 * 1000;

        // Create the session cookie using Firebase Admin
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

        // Set the cookie in the browser
        cookieStore.set("session", sessionCookie, {
            maxAge: expiresIn,
            httpOnly: true, // Prevents XSS attacks
            secure: process.env.NODE_ENV === "production", // Only over HTTPS in prod
            sameSite: "strict",
            path: "/",
        });

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Check if user exists in Firebase
        const userDocRef = adminDb.collection('users').doc(uid);
        const userDoc = await userDocRef.get();

        let isNewUser = false;

        if (!userDoc.exists) {
            isNewUser = true;
            await userDocRef.set({
                name: decodedToken?.name,
                email: decodedToken?.email,
                university: null,
                profileCompleted: false,
                createdAt: new Date(),
            });
        } else {
            const userData = userDoc.data();
            if (!userData?.university || !userData?.profileCompleted) {
                isNewUser = true;
            }
        }

        // Return the "redirect" hint to the client
        return NextResponse.json({
            status: "success",
            redirectTo: isNewUser ? '/complete-profile' : '/profile'
        }, { status: 200 });

    } catch {
        return Response.json({ error: "Login API Error" }, { status: 500 });
    }
}
