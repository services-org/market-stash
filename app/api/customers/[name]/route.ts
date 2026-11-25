import { NextRequest, NextResponse } from "next/server";

import { getCustomerBills } from "@/server/actions/customer";
import { errorResponse } from "@/server/errors";

type Params = { params: Promise<{ name: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const { name } = await params;
        return NextResponse.json(await getCustomerBills(decodeURIComponent(name)));
    } catch (error) {
        return errorResponse(error);
    }
}
