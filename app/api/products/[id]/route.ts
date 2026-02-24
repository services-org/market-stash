import { NextRequest, NextResponse } from "next/server";
import { updateProduct, deleteProduct } from "@/server/actions/product";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const body = await req.json();
        const product = await updateProduct(id, body);
        return NextResponse.json(product);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        const status = message === "Unauthorized" ? 401 : message === "Product not found" ? 404 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await deleteProduct(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        const status = message === "Unauthorized" ? 401 : message === "Product not found" ? 404 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
