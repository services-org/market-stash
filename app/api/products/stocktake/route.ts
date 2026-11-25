import { NextRequest, NextResponse } from "next/server";

import { applyStocktake } from "@/server/actions/report";
import { errorResponse } from "@/server/errors";

export async function POST(req: NextRequest) {
    try {
        return NextResponse.json(await applyStocktake(await req.json()));
    } catch (error) {
        return errorResponse(error);
    }
}
