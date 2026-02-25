import { Building2, Package } from "lucide-react";
import Link from "next/link";

import { formatNumber } from "@/lib/utils";

type TCompany = Readonly<{
    _id: string;
    productCount: number;
    totalValue: number;
}>;

export function CompanyCard({ company }: { company: TCompany }) {
    return (
        <Link
            className="flex flex-col rounded-2xl border border-border/60 bg-card p-3 transition-all active:scale-[0.97] hover:shadow-md"
            href={`/companies/${encodeURIComponent(company._id)}`}
        >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="size-4 text-primary" />
            </div>
            <h3 className="mt-2 truncate text-[13px] font-bold">{company._id}</h3>

            <div className="mt-2.5 flex items-center justify-between border-t border-border/40 pt-2.5">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Package className="size-3" />
                    <span>{company.productCount} منتج</span>
                </div>
                <span className="rounded-lg bg-muted px-2 py-1 text-[11px] font-bold">${formatNumber(company.totalValue)}</span>
            </div>
        </Link>
    );
}
