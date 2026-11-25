"use client";
import { useMemo, useState } from "react";

import { CreateBillDialog } from "./_components/create-bill-dialog";
import { PageHeader, EmptyState, SearchInput } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import { BillCard } from "./_components/bill-card";
import { TBill } from "@/server/models/bill";
import { billRemaining } from "@/lib/bill";
import { matchesSearch, cn } from "@/lib/utils";
import { useGet } from "@/hooks/api";

const PAGE_SIZE = 30;

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
    const [query, setQuery] = useState("");
    const [onlyUnpaid, setOnlyUnpaid] = useState(false);
    const [visible, setVisible] = useState(PAGE_SIZE);

    const { data: bills = [], isPending } = useGet<TBill[]>("/api/bills", {
        queryKey: ["bills"],
    });

    const filtered = useMemo(
        () =>
            bills.filter(
                (bill) =>
                    (!onlyUnpaid || billRemaining(bill) > 0) &&
                    matchesSearch(query, bill.customerName, bill.number, bill.phone, ...bill.items.map((item) => item.name)),
            ),
        [bills, query, onlyUnpaid],
    );

    const grouped = useMemo(() => {
        const map = new Map<string, TBill[]>();
        for (const bill of filtered.slice(0, visible)) {
            const d = new Date(bill.createdAt);
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            const list = map.get(key) ?? [];
            list.push(bill);
            map.set(key, list);
        }
        return Array.from(map.entries()).map(([key, items]) => ({
            key,
            label: getDateLabel(new Date(items[0].createdAt)),
            items,
        }));
    }, [filtered, visible]);

    return (
        <>
            <PageHeader title="الفواتير" subtitle={isPending ? undefined : `${filtered.length} فاتورة`} action={<CreateBillDialog />}>
                <div className="space-y-2 px-4 pb-3">
                    <SearchInput value={query} onChange={setQuery} placeholder="ابحث بالعميل أو الرقم أو المنتج" />
                    <button
                        type="button"
                        onClick={() => setOnlyUnpaid((v) => !v)}
                        className={cn(
                            "rounded-full border px-3 py-1.5 text-xs transition-colors",
                            onlyUnpaid ? "border-destructive bg-destructive/10 text-destructive" : "border-border/60 text-muted-foreground",
                        )}
                    >
                        غير مسددة فقط
                    </button>
                </div>
            </PageHeader>

            <div className="p-4">
                {isPending ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-xl" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState message={bills.length === 0 ? "لا توجد فواتير بعد. اضغط + لإنشاء فاتورة جديدة." : "لا توجد فواتير مطابقة للبحث."} />
                ) : (
                    <div className="space-y-5">
                        {grouped.map((group) => (
                            <div key={group.key}>
                                <h2 className="mb-2 text-lg font-bold text-orange-400">{group.label}</h2>
                                <div className="space-y-2">
                                    {group.items.map((bill) => (
                                        <BillCard key={bill._id} bill={bill} />
                                    ))}
                                </div>
                            </div>
                        ))}

                        {filtered.length > visible && (
                            <button
                                type="button"
                                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                                className="w-full rounded-xl border border-border/60 py-3 text-sm text-muted-foreground hover:bg-accent"
                            >
                                عرض المزيد ({filtered.length - visible})
                            </button>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
