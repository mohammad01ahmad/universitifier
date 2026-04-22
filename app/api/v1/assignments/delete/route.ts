import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { adminAuth, adminDb } from "@/lib/database/firebaseAdmin";
import { validateCsrf } from "@/lib/security/csrfProtection";

export async function POST(request: NextRequest) {
    try {
        if (!(await validateCsrf(request))) {
            return NextResponse.json({ error: "UNAUTHORIZED REQUEST!" }, { status: 403 });
        }

        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("session")?.value;

        if (!sessionCookie) {
            return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
        }

        const decodedSession = await adminAuth.verifySessionCookie(sessionCookie, true);
        const body = await request.json() as { assignmentId?: string };
        const assignmentId = body.assignmentId?.trim();

        if (!assignmentId) {
            return NextResponse.json({ error: "assignmentId is required." }, { status: 400 });
        }

        const assignmentRef = adminDb.collection("assignments").doc(assignmentId);
        const assignmentSnapshot = await assignmentRef.get();

        if (!assignmentSnapshot.exists) {
            return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
        }

        const assignmentData = assignmentSnapshot.data();

        if (assignmentData?.userId !== decodedSession.uid) {
            return NextResponse.json({ error: "You do not have permission to delete this assignment." }, { status: 403 });
        }

        await assignmentRef.delete();

        return NextResponse.json({ status: "success", assignmentId });
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Unexpected assignment deletion failure.",
            },
            { status: 500 }
        );
    }
}
