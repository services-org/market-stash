"use client";
import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCreate } from "@/hooks/api";
import { Dialog } from "@/ui/dialog";

import { BillForm, EMPTY_ITEM } from "../bill-form";

export function CreateBillDialog({ trigger }: Readonly<{ trigger?: ReactNode }>) {
    const [open, setOpen] = useState(false);

    const { mutate, isPending } = useCreate("/api/bills", {
        invalidateKeys: ["bills", "products", "customers", "representatives", "companies", "company-products", "analytics"],
        onSuccess: () => setOpen(false),
    });

    return (
        <Dialog
            trigger={
                trigger ?? (
                    <Button size="icon" aria-label="فاتورة جديدة" className="size-9 rounded-full shadow-md">
                        <Plus className="size-4" />
                    </Button>
                )
            }
            title="فاتورة جديدة"
            open={open}
            onOpenChange={setOpen}
            className="max-h-[85vh] overflow-y-auto"
        >
            <BillForm
                defaultValues={{
                    customerName: "",
                    phone: "",
                    address: "",
                    deliveryDate: "",
                    representative: "",
                    notes: "",
                    discount: "",
                    paid: "",
                    items: [EMPTY_ITEM],
                }}
                submitLabel="إنشاء الفاتورة"
                pendingLabel="جاري الإنشاء..."
                isPending={isPending}
                onSubmit={mutate}
            />
        </Dialog>
    );
}
