"use client";

import { CreateBillDialog } from "./_components/create-bill-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { BillCard } from "./_components/bill-card";
import { TBill } from "@/server/models/bill";
import { useGet } from "@/hooks/api";

export default function BillsPage() {
    const { data: bills = [], isPending } = useGet<TBill[]>("/api/bills", {
        queryKey: ["bills"],
    });

    return (
        <>
            <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur-sm">
                <div className="flex items-center justify-between px-4 py-4">
                    <h1 className="text-lg font-bold">الفواتير</h1>
                    <CreateBillDialog />
                </div>
            </div>

            <div className="space-y-3 p-4">
                {isPending ? (
                    Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
                ) : bills.length === 0 ? (
                    <div className="py-16 text-center text-sm text-muted-foreground">لا توجد فواتير بعد. اضغط + لإنشاء فاتورة جديدة.</div>
                ) : (
                    bills.map((bill) => <BillCard key={bill._id} bill={bill} />)
                )}
            </div>
        </>
    );
}
