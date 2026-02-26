import { NextRequest, NextResponse } from "next/server";
import { transferProduct } from "@/server/actions/product";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const body = await req.json();

        const { toLocation, count, sellPrice } = body;

        if (!toLocation || !count) {
            return NextResponse.json({ error: "Missing toLocation or count in request body" }, { status: 400 });
        }

        const result = await transferProduct(id, toLocation, count, sellPrice);
        return NextResponse.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        const status = message === "Unauthorized" ? 401 : message === "Product not found" ? 404 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
