import { NextResponse } from "next/server";
import { getYearlyMonthlyProfits } from "@/server/actions/analytics";

export async function GET() {
    try {
        const profits = await getYearlyMonthlyProfits();
        return NextResponse.json(profits);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
    }
}
