import { NextResponse } from "next/server";

import { getRepresentatives } from "@/server/actions/bill";
import { errorResponse } from "@/server/errors";

export async function GET() {
    try {
        return NextResponse.json(await getRepresentatives());
    } catch (error) {
        return errorResponse(error);
    }
}
