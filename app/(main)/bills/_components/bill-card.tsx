import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { DeleteBillDialog } from "./delete-bill-dialog";
import { Badge } from "@/components/ui/badge";
import { TBill } from "@/server/models/bill";
import { formatNumber } from "@/lib/utils";

export function BillCard({ bill }: Readonly<{ bill: TBill }>) {
    const date = new Date(bill.createdAt).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    return (
        <Card className="gap-2 border-border/60 py-3 transition-shadow hover:shadow-md">
            <CardContent className="px-4">
                <div className="flex items-start justify-between gap-2">
                    <Link href={`/bills/${bill._id}`} className="min-w-0 flex-1 space-y-1.5">
                        <h3 className="truncate text-sm font-semibold">{bill.customerName}</h3>
                        <p className="text-xs text-muted-foreground">{date}</p>
                        <p className="text-xs text-muted-foreground">{bill.items.length} منتج</p>
                    </Link>
                    <div className="flex flex-col items-end gap-1.5">
                        <Badge variant="secondary" className="font-mono text-xs font-semibold">
                            {formatNumber(bill.total)} ج.م
                        </Badge>
                        <DeleteBillDialog bill={bill} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
