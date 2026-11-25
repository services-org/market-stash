import { NextRequest, NextResponse } from "next/server";

import { updateProduct, deleteProduct } from "@/server/actions/product";
import { errorResponse } from "@/server/errors";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        return NextResponse.json(await updateProduct(id, await req.json()));
    } catch (error) {
        return errorResponse(error);
    }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await deleteProduct(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return errorResponse(error);
    }
}
