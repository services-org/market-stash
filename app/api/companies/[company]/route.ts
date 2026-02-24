import { NextRequest, NextResponse } from "next/server";
import { getCompanyProducts } from "@/server/actions/product";

type Params = { params: Promise<{ company: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const { company } = await params;
        const decodedCompany = decodeURIComponent(company);
        const products = await getCompanyProducts(decodedCompany);
        return NextResponse.json(products);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
    }
}
