"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useDelete } from "@/hooks/api";
import { TBill } from "@/server/models/bill";

export function DeleteBillDialog({ bill }: Readonly<{ bill: TBill }>) {
    const [open, setOpen] = useState(false);

    const { mutate, isPending } = useDelete(`/api/bills/${bill._id}`, {
        invalidateKeys: ["bills", "products"],
        onSuccess: () => setOpen(false),
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive">
                    <Trash2 className="size-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100vw-2rem)]">
                <DialogHeader>
                    <DialogTitle>حذف الفاتورة</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                    هل تريد حذف فاتورة <span className="font-semibold text-foreground">{bill.customerName}</span>؟ سيتم إرجاع الكميات للمنتجات.
                </p>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                        إلغاء
                    </Button>
                    <Button variant="destructive" className="flex-1" disabled={isPending} onClick={() => mutate()}>
                        {isPending ? "جاري الحذف..." : "حذف"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
