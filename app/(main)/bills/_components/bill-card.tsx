"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/common";
import { Card } from "@/ui/card";
import { Badge } from "@/components/ui/badge";
import { TBill } from "@/server/models/bill";
import { formatNumber } from "@/lib/utils";
import { useDelete } from "@/hooks/api";

export function BillCard({ bill }: Readonly<{ bill: TBill }>) {
    const date = new Date(bill.createdAt).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    const { mutate, isPending } = useDelete(`/api/bills/${bill._id}`, {
        invalidateKeys: ["bills", "products"],
    });

    return (
        <Card contentClassName="flex items-start justify-between gap-2">
            <Link href={`/bills/${bill._id}`} className="min-w-0 flex-1 space-y-1.5">
                <h3 className="truncate text-sm font-semibold">{bill.customerName}</h3>
                <p className="text-xs text-muted-foreground">{date}</p>
                <p className="text-xs text-muted-foreground">{bill.items.length} منتج</p>
            </Link>

            <div className="flex flex-col items-end gap-1.5">
                <Badge variant="secondary" className="font-mono text-xs font-semibold">
                    {formatNumber(bill.total)} ج.م
                </Badge>
                <ConfirmDialog
                    onConfirm={mutate}
                    isPending={isPending}
                    trigger={
                        <button className="inline-flex size-8 items-center justify-center rounded-md text-destructive hover:bg-accent hover:text-destructive">
                            <Trash2 className="size-3.5" />
                        </button>
                    }
                    title="حذف الفاتورة"
                    description={
                        <>
                            هل تريد حذف فاتورة <span className="font-semibold text-foreground">{bill.customerName}</span>؟ سيتم إرجاع الكميات
                            للمنتجات.
                        </>
                    }
                />
            </div>
        </Card>
    );
}
