import { NextResponse } from "next/server";
import { getLocationCosts } from "@/server/actions/analytics";

export async function GET() {
    try {
        const costs = await getLocationCosts();
        return NextResponse.json(costs);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
    }
}
