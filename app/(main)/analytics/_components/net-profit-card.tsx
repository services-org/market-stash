"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, cn } from "@/lib/utils";
import { useGet } from "@/hooks/api";

import type { TProfitData } from "./profits-card/types";

type MonthlyExpense = { year: number; month: number; total: number };

const monthName = (year: number, month: number) => new Date(year, month - 1).toLocaleDateString("ar-EG", { month: "long", year: "numeric" });

/** Profit minus expenses, for the last 6 months. */
export function NetProfitCard() {
    const { data: profits = [], isPending } = useGet<TProfitData[]>("/api/analytics/profits", { queryKey: ["analytics", "profits"] });
    const { data: expenses = [] } = useGet<MonthlyExpense[]>("/api/expenses/monthly", { queryKey: ["analytics", "expenses"] });

    if (isPending) return <Skeleton className="h-40 w-full rounded-2xl" />;

    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const profit = profits.filter((p) => p.year === year && p.month === month).reduce((sum, p) => sum + p.profit, 0);
        const spent = expenses.find((e) => e.year === year && e.month === month)?.total ?? 0;
        return { year, month, profit, spent, net: profit - spent };
    });

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-1 text-xs font-semibold text-muted-foreground">
                <span>الشهر</span>
                <span className="w-16 text-end">الربح</span>
                <span className="w-16 text-end">المصروفات</span>
                <span className="w-16 text-end">الصافي</span>
            </div>
            {months.map(({ year, month, profit, spent, net }) => (
                <div key={`${year}-${month}`} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 rounded-xl bg-muted/40 px-3 py-2.5 text-xs">
                    <span className="font-semibold">{monthName(year, month)}</span>
                    <span className="w-16 text-end font-mono">{formatNumber(profit)}</span>
                    <span className="w-16 text-end font-mono">{formatNumber(spent)}</span>
                    <span className={cn("w-16 text-end font-mono font-bold", net >= 0 ? "text-emerald-500" : "text-destructive")}>{formatNumber(net)}</span>
                </div>
            ))}
            <p className="px-1 pt-1 text-xs text-muted-foreground">الربح تقديري للأصناف التي لا يُعرف سعر شرائها (5% من سعر البيع).</p>
        </div>
    );
}
