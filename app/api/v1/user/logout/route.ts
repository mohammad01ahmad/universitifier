import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { validateCsrf, clearToken } from "@/lib/security/csrfProtection";
// import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
    const headerList = await headers();
    const requestId = headerList.get('x-request-id') || 'internal';

    // Create a child logger for this specific request
    // const reqLog = logger.child({ requestId });

    // reqLog.info('Starting user logout')

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
