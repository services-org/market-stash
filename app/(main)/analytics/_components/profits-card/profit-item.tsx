"use client";
import { TrendingDown, TrendingUp, Calendar, CalendarDays, Clock, LucideIcon } from "lucide-react";
import { useMemo } from "react";

import { TProfitData } from "./types";

interface ProfitItemProps {
    data: TProfitData;
    type: "yearly" | "monthly" | "daily";
}

export function ProfitItem({ data, type }: ProfitItemProps) {
    const { title, Icon, key } = useMemo(() => {
        let title = "";
        let Icon: LucideIcon = CalendarDays; // Default to monthly icon

        if (type === "yearly") {
            title = `سنة ${data.year}`;
            Icon = Calendar;
        } else if (type === "monthly") {
            const date = new Date(data.year, data.month - 1);
            title = new Intl.DateTimeFormat("ar-EG", { month: "long", year: "numeric" }).format(date);
        } else {
            // type === "daily"
            const date = new Date(data.year, data.month - 1, data.day);
            title = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric" }).format(date);
            Icon = Clock;
        }

        const key = type === "yearly" ? data.year : type === "monthly" ? `${data.year}-${data.month}` : `${data.year}-${data.month}-${data.day}`;

        return { title, Icon, key };
    }, [data, type]);

    const profitPercentage = useMemo(() => {
        return data.totalCost > 0 ? (data.profit / data.totalCost) * 100 : 0;
    }, [data.profit, data.totalCost]);

    return (
        <div key={key} className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold text-lg">
                    <Icon className="size-5 text-primary" />
                    {title}
                </h3>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingDown className="size-3 text-destructive" /> إجمالي التكلفة
                        </p>
                        <p className="text-lg font-mono font-semibold">{data.totalCost.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="size-3 text-emerald-500" /> إجمالي الإيرادات
                        </p>
                        <p className="text-lg font-mono font-semibold">{data.totalRevenue.toFixed(2)}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 pt-3 border-t">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">الربح</p>
                        <p
                            className={`text-xs font-bold rounded-full px-2 py-0.5 ${data.profit >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"}`}
                        >
                            {data.profit > 0 ? "+" : ""}
                            {profitPercentage.toFixed(1)}%
                        </p>
                    </div>
                    <p className={`text-xl font-mono font-bold ${data.profit >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                        {data.profit > 0 ? "+" : ""}
                        {data.profit.toFixed(2)} ج.م
                    </p>
                </div>
            </div>
        </div>
    );
}
