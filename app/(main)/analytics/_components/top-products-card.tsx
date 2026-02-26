"use client";

import { useGet } from "@/hooks/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Trophy } from "lucide-react";

export type TTopProduct = {
    productId?: string;
    name: string;
    totalCountSold: number;
    totalRevenue: number;
};

export function TopProductsCard() {
    const { data: topProducts = [], isPending } = useGet<TTopProduct[]>("/api/analytics/top-products", {
        queryKey: ["analytics", "top-products"],
    });

    if (isPending) {
        return (
            <div className="rounded-2xl flex flex-col border bg-card p-0 shadow-sm">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 border-b p-4 last:border-0">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-1/4" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                    </div>
                ))}
            </div>
        );
    }

    if (topProducts.length === 0) {
        return (
            <div className="flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed text-muted-foreground bg-accent/30">
                <Package className="mb-2 size-8 text-muted-foreground/50" />
                <p className="text-sm">لا توجد مبيعات في آخر 30 يوم</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
            <div className="divide-y divide-border">
                {topProducts.map((product, index) => (
                    <div key={product.productId || product.name} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                        <div
                            className={`flex size-10 items-center justify-center rounded-full font-bold shadow-sm ${
                                index === 0
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                                    : index === 1
                                      ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                      : index === 2
                                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"
                                        : "bg-accent text-accent-foreground"
                            }`}
                        >
                            {index < 3 ? <Trophy className="size-5" /> : `#${index + 1}`}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="truncate font-semibold text-sm sm:text-base mb-2">{product.name}</h4>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                مبيعات الشهر: <span className="font-semibold text-foreground">{product.totalCountSold}</span> وحدة
                            </p>
                        </div>

                        <div className="text-left">
                            <div className="font-mono font-bold text-sm sm:text-base text-emerald-500">{product.totalRevenue.toFixed(2)} ج.م</div>
                            <div className="text-[10px] text-muted-foreground mt-1">حجم المبيعات</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
