import { NextRequest, NextResponse } from "next/server";

import { restoreProduct } from "@/server/actions/product";
import { errorResponse } from "@/server/errors";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        return NextResponse.json(await restoreProduct(id));
    } catch (error) {
        return errorResponse(error);
    }
}
