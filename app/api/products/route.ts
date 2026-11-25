import { NextRequest, NextResponse } from "next/server";

import { getProducts, getLocations, getLowStockProducts, createProduct } from "@/server/actions/product";
import { errorResponse } from "@/server/errors";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const location = searchParams.get("location") ?? undefined;
        const type = searchParams.get("type");

        if (type === "locations") return NextResponse.json(await getLocations());
        if (type === "low-stock") return NextResponse.json(await getLowStockProducts());

        return NextResponse.json(await getProducts(location));
    } catch (error) {
        return errorResponse(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const product = await createProduct(await req.json());
        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        return errorResponse(error);
    }
}
