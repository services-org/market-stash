"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

import { PageHeader, EmptyState, ConfirmDialog } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/ui/card";
import { TExpense } from "@/server/models/expense";
import { formatNumber } from "@/lib/utils";
import { useDelete, useGet } from "@/hooks/api";
import { AddExpenseDialog } from "./add-expense-dialog";

const INVALIDATE = ["expenses", "expenses-monthly", "analytics"];

const monthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;
const monthLabel = (date: Date) => date.toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
function ExpenseRow({ expense }: Readonly<{ expense: TExpense }>) {
    const { mutate, isPending } = useDelete(`/api/expenses/${expense._id}`, {
        invalidateKeys: INVALIDATE,
        undo: { url: `/api/expenses/${expense._id}/restore`, message: "تم حذف المصروف" },
    });

    return (
        <Card contentClassName="flex items-center justify-between gap-2 py-3">
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{expense.title}</p>
                <p className="text-xs text-muted-foreground">
                    {new Date(expense.date).toLocaleDateString("ar-EG", { day: "numeric", month: "long" })}
                    {expense.category ? ` • ${expense.category}` : ""}
                </p>
            </div>
            <span className="font-mono text-sm font-bold">{formatNumber(expense.amount)} ج.م</span>
            <ConfirmDialog
                onConfirm={mutate}
                isPending={isPending}
                trigger={
                    <button aria-label="حذف المصروف" className="inline-flex size-9 items-center justify-center rounded-md text-destructive hover:bg-accent">
                        <Trash2 className="size-4" />
                    </button>
                }
                title="حذف المصروف"
                description={<>هل تريد حذف مصروف <span className="font-semibold text-foreground">{expense.title}</span>؟ يمكنك التراجع بعد الحذف.</>}
            />
        </Card>
    );
}

export default function ExpensesPage() {
    const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const { data: expenses = [], isPending } = useGet<TExpense[]>("/api/expenses", { queryKey: ["expenses"] });

    const inMonth = useMemo(() => expenses.filter((e) => monthKey(new Date(e.date)) === monthKey(month)), [expenses, month]);
    const total = inMonth.reduce((sum, e) => sum + e.amount, 0);
    const isCurrent = monthKey(month) === monthKey(new Date());

    const shift = (delta: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

    return (
        <>
            <PageHeader title="المصروفات" subtitle="إيجار ومرتبات ومصاريف أخرى" action={<AddExpenseDialog />}>
                <div className="flex items-center justify-between px-4 pb-3">
                    <button type="button" aria-label="الشهر السابق" onClick={() => shift(-1)} className="flex size-9 items-center justify-center rounded-full hover:bg-accent">
                        <ChevronRight className="size-4" />
                    </button>
                    <span className="text-sm font-bold">{monthLabel(month)}</span>
                    <button
                        type="button"
                        aria-label="الشهر التالي"
                        disabled={isCurrent}
                        onClick={() => shift(1)}
                        className="flex size-9 items-center justify-center rounded-full hover:bg-accent disabled:opacity-30"
                    >
                        <ChevronLeft className="size-4" />
                    </button>
                </div>
            </PageHeader>

            <div className="space-y-3 p-4 pb-24">
                <div className="flex items-center justify-between rounded-2xl bg-muted/50 p-4">
                    <span className="text-sm text-muted-foreground">إجمالي مصروفات الشهر</span>
                    <span className="font-mono text-lg font-bold">{formatNumber(total)} ج.م</span>
                </div>

                {isPending ? (
                    Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
                ) : inMonth.length === 0 ? (
                    <EmptyState message="لا توجد مصروفات في هذا الشهر." />
                ) : (
                    inMonth.map((expense) => <ExpenseRow key={expense._id} expense={expense} />)
                )}
            </div>
        </>
    );
}
