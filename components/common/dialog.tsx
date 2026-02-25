"use client";

import { useState } from "react";
import { Dialog as ShadDialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type DialogProps = {
    trigger: React.ReactNode;
    title: string;
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    className?: string;
};

export function Dialog({ trigger, title, children, open: controlledOpen, onOpenChange, className }: DialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = onOpenChange ?? setInternalOpen;

    return (
        <ShadDialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className={`max-w-[calc(100vw-2rem)] ${className ?? ""}`}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                {children}
            </DialogContent>
        </ShadDialog>
    );
}
