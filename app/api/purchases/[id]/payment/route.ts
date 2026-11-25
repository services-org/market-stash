import { NextRequest, NextResponse } from "next/server";

import { addPurchasePayment } from "@/server/actions/purchase";
import { errorResponse } from "@/server/errors";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        return NextResponse.json(await addPurchasePayment(id, await req.json()));
    } catch (error) {
        return errorResponse(error);
    }
}
