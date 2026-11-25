import { NextRequest, NextResponse } from "next/server";

import { getPurchases, createPurchase } from "@/server/actions/purchase";
import { errorResponse } from "@/server/errors";

export async function GET() {
    try {
        return NextResponse.json(await getPurchases());
    } catch (error) {
        return errorResponse(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        return NextResponse.json(await createPurchase(await req.json()), { status: 201 });
    } catch (error) {
        return errorResponse(error);
    }
}
