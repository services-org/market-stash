import { NextRequest, NextResponse } from "next/server";

import { getSuppliers } from "@/server/actions/purchase";
import { errorResponse } from "@/server/errors";

export async function GET() {
    try {
        return NextResponse.json(await getSuppliers());
    } catch (error) {
        return errorResponse(error);
    }
}
