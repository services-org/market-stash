"use client";
import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCreate } from "@/hooks/api";
import { Dialog } from "@/ui/dialog";

import { PurchaseForm, type TPurchasePayload } from "./purchase-form";

export function CreatePurchaseDialog({ trigger }: Readonly<{ trigger?: ReactNode }>) {
    const [open, setOpen] = useState(false);

    const { mutate, isPending } = useCreate<unknown, TPurchasePayload>("/api/purchases", {
        invalidateKeys: ["purchases", "suppliers", "products", "companies", "company-products", "analytics"],
        onSuccess: () => setOpen(false),
    });

    return (
        <Dialog
            trigger={
                trigger ?? (
                    <Button size="icon" aria-label="فاتورة شراء جديدة" className="size-9 rounded-full shadow-md">
                        <Plus className="size-4" />
                    </Button>
                )
            }
            title="فاتورة شراء جديدة"
            open={open}
            onOpenChange={setOpen}
            className="max-h-[85vh] overflow-y-auto"
        >
            <PurchaseForm isPending={isPending} onSubmit={mutate} />
        </Dialog>
    );
}
