"use client";
import { useState } from "react";
import { Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber } from "@/lib/utils";
import { useCreate } from "@/hooks/api";
import { Dialog } from "@/ui/dialog";

type CollectResult = { applied: { number?: number; amount: number }[]; owedAfter: number };

/** The customer pays a lump sum: it settles his unpaid bills, oldest first. */
export function CollectDialog({ customerName, balance }: Readonly<{ customerName: string; balance: number }>) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");

    const { mutate, isPending } = useCreate<CollectResult, { amount: number }>(`/api/customers/${encodeURIComponent(customerName)}/payment`, {
        invalidateKeys: ["bill", "bills", "customers"],
        onSuccess: (result) => {
            toast.success(`تم تحصيل المبلغ على ${result.applied.length} فاتورة`);
            setOpen(false);
            setAmount("");
        },
    });

    const value = Number(amount);
    const invalid = !amount || Number.isNaN(value) || value <= 0 || value > balance;

    return (
        <Dialog
            trigger={
                <Button className="w-full gap-2">
                    <Wallet className="size-4" />
                    تحصيل مبلغ من العميل
                </Button>
            }
            title="تحصيل مبلغ"
            open={open}
            onOpenChange={setOpen}
        >
            <form
                className="space-y-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!invalid) mutate({ amount: value });
                }}
            >
                <div className="space-y-2">
                    <Label htmlFor="collect-amount">المبلغ (المديونية {formatNumber(balance)} ج.م)</Label>
                    <Input id="collect-amount" inputMode="decimal" autoFocus placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    <button type="button" className="text-xs text-primary" onClick={() => setAmount(String(balance))}>
                        سداد كل المديونية
                    </button>
                    <p className="text-xs text-muted-foreground">يتوزع المبلغ على الفواتير غير المسددة من الأقدم للأحدث.</p>
                </div>
                <Button type="submit" className="w-full" disabled={invalid || isPending}>
                    {isPending ? "جاري الحفظ..." : "حفظ التحصيل"}
                </Button>
            </form>
        </Dialog>
    );
}
