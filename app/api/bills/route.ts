import { NextRequest, NextResponse } from "next/server";
import { getBills, createBill } from "@/server/actions/bill";

export async function GET() {
    try {
        const bills = await getBills();
        return NextResponse.json(bills);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const bill = await createBill(body);
        return NextResponse.json(bill, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        const status = message === "Unauthorized" ? 401 : 400;
        return NextResponse.json({ error: message }, { status });
    }
}
