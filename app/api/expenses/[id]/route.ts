import { NextRequest, NextResponse } from "next/server";

import { deleteExpense } from "@/server/actions/expense";
import { errorResponse } from "@/server/errors";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await deleteExpense(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return errorResponse(error);
    }
}
