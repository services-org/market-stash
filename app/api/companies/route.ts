import { NextResponse } from "next/server";
import { getCompanies } from "@/server/actions/product";

export async function GET() {
    try {
        const companies = await getCompanies();
        return NextResponse.json(companies);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
    }
}
