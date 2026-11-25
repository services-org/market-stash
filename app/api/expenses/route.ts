import { NextRequest, NextResponse } from "next/server";

import { getExpenses, createExpense } from "@/server/actions/expense";
import { errorResponse } from "@/server/errors";

export async function GET() {
    try {
        return NextResponse.json(await getExpenses());
    } catch (error) {
        return errorResponse(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        return NextResponse.json(await createExpense(await req.json()), { status: 201 });
    } catch (error) {
        return errorResponse(error);
    }
}
