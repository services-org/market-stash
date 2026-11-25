import { NextRequest, NextResponse } from "next/server";

import { getPurchase, deletePurchase } from "@/server/actions/purchase";
import { errorResponse } from "@/server/errors";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        return NextResponse.json(await getPurchase(id));
    } catch (error) {
        return errorResponse(error);
    }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await deletePurchase(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return errorResponse(error);
    }
}
