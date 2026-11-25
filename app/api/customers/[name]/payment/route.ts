import { NextRequest, NextResponse } from "next/server";

import { collectFromCustomer } from "@/server/actions/bill";
import { errorResponse } from "@/server/errors";

type Params = { params: Promise<{ name: string }> };

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { name } = await params;
        return NextResponse.json(await collectFromCustomer(decodeURIComponent(name), await req.json()));
    } catch (error) {
        return errorResponse(error);
    }
}
