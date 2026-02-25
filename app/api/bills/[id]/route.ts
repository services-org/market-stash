import { NextRequest, NextResponse } from "next/server";
import { getBill, updateBill, deleteBill } from "@/server/actions/bill";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const bill = await getBill(id);
        return NextResponse.json(bill);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        const status = message === "Unauthorized" ? 401 : message === "Bill not found" ? 404 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const body = await req.json();
        const bill = await updateBill(id, body);
        return NextResponse.json(bill);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        const status = message === "Unauthorized" ? 401 : message === "Bill not found" ? 404 : 400;
        return NextResponse.json({ error: message }, { status });
    }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        await deleteBill(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        const status = message === "Unauthorized" ? 401 : message === "Bill not found" ? 404 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
