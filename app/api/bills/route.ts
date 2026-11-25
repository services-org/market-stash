import { NextRequest, NextResponse } from "next/server";

import { getBills, createBill } from "@/server/actions/bill";
import { errorResponse } from "@/server/errors";

export async function GET() {
    try {
        return NextResponse.json(await getBills());
    } catch (error) {
        return errorResponse(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const bill = await createBill(await req.json());
        return NextResponse.json(bill, { status: 201 });
    } catch (error) {
        return errorResponse(error);
    }
}
