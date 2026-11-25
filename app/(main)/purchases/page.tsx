"use client";
import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import Link from "next/link";

import { PageHeader, EmptyState, SearchInput, ConfirmDialog } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/ui/card";
import { TPurchase } from "@/server/models/purchase";
import { formatNumber, matchesSearch, cn } from "@/lib/utils";
import { useDelete, useGet } from "@/hooks/api";

import { CreatePurchaseDialog } from "./_components/create-purchase-dialog";

const remainingOf = (purchase: TPurchase) => Math.max(0, purchase.total - purchase.paid);

function PurchaseCard({ purchase }: Readonly<{ purchase: TPurchase }>) {
    const remaining = remainingOf(purchase);
    const date = new Date(purchase.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });

    const { mutate, isPending } = useDelete(`/api/purchases/${purchase._id}`, {
        invalidateKeys: ["purchases", "products", "companies", "company-products", "analytics"],
        undo: { url: `/api/purchases/${purchase._id}/restore`, message: "تم حذف فاتورة الشراء" },
    });

    return (
        <Card contentClassName="flex items-start justify-between gap-2">
            <Link href={`/purchases/${purchase._id}`} className="min-w-0 flex-1 space-y-1.5">
                <h3 className="truncate text-sm font-semibold">{purchase.supplierName}</h3>
                <p className="text-xs text-muted-foreground">{date}</p>
                <p className="text-xs text-muted-foreground">{purchase.items.length} منتج</p>
            </Link>

            <div className="flex flex-col items-end gap-1.5">
                <Badge variant="secondary" className="font-mono text-xs font-semibold">
                    {formatNumber(purchase.total)} ج.م
                </Badge>
                {remaining > 0 && (
                    <Badge variant="destructive" className="font-mono text-xs">
                        للمورد {formatNumber(remaining)}
                    </Badge>
                )}
                <ConfirmDialog
                    onConfirm={mutate}
                    isPending={isPending}
                    trigger={
                        <button aria-label="حذف فاتورة الشراء" className="inline-flex size-9 items-center justify-center rounded-md text-destructive hover:bg-accent">
                            <Trash2 className="size-4" />
                        </button>
                    }
                    title="حذف فاتورة الشراء"
                    description={
                        <>
                            هل تريد حذف فاتورة شراء <span className="font-semibold text-foreground">{purchase.supplierName}</span>؟ ستخرج الكميات من المخزن، ويمكنك
                            التراجع بعد الحذف.
                        </>
                    }
                />
            </div>
        </Card>
    );
}

export default function PurchasesPage() {
    const [query, setQuery] = useState("");
    const [onlyUnpaid, setOnlyUnpaid] = useState(false);

    const { data: purchases = [], isPending } = useGet<TPurchase[]>("/api/purchases", { queryKey: ["purchases"] });

    const filtered = useMemo(
        () => purchases.filter((p) => (!onlyUnpaid || remainingOf(p) > 0) && matchesSearch(query, p.supplierName, p.phone, ...p.items.map((i) => i.name))),
        [purchases, query, onlyUnpaid],
    );

    const owed = purchases.reduce((sum, p) => sum + remainingOf(p), 0);

    return (
        <>
            <PageHeader title="المشتريات" subtitle={isPending ? undefined : `${filtered.length} فاتورة شراء`} action={<CreatePurchaseDialog />}>
                <div className="space-y-2 px-4 pb-3">
                    <SearchInput value={query} onChange={setQuery} placeholder="ابحث بالمورد أو المنتج" />
                    <div className="flex items-center justify-between gap-2">
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
                        {owed > 0 && <span className="text-xs text-muted-foreground">المستحق للموردين: <span className="font-mono font-bold text-destructive">{formatNumber(owed)} ج.م</span></span>}
                    </div>
                </div>
            </PageHeader>

            <div className="space-y-3 p-4 pb-24">
                {isPending ? (
                    Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
                ) : filtered.length === 0 ? (
                    <EmptyState message={query || onlyUnpaid ? "لا توجد نتائج." : "لا توجد فواتير شراء بعد. اضغط + لإضافة أول فاتورة."} />
                ) : (
                    filtered.map((purchase) => <PurchaseCard key={purchase._id} purchase={purchase} />)
                )}
            </div>
        </>
    );
}
