"use client";
import { useState } from "react";
import { Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber } from "@/lib/utils";
import { useCreate } from "@/hooks/api";
import { Dialog } from "@/ui/dialog";

type PaymentDialogProps = {
    /** POST endpoint that records the payment. */
    endpoint: string;
    remaining: number;
    invalidateKeys: string[];
    label?: string;
};

/** Records a payment against a remaining balance (a customer bill, or a supplier purchase). */
export function PaymentDialog({ endpoint, remaining, invalidateKeys, label = "تسجيل دفعة" }: Readonly<PaymentDialogProps>) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");

    const { mutate, isPending } = useCreate(endpoint, {
        invalidateKeys,
        onSuccess: () => {
            setOpen(false);
            setAmount("");
        },
    });

    const value = Number(amount);
    const invalid = !amount || Number.isNaN(value) || value <= 0 || value > remaining;

    return (
        <Dialog
            trigger={
                <Button className="w-full gap-2">
                    <Wallet className="size-4" />
                    {label}
                </Button>
            }
            title="تسجيل دفعة"
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
                    <Label htmlFor="payment-amount">المبلغ (المتبقي {formatNumber(remaining)} ج.م)</Label>
                    <Input id="payment-amount" inputMode="decimal" autoFocus placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    <button type="button" className="text-xs text-primary" onClick={() => setAmount(String(remaining))}>
                        سداد كامل المتبقي
                    </button>
                </div>
                <Button type="submit" className="w-full" disabled={invalid || isPending}>
                    {isPending ? "جاري الحفظ..." : "حفظ الدفعة"}
                </Button>
            </form>
        </Dialog>
    );
}
