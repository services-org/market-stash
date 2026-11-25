"use client";
import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/ui/dialog";
import { cn } from "@/lib/utils";
import { useCreate } from "@/hooks/api";

const CATEGORIES = ["إيجار", "مرتبات", "مواصلات", "كهرباء ومياه", "صيانة", "أخرى"];
export const EXPENSE_INVALIDATE_KEYS = ["expenses", "analytics"];

const todayInput = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function AddExpenseDialog({ trigger }: Readonly<{ trigger?: ReactNode }>) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState(todayInput);

    const { mutate, isPending } = useCreate("/api/expenses", {
        invalidateKeys: EXPENSE_INVALIDATE_KEYS,
        onSuccess: () => {
            setOpen(false);
            setTitle("");
            setAmount("");
            setCategory("");
            setDate(todayInput());
        },
    });

    const value = Number(amount);
    const valid = title.trim().length > 0 && value > 0;

    return (
        <Dialog
            trigger={
                trigger ?? (
                    <Button size="icon" aria-label="مصروف جديد" className="size-9 rounded-full shadow-md">
                        <Plus className="size-4" />
                    </Button>
                )
            }
            title="مصروف جديد"
            open={open}
            onOpenChange={setOpen}
        >
            <form
                className="space-y-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!valid) return;
                    // noon local time, so the day stays the same in every timezone
                    mutate({ title: title.trim(), amount: value, category: category || undefined, date: new Date(`${date}T12:00:00`).toISOString() });
                }}
            >
                <div className="space-y-2">
                    <Label>النوع</Label>
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => {
                                    setCategory(c);
                                    if (!title) setTitle(c);
                                }}
                                className={cn(
                                    "rounded-full border px-3 py-1.5 text-xs transition-colors",
                                    category === c ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground",
                                )}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="expense-title">الوصف</Label>
                    <Input id="expense-title" placeholder="مثال: إيجار المحل" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label htmlFor="expense-amount">المبلغ (ج.م)</Label>
                        <Input id="expense-amount" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="expense-date">التاريخ</Label>
                        <Input id="expense-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                </div>
                <Button type="submit" className="w-full" disabled={!valid || isPending}>
                    {isPending ? "جاري الحفظ..." : "حفظ المصروف"}
                </Button>
            </form>
        </Dialog>
    );
}
