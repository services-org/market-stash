"use client";

import { useState } from "react";
import { DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Dialog } from "./dialog";

type ConfirmDialogProps = {
    trigger: React.ReactNode;
    title: string;
    description: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    pendingText?: string;
    onConfirm: () => void;
    isPending?: boolean;
};

export function ConfirmDialog({
    trigger,
    title,
    description,
    confirmText = "حذف",
    cancelText = "إلغاء",
    pendingText = "جاري الحذف...",
    onConfirm,
    isPending,
}: ConfirmDialogProps) {
    const [open, setOpen] = useState(false);

    function handleConfirm() {
        onConfirm();
        if (!isPending) setOpen(false);
    }

    return (
        <Dialog trigger={trigger} title={title} open={open} onOpenChange={setOpen}>
            <DialogDescription asChild>
                <div>{description}</div>
            </DialogDescription>
            <DialogFooter className="flex-row gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={isPending}>
                    {cancelText}
                </Button>
                <Button variant="destructive" className="flex-1" onClick={handleConfirm} disabled={isPending}>
                    {isPending ? pendingText : confirmText}
                </Button>
            </DialogFooter>
        </Dialog>
    );
}
