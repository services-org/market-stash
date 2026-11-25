import { NextRequest, NextResponse } from "next/server";

import { transferProduct } from "@/server/actions/product";
import { errorResponse } from "@/server/errors";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        return NextResponse.json(await transferProduct(id, await req.json()));
    } catch (error) {
        return errorResponse(error);
    }
}
