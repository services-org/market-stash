"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/common";
import { Card } from "@/ui/card";
import { Badge } from "@/components/ui/badge";
import { TBill } from "@/server/models/bill";
import { billNet, billRemaining } from "@/lib/bill";
import { formatNumber } from "@/lib/utils";
import { useDelete } from "@/hooks/api";

export function BillCard({ bill }: Readonly<{ bill: TBill }>) {
    const date = new Date(bill.createdAt).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    const remaining = billRemaining(bill);

    const { mutate, isPending } = useDelete(`/api/bills/${bill._id}`, {
        invalidateKeys: ["bills", "products", "customers", "companies", "company-products", "analytics"],
        undo: { url: `/api/bills/${bill._id}/restore`, message: "تم حذف الفاتورة" },
    });

    return (
        <Card contentClassName="flex items-start justify-between gap-2">
            <Link href={`/bills/${bill._id}`} className="min-w-0 flex-1 space-y-1.5">
                <h3 className="truncate text-sm font-semibold">
                    {bill.number ? <span dir="ltr" className="me-1.5 inline-block font-mono text-xs text-primary">#{bill.number}</span> : null}
                    {bill.customerName}
                </h3>
                <p className="text-xs text-muted-foreground">{date}</p>
                <p className="text-xs text-muted-foreground">{bill.items.length} منتج</p>
            </Link>

            <div className="flex flex-col items-end gap-1.5">
                <Badge variant="secondary" className="font-mono text-xs font-semibold">
                    {formatNumber(billNet(bill))} ج.م
                </Badge>
                {remaining > 0 && (
                    <Badge variant="destructive" className="font-mono text-xs">
                        متبقي {formatNumber(remaining)}
                    </Badge>
                )}
                <ConfirmDialog
                    onConfirm={mutate}
                    isPending={isPending}
                    trigger={
                        <button
                            aria-label="حذف الفاتورة"
                            className="inline-flex size-9 items-center justify-center rounded-md text-destructive hover:bg-accent hover:text-destructive"
                        >
                            <Trash2 className="size-4" />
                        </button>
                    }
                    title="حذف الفاتورة"
                    description={
                        <>
                            هل تريد حذف فاتورة <span className="font-semibold text-foreground">{bill.customerName}</span>؟ سيتم إرجاع الكميات
                            للمنتجات، ويمكنك التراجع بعد الحذف.
                        </>
                    }
                />
            </div>
        </Card>
    );
}
