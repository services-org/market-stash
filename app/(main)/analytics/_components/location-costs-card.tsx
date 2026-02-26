"use client";
import { Building2, TrendingDown, TrendingUp } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useGet } from "@/hooks/api";

export type TLocationCost = {
    _id: string;
    totalBuyCost: number;
    totalSellCost: number;
    productCount: number;
};

export function LocationCostsCard() {
    const { data: locations = [], isPending } = useGet<TLocationCost[]>("/api/analytics/locations", {
        queryKey: ["analytics", "locations"],
    });

    if (isPending) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                ))}
            </div>
        );
    }

    if (locations.length === 0) {
        return (
            <div className="flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed text-muted-foreground bg-accent/30">
                <Building2 className="mb-2 size-8 text-muted-foreground/50" />
                <p className="text-sm">لا توجد بيانات للأماكن بعد</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {locations.map((loc) => {
                const profit = loc.totalSellCost - loc.totalBuyCost;
                const profitPercentage = loc.totalBuyCost > 0 ? (profit / loc.totalBuyCost) * 100 : 0;

                return (
                    <div key={loc._id} className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="flex items-center gap-2 font-bold text-lg">
                                <Building2 className="size-5 text-primary" />
                                {loc._id}
                            </h3>
                            <span className="flex h-7 items-center rounded-full bg-primary/10 px-3 text-xs font-semibold text-primary">
                                {loc.productCount} منتج
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <TrendingDown className="size-3 text-destructive" /> إجمالي الشراء
                                    </p>
                                    <p className="text-lg font-mono font-semibold">{loc.totalBuyCost.toFixed(2)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <TrendingUp className="size-3 text-emerald-500" /> إجمالي البيع
                                    </p>
                                    <p className="text-lg font-mono font-semibold">{loc.totalSellCost.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5 pt-3 border-t">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">الربح المتوقع</p>
                                    <p
                                        className={`text-xs font-bold rounded-full px-2 py-0.5 ${profit >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"}`}
                                    >
                                        {profit > 0 ? "+" : ""}
                                        {profitPercentage.toFixed(1)}%
                                    </p>
                                </div>
                                <p className={`text-xl font-mono font-bold ${profit >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                                    {profit > 0 ? "+" : ""}
                                    {profit.toFixed(2)} ج.م
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
