"use client";
import { useState } from "react";
import { MessageCircle } from "lucide-react";

import { PageHeader } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TDailyReport } from "@/server/actions/report";
import type { TProfitData } from "../../analytics/_components/profits-card/types";
import { whatsAppLink } from "@/lib/whatsapp";
import { formatNumber, cn } from "@/lib/utils";
import { useGet } from "@/hooks/api";

const toInput = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function Stat({ label, value, tone }: Readonly<{ label: string; value: number; tone?: "good" | "bad" }>) {
    return (
        <div className="rounded-2xl border border-border/60 bg-card p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn("mt-1 font-mono text-base font-bold", tone === "good" && "text-emerald-500", tone === "bad" && "text-destructive")}>
                {formatNumber(value)} <span className="text-xs font-normal">ج.م</span>
            </p>
        </div>
    );
}

/** End-of-day summary: sales, money collected, new debts, returns, expenses and profit. */
export default function DailyReportPage() {
    const [date, setDate] = useState(() => toInput(new Date()));

    // The day, from local midnight to local midnight
    const from = new Date(`${date}T00:00:00`);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);

    const { data: report, isPending } = useGet<TDailyReport>(`/api/reports/daily?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`, {
        queryKey: ["analytics", "daily", date],
    });
    const { data: profits = [] } = useGet<TProfitData[]>("/api/analytics/profits", { queryKey: ["analytics", "profits"] });

    const profit =
        profits.find((p) => p.year === from.getFullYear() && p.month === from.getMonth() + 1 && p.day === from.getDate())?.profit ?? 0;
    const net = profit - (report?.expenses ?? 0);
    const label = from.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    const text = report
        ? [
              `تقفيل يوم ${label}`,
              `عدد الفواتير: ${report.billsCount}`,
              `المبيعات: ${formatNumber(report.sales)} ج.م`,
              `المحصّل: ${formatNumber(report.collected)} ج.م`,
              `ديون جديدة: ${formatNumber(report.newDebt)} ج.م`,
              report.returns > 0 ? `المرتجعات: ${formatNumber(report.returns)} ج.م` : "",
              `المصروفات: ${formatNumber(report.expenses)} ج.م`,
              report.purchases > 0 ? `المشتريات: ${formatNumber(report.purchases)} ج.م` : "",
              `الربح التقريبي: ${formatNumber(profit)} ج.م`,
              `الصافي بعد المصروفات: ${formatNumber(net)} ج.م`,
          ]
              .filter(Boolean)
              .join("\n")
        : "";

    return (
        <>
            <PageHeader title="تقفيل اليوم" subtitle={label} backHref="/">
                <div className="px-4 pb-3">
                    <Input type="date" aria-label="اليوم" value={date} max={toInput(new Date())} onChange={(e) => e.target.value && setDate(e.target.value)} />
                </div>
            </PageHeader>

            <div className="space-y-4 p-4 pb-24">
                {isPending || !report ? (
                    <Skeleton className="h-64 w-full rounded-2xl" />
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <Stat label={`المبيعات (${report.billsCount} فاتورة)`} value={report.sales} />
                            <Stat label="المحصّل" value={report.collected} tone="good" />
                            <Stat label="ديون جديدة" value={report.newDebt} tone={report.newDebt > 0 ? "bad" : undefined} />
                            <Stat label="المرتجعات" value={report.returns} />
                            <Stat label="المصروفات" value={report.expenses} />
                            <Stat label="المشتريات" value={report.purchases} />
                            <Stat label="الربح التقريبي" value={profit} tone="good" />
                            <Stat label="الصافي بعد المصروفات" value={net} tone={net >= 0 ? "good" : "bad"} />
                        </div>

                        {report.topItems.length > 0 && (
                            <div className="space-y-2 rounded-2xl border border-border/60 bg-card p-4">
                                <h2 className="text-sm font-bold">الأكثر مبيعاً اليوم</h2>
                                {report.topItems.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between gap-2 text-xs">
                                        <span className="min-w-0 flex-1 leading-relaxed">{item.name}</span>
                                        <span className="font-mono text-muted-foreground">× {item.count}</span>
                                        <span className="w-20 text-end font-mono font-semibold">{formatNumber(item.total)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Button asChild className="w-full gap-2 bg-[#25D366] text-white hover:bg-[#1ebe5b]">
                            <a href={whatsAppLink(undefined, text)} target="_blank" rel="noreferrer">
                                <MessageCircle className="size-4" />
                                إرسال الملخص على واتساب
                            </a>
                        </Button>
                    </>
                )}
            </div>
        </>
    );
}
