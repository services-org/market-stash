import { NextRequest, NextResponse } from "next/server";

import { getDailyReport } from "@/server/actions/report";
import { errorResponse } from "@/server/errors";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        return NextResponse.json(await getDailyReport(searchParams.get("from") ?? "", searchParams.get("to") ?? ""));
    } catch (error) {
        return errorResponse(error);
    }
}
