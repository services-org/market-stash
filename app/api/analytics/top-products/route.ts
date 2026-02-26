import { NextResponse } from "next/server";
import { getTopSoldProducts } from "@/server/actions/analytics";

export async function GET() {
    try {
        const topProducts = await getTopSoldProducts();
        return NextResponse.json(topProducts);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
    }
}
