"use client";
import { useMemo, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { BarChart, type BarDatum } from "@/components/common/bar-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, cn } from "@/lib/utils";
import { useGet } from "@/hooks/api";

import type { TProfitData } from "./profits-card/types";

type Metric = "profit" | "totalRevenue";
const METRICS: { key: Metric; label: string }[] = [
    { key: "profit", label: "الربح" },
    { key: "totalRevenue", label: "المبيعات" },
];

const monthName = (year: number, month: number, style: "short" | "long" = "short") =>
    new Intl.DateTimeFormat("ar-EG", { month: style }).format(new Date(year, month - 1));

const money = (value: number) => `${formatNumber(value, 0)} ج.م`;

/** Monthly bars (last 12 months) for profit / sales, plus this month vs last month. */
export function TrendsCard() {
    const [metric, setMetric] = useState<Metric>("profit");
    const { data: profits = [], isPending } = useGet<TProfitData[]>("/api/analytics/profits", { queryKey: ["analytics", "profits"] });

    const months = useMemo(() => {
        const map = new Map<string, TProfitData>();
        for (const p of profits) {
            const key = `${p.year}-${p.month}`;
            const prev = map.get(key);
            map.set(key, {
                year: p.year,
                month: p.month,
                day: 0,
                totalRevenue: (prev?.totalRevenue ?? 0) + p.totalRevenue,
                totalCost: (prev?.totalCost ?? 0) + p.totalCost,
                profit: (prev?.profit ?? 0) + p.profit,
            });
        }

        // Always show the last 12 calendar months, even the empty ones
        const now = new Date();
        return Array.from({ length: 12 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
            return map.get(`${d.getFullYear()}-${d.getMonth() + 1}`) ?? { year: d.getFullYear(), month: d.getMonth() + 1, day: 0, totalRevenue: 0, totalCost: 0, profit: 0 };
        });
    }, [profits]);

    if (isPending) return <Skeleton className="h-56 w-full rounded-2xl" />;
    if (profits.length === 0) return null;

    const data: BarDatum[] = months.map((m) => ({
        label: String(m.month),
        detail: monthName(m.year, m.month, "long") + ` ${m.year}`,
        value: m[metric],
    }));

    const current = months[11][metric];
    const previous = months[10][metric];
    const change = previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : null;
    const up = change !== null && change >= 0;

    return (
        <div className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
                <div className="flex rounded-xl bg-muted p-1" role="group" aria-label="المقياس">
                    {METRICS.map((m) => (
                        <button
                            key={m.key}
                            type="button"
                            onClick={() => setMetric(m.key)}
                            className={cn("rounded-lg px-3 py-1 text-xs transition-colors", metric === m.key ? "bg-background font-bold shadow-sm" : "text-muted-foreground")}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>

                {change !== null && (
                    <span className={cn("flex items-center gap-1 text-xs font-semibold", up ? "text-emerald-500" : "text-destructive")}>
                        {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                        {up ? "+" : ""}
                        {formatNumber(change, 0)}% عن الشهر الماضي
                    </span>
                )}
            </div>

            <BarChart data={data} title={`${METRICS.find((m) => m.key === metric)?.label} الشهري آخر 12 شهر`} format={money} labelEvery={1} />
        </div>
    );
}
