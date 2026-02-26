"use client";

import { useState } from "react";
import { Dialog as ShadDialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type DialogProps = {
    onOpenChange?: (open: boolean) => void;
    trigger: string | React.ReactNode;
    children: React.ReactNode;
    className?: string;
    open?: boolean;
    title: string;
};

export function Dialog({ trigger, title, children, open: controlledOpen, className, onOpenChange }: DialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = onOpenChange ?? setInternalOpen;

    return (
        <ShadDialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild={trigger !== "string"}>{trigger}</DialogTrigger>
            <DialogContent className={`max-w-[calc(100vw-2rem)] ${className ?? ""}`} aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                {children}
            </DialogContent>
        </ShadDialog>
    );
}
