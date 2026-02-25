"use client";
import { ArrowRight, Printer } from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TBill } from "@/server/models/bill";
import { EditBillDialog } from "../_components";
import { formatNumber } from "@/lib/utils";
import { useGet } from "@/hooks/api";

export default function BillDetailPage() {
    const { id } = useParams<{ id: string }>();

    const { data: bill, isPending } = useGet<TBill>(`/api/bills/${id}`, {
        queryKey: ["bill", id],
    });

    if (isPending) {
        return (
            <div className="space-y-4 p-4">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        );
    }

    if (!bill) {
        return <div className="py-16 text-center text-sm text-muted-foreground">الفاتورة غير موجودة</div>;
    }

    const date = new Date(bill.createdAt).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <>
            <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur-sm">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="size-8" asChild>
                            <Link href="/bills">
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                        <h1 className="text-sm font-bold">تفاصيل الفاتورة</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {bill && <EditBillDialog bill={bill} />}
                        <Button variant="outline" size="sm" className="gap-1.5" asChild>
                            <Link href={`/bills/${id}/print`}>
                                <Printer className="size-3.5" />
                                طباعة
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-4 p-4">
                <div className="space-y-1">
                    <h2 className="text-base font-bold">{bill.customerName}</h2>
                    <p className="text-xs text-muted-foreground">{date}</p>
                </div>

                <Card className="border-border/60">
                    <CardContent className="p-0">
                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 border-b border-border/40 px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                            <span>المنتج</span>
                            <span>الكمية</span>
                            <span>السعر</span>
                            <span>المجموع</span>
                        </div>
                        {bill.items.map((item, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 border-b border-border/20 px-4 py-2.5 text-sm last:border-b-0"
                            >
                                <span className="truncate text-xs">{item.name}</span>
                                <span className="font-mono text-xs">{item.count}</span>
                                <span className="font-mono text-xs">{formatNumber(item.price)}</span>
                                <span className="font-mono text-xs font-semibold">{formatNumber(item.price * item.count)}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Separator />

                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">الإجمالي</span>
                    <Badge variant="secondary" className="font-mono text-sm font-bold">
                        {formatNumber(bill.total)} ج.م
                    </Badge>
                </div>
            </div>
        </>
    );
}
