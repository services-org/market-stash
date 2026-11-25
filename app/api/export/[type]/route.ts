import { NextRequest, NextResponse } from "next/server";

import { exportBillsCsv, exportProductsCsv } from "@/server/actions/export";
import { errorResponse } from "@/server/errors";

type Params = { params: Promise<{ type: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const { type } = await params;
        if (type !== "products" && type !== "bills") return NextResponse.json({ error: "Export not found" }, { status: 404 });

        const csv = type === "products" ? await exportProductsCsv() : await exportBillsCsv();
        const date = new Date().toISOString().slice(0, 10);

        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${type}-${date}.csv"`,
            },
        });
    } catch (error) {
        return errorResponse(error);
    }
}
