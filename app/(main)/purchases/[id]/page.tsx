"use client";
import { useParams } from "next/navigation";

import { PageHeader, PaymentDialog } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/ui/card";
import { TPurchase } from "@/server/models/purchase";
import { formatNumber } from "@/lib/utils";
import { useGet } from "@/hooks/api";

export default function PurchaseDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { data: purchase, isPending } = useGet<TPurchase>(`/api/purchases/${id}`, { queryKey: ["purchase", id] });

    if (isPending) {
        return (
            <div className="space-y-4 p-4">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        );
    }

    if (!purchase) return <div className="py-16 text-center text-sm text-muted-foreground">فاتورة الشراء غير موجودة</div>;

    const remaining = Math.max(0, purchase.total - purchase.paid);
    const date = new Date(purchase.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

    return (
        <>
            <PageHeader title={purchase.supplierName} subtitle={date} backHref="/purchases" />

            <div className="space-y-4 p-4 pb-24">
                {purchase.phone && <p className="text-xs text-muted-foreground">الهاتف: {purchase.phone}</p>}

                <Card className="border-border/60" contentClassName="p-0">
                    <div className="grid grid-cols-[1fr_2.5rem_3.5rem_4.5rem] gap-x-3 border-b border-border/40 px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                        <span>المنتج</span>
                        <span>الكمية</span>
                        <span>السعر</span>
                        <span>المجموع</span>
                    </div>
                    {purchase.items.map((item, i) => (
                        <div key={i} className="grid grid-cols-[1fr_2.5rem_3.5rem_4.5rem] items-center gap-x-3 border-b border-border/20 px-4 py-2.5 text-xs last:border-b-0">
                            <span className="leading-relaxed">{item.name}</span>
                            <span className="font-mono">{item.count}</span>
                            <span className="font-mono">{formatNumber(item.buyPrice)}</span>
                            <span className="font-mono font-semibold">{formatNumber(item.buyPrice * item.count)}</span>
                        </div>
                    ))}
                </Card>

                {purchase.notes && <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">ملاحظات: {purchase.notes}</p>}

                <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="font-bold">الإجمالي</span>
                        <Badge variant="secondary" className="font-mono text-sm font-bold">
                            {formatNumber(purchase.total)} ج.م
                        </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">المدفوع للمورد</span>
                        <span className="font-mono text-emerald-500">{formatNumber(purchase.paid)} ج.م</span>
                    </div>
                    {remaining > 0 && (
                        <div className="flex items-center justify-between rounded-xl bg-destructive/10 px-3 py-2 font-bold text-destructive">
                            <span>المتبقي للمورد</span>
                            <span className="font-mono">{formatNumber(remaining)} ج.م</span>
                        </div>
                    )}
                </div>

                {remaining > 0 && (
                    <PaymentDialog
                        endpoint={`/api/purchases/${purchase._id}/payment`}
                        remaining={remaining}
                        invalidateKeys={["purchase", "purchases"]}
                        label="تسجيل دفعة للمورد"
                    />
                )}
            </div>
        </>
    );
}
