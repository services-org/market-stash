"use client";
import { TrendingUp } from "lucide-react";
import { useMemo } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useGet } from "@/hooks/api";

import { ProfitSection } from "./profit-section";
import { TProfitData } from "./types";

export function ProfitsCard() {
    const { data: profits = [], isPending } = useGet<TProfitData[]>("/api/analytics/profits", {
        queryKey: ["analytics", "profits"],
    });

    const { yearlyProfits, monthlyProfits, dailyProfits } = useMemo(() => {
        const yearly = new Map<number, TProfitData>();
        const monthly = new Map<string, TProfitData>();
        const daily = new Map<string, TProfitData>();

        profits.forEach((item) => {
            // Aggregate yearly
            const yData = yearly.get(item.year) || {
                year: item.year,
                month: 0,
                day: 0,
                totalRevenue: 0,
                totalCost: 0,
                profit: 0,
            };
            yearly.set(item.year, {
                ...yData,
                totalRevenue: yData.totalRevenue + item.totalRevenue,
                totalCost: yData.totalCost + item.totalCost,
                profit: yData.profit + item.profit,
            });

            // Aggregate monthly
            const mKey = `${item.year}-${item.month}`;
            const mData = monthly.get(mKey) || {
                year: item.year,
                month: item.month,
                day: 0,
                totalRevenue: 0,
                totalCost: 0,
                profit: 0,
            };
            monthly.set(mKey, {
                ...mData,
                totalRevenue: mData.totalRevenue + item.totalRevenue,
                totalCost: mData.totalCost + item.totalCost,
                profit: mData.profit + item.profit,
            });

            // Store daily (it's already aggregated by day from backend)
            const dKey = `${item.year}-${item.month}-${item.day}`;
            daily.set(dKey, item);
        });

        return {
            yearlyProfits: Array.from(yearly.values()).sort((a, b) => b.year - a.year),
            monthlyProfits: Array.from(monthly.values()).sort((a, b) => {
                if (b.year !== a.year) return b.year - a.year;
                return b.month - a.month;
            }),
            dailyProfits: Array.from(daily.values()).sort((a, b) => {
                if (b.year !== a.year) return b.year - a.year;
                if (b.month !== a.month) return b.month - a.month;
                return b.day - a.day;
            }),
        };
    }, [profits]);

    if (isPending) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                ))}
            </div>
        );
    }

    if (profits.length === 0) {
        return (
            <div className="flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed text-muted-foreground bg-accent/30">
                <TrendingUp className="mb-2 size-8 text-muted-foreground/50" />
                <p className="text-sm">لا توجد بيانات للأرباح بعد</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <ProfitSection title="الأرباح اليومية" items={dailyProfits} type="daily" defaultVisibleCount={1} maxVisibleCount={30} />
            <ProfitSection title="الأرباح الشهرية" items={monthlyProfits} type="monthly" defaultVisibleCount={1} maxVisibleCount={12} />
            <ProfitSection title="الأرباح السنوية" items={yearlyProfits} type="yearly" defaultVisibleCount={1} maxVisibleCount={5} />
        </div>
    );
}

export * from "./profit-item";
export * from "./profit-section";
