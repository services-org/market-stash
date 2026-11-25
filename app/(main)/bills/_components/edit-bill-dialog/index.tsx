"use client";
import { useState } from "react";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { billPaid, billRemaining } from "@/lib/bill";
import { TBill } from "@/server/models/bill";
import { useUpdate } from "@/hooks/api";
import { Dialog } from "@/ui/dialog";

import { BillForm } from "../bill-form";

export function EditBillDialog({ bill }: Readonly<{ bill: TBill }>) {
    const [open, setOpen] = useState(false);

    const { mutate, isPending } = useUpdate(`/api/bills/${bill._id}`, {
        invalidateKeys: ["bills", "bill", "products", "customers", "representatives", "companies", "company-products", "analytics"],
        onSuccess: () => setOpen(false),
    });

    return (
        <Dialog
            trigger={
                <Button variant="outline" size="icon" aria-label="تعديل الفاتورة" title="تعديل">
                    <Pencil className="size-4" />
                </Button>
            }
            title="تعديل الفاتورة"
            open={open}
            onOpenChange={setOpen}
            className="max-h-[85vh] overflow-y-auto"
        >
            <BillForm
                defaultValues={{
                    customerName: bill.customerName,
                    phone: bill.phone || "",
                    address: bill.address || "",
                    deliveryDate: bill.deliveryDate || "",
                    representative: bill.representative || "",
                    notes: bill.notes || "",
                    discount: bill.discount ? String(bill.discount) : "",
                    // Fully paid bills keep the field empty so editing items keeps them fully paid
                    paid: billRemaining(bill) > 0 ? String(billPaid(bill)) : "",
                    items: bill.items.map((item) => ({
                        isFromDB: !!item.productId,
                        productId: item.productId || "",
                        name: item.name,
                        count: item.count,
                        price: item.price,
                        location: item.location || "",
                    })),
                }}
                submitLabel="حفظ التعديلات"
                pendingLabel="جاري الحفظ..."
                isPending={isPending}
                onSubmit={mutate}
            />
        </Dialog>
    );
}
