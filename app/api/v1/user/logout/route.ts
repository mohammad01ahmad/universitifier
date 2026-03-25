import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { validateCsrf, clearToken } from "@/lib/security/csrfProtection";

export async function POST(request: NextRequest) {
    if (!(await validateCsrf(request))) {
        return NextResponse.json({ error: "UNAUTHORIZED REQUEST!" }, { status: 403 });
    }

    const cookieStore = await cookies();

    // Clear session and CSRF
    cookieStore.delete("session");

    // Ensure clearToken() is called correctly
    await clearToken();

    return NextResponse.json({ status: "success" });
}
