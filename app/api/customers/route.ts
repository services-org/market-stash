import { NextResponse } from "next/server";

import { getCustomers } from "@/server/actions/customer";
import { errorResponse } from "@/server/errors";

export async function GET() {
    try {
        return NextResponse.json(await getCustomers());
    } catch (error) {
        return errorResponse(error);
    }
}
