"use client";
import { useMemo } from "react";

import { CreateBillDialog } from "./_components/create-bill-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { BillCard } from "./_components/bill-card";
import { TBill } from "@/server/models/bill";
import { useGet } from "@/hooks/api";

function getDateLabel(date: Date) {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    if (isSameDay(date, today)) return "اليوم";
    if (isSameDay(date, yesterday)) return "أمس";

    return date.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
}

export default function BillsPage() {
    const { data: bills = [], isPending } = useGet<TBill[]>("/api/bills", {
        queryKey: ["bills"],
    });

    const grouped = useMemo(() => {
        const map = new Map<string, TBill[]>();
        for (const bill of bills) {
            const d = new Date(bill.createdAt);
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            const list = map.get(key) ?? [];
            list.push(bill);
            map.set(key, list);
        }
        return Array.from(map.entries()).map(([, items]) => ({
            label: getDateLabel(new Date(items[0].createdAt)),
            items,
        }));
    }, [bills]);

    return (
        <>
            <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur-sm">
                <div className="flex items-center justify-between px-4 py-4">
                    <h1 className="text-lg font-bold">الفواتير</h1>
                    <CreateBillDialog />
                </div>
            </div>

            <div className="p-4">
                {isPending ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-xl" />
                        ))}
                    </div>
                ) : bills.length === 0 ? (
                    <div className="py-16 text-center text-sm text-muted-foreground">لا توجد فواتير بعد. اضغط + لإنشاء فاتورة جديدة.</div>
                ) : (
                    <div className="space-y-5">
                        {grouped.map((group) => (
                            <div key={group.label}>
                                <h2 className="mb-2 text-lg font-bold text-orange-400">{group.label}</h2>
                                <div className="space-y-2">
                                    {group.items.map((bill) => (
                                        <BillCard key={bill._id} bill={bill} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
