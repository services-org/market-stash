"use client";
import { use } from "react";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";

import { PageHeader, EmptyState } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TBill } from "@/server/models/bill";
import { billNet, billPaid, billRemaining } from "@/lib/bill";
import { whatsAppLink } from "@/lib/whatsapp";
import { CollectDialog } from "./collect-dialog";
import { formatNumber } from "@/lib/utils";
import { useGet } from "@/hooks/api";

type Params = { params: Promise<{ name: string }> };

export default function CustomerStatementPage({ params }: Readonly<Params>) {
    const { name } = use(params);
    const customerName = decodeURIComponent(name);

    const { data: bills = [], isPending } = useGet<TBill[]>(`/api/customers/${name}`, { queryKey: ["customers", "statement", name] });

    const totalNet = bills.reduce((sum, b) => sum + billNet(b), 0);
    const totalPaid = bills.reduce((sum, b) => sum + billPaid(b), 0);
    const balance = bills.reduce((sum, b) => sum + billRemaining(b), 0);

    const phone = bills.find((b) => b.phone)?.phone;
    const address = bills.find((b) => b.address)?.address;

    const statementText = [
        `كشف حساب - ${customerName}`,
        `إجمالي المشتريات: ${formatNumber(totalNet)} ج.م`,
        `المدفوع: ${formatNumber(totalPaid)} ج.م`,
        `المتبقي: ${formatNumber(balance)} ج.م`,
        "",
        ...bills.filter((b) => billRemaining(b) > 0).map((b) => `فاتورة ${b.number ? `#${b.number}` : ""} - متبقي ${formatNumber(billRemaining(b))} ج.م`),
    ].join("\n");

    return (
        <>
            <PageHeader title={customerName} subtitle={`${bills.length} فاتورة`} backHref="/customers" />

            <div className="space-y-4 p-4">
                {isPending ? (
                    <Skeleton className="h-40 w-full rounded-2xl" />
                ) : bills.length === 0 ? (
                    <EmptyState message="لا توجد فواتير لهذا العميل." />
                ) : (
                    <>
                        <div className="space-y-2 rounded-2xl border border-border/60 bg-card p-4">
                            {phone && (
                                <div className="flex items-center justify-between gap-2 text-sm">
                                    <span className="flex items-center gap-2 font-mono">
                                        <Phone className="size-4 text-muted-foreground" />
                                        {phone}
                                    </span>
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={`tel:${phone}`}>اتصال</a>
                                    </Button>
                                </div>
                            )}
                            {address && (
                                <p className="flex items-center gap-2 text-sm">
                                    <MapPin className="size-4 shrink-0 text-muted-foreground" />
                                    {address}
                                </p>
                            )}
                            <Button asChild variant="outline" className="mt-1 w-full gap-2 border-green-600/40 text-green-500">
                                <a href={whatsAppLink(phone, statementText)} target="_blank" rel="noreferrer">
                                    <MessageCircle className="size-4" />
                                    إرسال كشف الحساب على واتساب
                                </a>
                            </Button>
                        </div>

                        {balance > 0 && <CollectDialog customerName={customerName} balance={balance} />}

                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-xl bg-muted/50 p-3">
                                <p className="text-xs text-muted-foreground">المشتريات</p>
                                <p className="mt-1 font-mono text-sm font-bold">{formatNumber(totalNet)}</p>
                            </div>
                            <div className="rounded-xl bg-muted/50 p-3">
                                <p className="text-xs text-muted-foreground">المدفوع</p>
                                <p className="mt-1 font-mono text-sm font-bold text-emerald-500">{formatNumber(totalPaid)}</p>
                            </div>
                            <div className={`rounded-xl p-3 ${balance > 0 ? "bg-destructive/10" : "bg-muted/50"}`}>
                                <p className="text-xs text-muted-foreground">المتبقي</p>
                                <p className={`mt-1 font-mono text-sm font-bold ${balance > 0 ? "text-destructive" : ""}`}>{formatNumber(balance)}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {bills.map((bill) => {
                                const remaining = billRemaining(bill);
                                return (
                                    <Link
                                        key={bill._id}
                                        href={`/bills/${bill._id}`}
                                        className="flex items-center justify-between gap-2 rounded-2xl border border-border/60 bg-card p-3 hover:shadow-md"
                                    >
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold">
                                                {bill.number ? <span dir="ltr" className="me-1.5 inline-block font-mono text-xs text-primary">#{bill.number}</span> : null}
                                                {new Date(bill.createdAt).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{bill.items.length} منتج</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <Badge variant="secondary" className="font-mono text-xs">
                                                {formatNumber(billNet(bill))} ج.م
                                            </Badge>
                                            {remaining > 0 && (
                                                <Badge variant="destructive" className="font-mono text-xs">
                                                    متبقي {formatNumber(remaining)}
                                                </Badge>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
