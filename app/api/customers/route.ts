import { NextRequest, NextResponse } from "next/server";

import { getCustomers, createCustomer } from "@/server/actions/customer";
import { errorResponse } from "@/server/errors";

export async function GET() {
    try {
        return NextResponse.json(await getCustomers());
    } catch (error) {
        return errorResponse(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        return NextResponse.json(await createCustomer(await req.json()), { status: 201 });
    } catch (error) {
        return errorResponse(error);
    }
}
