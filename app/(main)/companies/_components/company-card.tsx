import Link from "next/link";
import { Building2, Package, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

type TCompany = Readonly<{
    _id: string;
    productCount: number;
    totalValue: number;
}>;

export function CompanyCard({ company }: Readonly<{ company: TCompany }>) {
    return (
        <Link href={`/companies/${encodeURIComponent(company._id)}`}>
            <Card className="gap-2 border-border/60 py-3 transition-all hover:shadow-md active:scale-[0.98]">
                <CardContent className="flex items-center gap-3 px-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Building2 className="size-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold">{company._id}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Package className="size-3" />
                            <span>{company.productCount} منتج</span>
                            <span className="text-border">•</span>
                            <span>{formatNumber(company.totalValue)} ج.م</span>
                        </div>
                    </div>
                    <ArrowLeft className="size-4 shrink-0 text-muted-foreground" />
                </CardContent>
            </Card>
        </Link>
    );
}
