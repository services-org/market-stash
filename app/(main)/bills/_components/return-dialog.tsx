"use client";
import { useState } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { returnableCounts } from "@/lib/bill";
import { formatNumber } from "@/lib/utils";
import { TBill } from "@/server/models/bill";
import { useCreate } from "@/hooks/api";
import { Dialog } from "@/ui/dialog";

/** Registers goods the customer gives back: stock goes up and what the customer owes goes down. */
export function ReturnDialog({ bill }: Readonly<{ bill: TBill }>) {
    const [open, setOpen] = useState(false);
    const [counts, setCounts] = useState<Record<number, string>>({});

    const available = returnableCounts(bill);

    const { mutate, isPending } = useCreate(`/api/bills/${bill._id}/return`, {
        invalidateKeys: ["bill", "bills", "customers", "products", "companies", "company-products", "analytics"],
        onSuccess: () => {
            setOpen(false);
            setCounts({});
        },
    });

    const chosen = bill.items
        .map((item, index) => ({ index, item, count: Math.floor(Number(counts[index]) || 0) }))
        .filter(({ count }) => count > 0);
    const invalid = chosen.length === 0 || chosen.some(({ index, count }) => count > available[index]);
    const refund = chosen.reduce((sum, { item, count }) => sum + item.price * count, 0);

    return (
        <Dialog
            trigger={
                <Button variant="outline" size="icon" aria-label="مرتجع" title="مرتجع">
                    <RotateCcw className="size-4" />
                </Button>
            }
            title="مرتجع من الفاتورة"
            open={open}
            onOpenChange={setOpen}
            className="max-h-[85vh] overflow-y-auto"
        >
            <form
                className="space-y-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!invalid) mutate({ items: chosen.map(({ index, count }) => ({ index, count })) });
                }}
            >
                <p className="text-xs text-muted-foreground">اكتب الكمية المرتجعة لكل صنف. الكميات ترجع للمخزن وتُخصم من الفاتورة.</p>

                <div className="space-y-2">
                    {bill.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">{item.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    المتاح للإرجاع {available[index]} × {formatNumber(item.price)} ج.م
                                </p>
                            </div>
                            <Input
                                aria-label={`الكمية المرتجعة من ${item.name}`}
                                inputMode="numeric"
                                placeholder="0"
                                disabled={available[index] === 0}
                                value={counts[index] ?? ""}
                                onChange={(e) => setCounts((prev) => ({ ...prev, [index]: e.target.value.replace(/\D/g, "") }))}
                                className="w-20 text-center"
                            />
                        </div>
                    ))}
                </div>

                {refund > 0 && (
                    <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3 text-sm font-semibold">
                        <span>قيمة المرتجع</span>
                        <span className="font-mono">{formatNumber(refund)} ج.م</span>
                    </div>
                )}

                <Button type="submit" className="w-full" disabled={invalid || isPending}>
                    {isPending ? "جاري الحفظ..." : "تسجيل المرتجع"}
                </Button>
            </form>
        </Dialog>
    );
}
