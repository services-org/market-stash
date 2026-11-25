import { NextResponse } from "next/server";

import { AUTH_COOKIE, AUTH_MAX_AGE, isValidPin, sessionToken } from "@/server/auth";

export async function POST(request: Request) {
    const body = await request.json().catch(() => ({}));

    if (!isValidPin(body?.pin)) {
        await new Promise((resolve) => setTimeout(resolve, 800)); // slows down guessing
        return NextResponse.json({ error: "الرمز غير صحيح" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(AUTH_COOKIE, await sessionToken(), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: AUTH_MAX_AGE,
    });
    return response;
}
