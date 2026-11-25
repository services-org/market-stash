import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { formatZodError } from "@/server/validation";

/** An error whose message is safe to show to the user, with the HTTP status to use. */
export class AppError extends Error {
    status: number;

    constructor(message: string, status = 400) {
        super(message);
        this.name = "AppError";
        this.status = status;
    }
}

/** Maps any thrown error to a JSON response with a sensible status code. */
export function errorResponse(error: unknown) {
    if (error instanceof ZodError) return NextResponse.json({ error: formatZodError(error) }, { status: 400 });
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.status });

    const message = error instanceof Error ? error.message : "Internal Server Error";
    if (message === "Unauthorized") return NextResponse.json({ error: message }, { status: 401 });
    if (message.endsWith("not found")) return NextResponse.json({ error: message }, { status: 404 });

    console.error(error);
    return NextResponse.json({ error: message }, { status: 500 });
}
