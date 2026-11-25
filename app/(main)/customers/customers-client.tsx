"use client";
import { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { PageHeader, EmptyState, SearchInput } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatNumber, matchesSearch, cn } from "@/lib/utils";
import type { TCustomer } from "@/server/actions/customer";
import { useGet } from "@/hooks/api";

export function CustomersClient({ initialDebt }: Readonly<{ initialDebt: boolean }>) {
    const [onlyDebt, setOnlyDebt] = useState(initialDebt);
    const [query, setQuery] = useState("");

    const { data: customers = [], isPending } = useGet<TCustomer[]>("/api/customers", { queryKey: ["customers"] });

    const filtered = useMemo(
        () =>
            customers
                .filter((c) => (!onlyDebt || c.balance > 0) && matchesSearch(query, c._id, c.phone, c.address))
                .sort((a, b) => (onlyDebt ? b.balance - a.balance : 0)),
        [customers, onlyDebt, query],
    );

    const totalDebt = customers.reduce((sum, c) => sum + c.balance, 0);

    return (
        <>
            <PageHeader title={onlyDebt ? "المديونيات" : "العملاء"} subtitle={isPending ? undefined : `${filtered.length} عميل`}>
                <div className="space-y-2 px-4 pb-3">
                    <SearchInput value={query} onChange={setQuery} placeholder="ابحث بالاسم أو الهاتف أو العنوان" />
                    <div className="flex gap-2">
                        {[
                            { label: "كل العملاء", value: false },
                            { label: "عليهم مديونية", value: true },
                        ].map((tab) => (
                            <button
                                key={tab.label}
                                type="button"
                                onClick={() => setOnlyDebt(tab.value)}
                                className={cn(
                                    "rounded-full border px-3 py-1.5 text-xs transition-colors",
                                    onlyDebt === tab.value ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground",
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </PageHeader>

            <div className="space-y-3 p-4">
                {!isPending && totalDebt > 0 && (
                    <div className="flex items-center justify-between rounded-2xl bg-destructive/10 px-4 py-3 text-destructive">
                        <span className="text-sm font-semibold">إجمالي المديونيات</span>
                        <span className="font-mono text-base font-bold">{formatNumber(totalDebt)} ج.م</span>
                    </div>
                )}

                {isPending ? (
                    Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
                ) : filtered.length === 0 ? (
                    <EmptyState message={customers.length === 0 ? "لا يوجد عملاء بعد. سيظهرون هنا بعد إنشاء أول فاتورة." : "لا توجد نتائج."} />
                ) : (
                    filtered.map((customer) => (
                        <Link
                            key={customer._id}
                            href={`/customers/${encodeURIComponent(customer._id)}`}
                            className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 transition-all active:scale-[0.99] hover:shadow-md"
                        >
                            <div className="min-w-0 flex-1 space-y-1">
                                <h3 className="truncate text-sm font-bold">{customer._id}</h3>
                                <p className="text-xs text-muted-foreground">
                                    {customer.billsCount} فاتورة • آخر فاتورة{" "}
                                    {new Date(customer.lastDate).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}
                                </p>
                                {customer.phone && <p className="font-mono text-xs text-muted-foreground">{customer.phone}</p>}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <Badge variant="secondary" className="font-mono text-xs">
                                    {formatNumber(customer.totalNet)} ج.م
                                </Badge>
                                {customer.balance > 0 && (
                                    <Badge variant="destructive" className="font-mono text-xs">
                                        عليه {formatNumber(customer.balance)}
                                    </Badge>
                                )}
                            </div>
                            <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
                        </Link>
                    ))
                )}
            </div>
        </>
    );
}
