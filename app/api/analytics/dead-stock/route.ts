import { NextResponse } from "next/server";

import { getDeadStock } from "@/server/actions/analytics";
import { errorResponse } from "@/server/errors";

export async function GET() {
    try {
        return NextResponse.json(await getDeadStock());
    } catch (error) {
        return errorResponse(error);
    }
}
