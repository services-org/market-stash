import { NextRequest, NextResponse } from "next/server";

import { getMonthlyExpenses } from "@/server/actions/expense";
import { errorResponse } from "@/server/errors";

export async function GET() {
    try {
        return NextResponse.json(await getMonthlyExpenses());
    } catch (error) {
        return errorResponse(error);
    }
}
