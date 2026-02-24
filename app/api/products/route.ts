import { NextRequest, NextResponse } from "next/server";
import { getProducts, getLocations, createProduct } from "@/server/actions/product";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const location = searchParams.get("location") ?? undefined;
        const type = searchParams.get("type");

        if (type === "locations") {
            const locations = await getLocations();
            return NextResponse.json(locations);
        }

        const products = await getProducts(location);
        return NextResponse.json(products);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const product = await createProduct(body);
        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
    }
}
