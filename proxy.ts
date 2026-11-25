import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE, sessionToken } from "@/server/auth";

/** Everything needs the PIN session except the sign-in page and its API. */
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    if (pathname === "/sign-in" || pathname === "/api/auth") return NextResponse.next();

    if (request.cookies.get(AUTH_COOKIE)?.value === (await sessionToken())) return NextResponse.next();

    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const url = new URL("/sign-in", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
}

export const config = {
    // Skip Next internals, the service worker, the manifest, the offline page and static files
    matcher: ["/((?!_next/|images/|css/|sw\.js|manifest\.json|offline\.html|favicon\.ico).*)"],
};
