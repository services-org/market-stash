"use client";
import { ArrowRight } from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { PaymentDialog } from "@/components/common";
import { Card } from "@/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TBill } from "@/server/models/bill";
import { billNet, billPaid, billRemaining, billReturned, returnableCounts } from "@/lib/bill";
import { EditBillDialog, ReturnDialog } from "../_components";
import { ShareInvoiceButton } from "../_components/share-invoice-button";
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

    const net = billNet(bill);
    const paid = billPaid(bill);
    const remaining = billRemaining(bill);
    const returned = billReturned(bill);
    const canReturn = returnableCounts(bill).some((n) => n > 0);

    return (
        <>
            <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur-sm">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" aria-label="رجوع" className="size-9" asChild>
                            <Link href="/bills">
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                        <h1 className="text-sm font-bold">
                            فاتورة {bill.number ? <span dir="ltr" className="inline-block font-mono text-primary">#{bill.number}</span> : "العميل"}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {canReturn && <ReturnDialog bill={bill} />}
                        <EditBillDialog bill={bill} />
                        <ShareInvoiceButton bill={bill} />
                    </div>
                </div>
            </div>

            <div className="space-y-4 p-4">
                <div className="space-y-1">
                    <h2 className="text-base font-bold">
                        <Link href={`/customers/${encodeURIComponent(bill.customerName)}`} className="hover:underline">
                            {bill.customerName}
                        </Link>
                    </h2>
                    {bill.phone && <p className="text-xs text-muted-foreground">الهاتف: {bill.phone}</p>}
                    {bill.address && <p className="text-xs text-muted-foreground">العنوان: {bill.address}</p>}
                    {bill.deliveryDate && <p className="text-xs text-muted-foreground">تاريخ التسليم: {bill.deliveryDate}</p>}
                    {bill.representative && <p className="text-xs text-muted-foreground">المندوب: {bill.representative}</p>}
                    <p className="text-xs text-muted-foreground">{date}</p>
                </div>

                <Card className="border-border/60" contentClassName="p-0">
                    <div className="grid grid-cols-[1fr_2.5rem_3.5rem_4.5rem] gap-x-3 border-b border-border/40 px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                        <span>المنتج</span>
                        <span>الكمية</span>
                        <span>السعر</span>
                        <span>المجموع</span>
                    </div>
                    {bill.items.map((item, i) => (
                        <div
                            key={i}
                            className="grid grid-cols-[1fr_2.5rem_3.5rem_4.5rem] items-center gap-x-3 border-b border-border/20 px-4 py-2.5 text-sm last:border-b-0"
                        >
                            <span className="text-xs leading-relaxed">{item.name}</span>
                            <span className="font-mono text-xs">{item.count}</span>
                            <span className="font-mono text-xs">{formatNumber(item.price)}</span>
                            <span className="font-mono text-xs font-semibold">{formatNumber(item.price * item.count)}</span>
                        </div>
                    ))}
                </Card>

                {bill.notes && <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">ملاحظات: {bill.notes}</p>}

                <Separator />

                <div className="space-y-2 text-sm">
                    {((bill.discount ?? 0) > 0 || returned > 0) && (
                        <>
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span>إجمالي الأصناف</span>
                                <span className="font-mono">{formatNumber(bill.total)} ج.م</span>
                            </div>
                            {(bill.discount ?? 0) > 0 && (
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>الخصم</span>
                                    <span className="font-mono">- {formatNumber(bill.discount ?? 0)} ج.م</span>
                                </div>
                            )}
                            {returned > 0 && (
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>المرتجع</span>
                                    <span className="font-mono">- {formatNumber(returned)} ج.م</span>
                                </div>
                            )}
                        </>
                    )}
                    <div className="flex items-center justify-between">
                        <span className="font-bold">الإجمالي</span>
                        <Badge variant="secondary" className="font-mono text-sm font-bold">
                            {formatNumber(net)} ج.م
                        </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">المدفوع</span>
                        <span className="font-mono text-emerald-500">{formatNumber(paid)} ج.م</span>
                    </div>
                    {remaining > 0 && (
                        <div className="flex items-center justify-between rounded-xl bg-destructive/10 px-3 py-2 font-bold text-destructive">
                            <span>المتبقي</span>
                            <span className="font-mono">{formatNumber(remaining)} ج.م</span>
                        </div>
                    )}
                </div>

                {remaining > 0 && <PaymentDialog endpoint={`/api/bills/${bill._id}/payment`} remaining={remaining} invalidateKeys={["bill", "bills", "customers"]} />}
            </div>
        </>
    );
}
