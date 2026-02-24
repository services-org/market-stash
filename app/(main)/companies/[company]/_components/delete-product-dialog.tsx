"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useDelete } from "@/hooks/api";
import { TProduct } from "@/server/models/product";

export function DeleteProductDialog({ product }: Readonly<{ product: TProduct }>) {
    const [open, setOpen] = useState(false);

    const { mutate, isPending } = useDelete(`/api/products/${product._id}`, {
        invalidateKeys: ["products", "companies", "company-products", "locations"],
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
                    <DialogTitle>حذف المنتج</DialogTitle>
                    <DialogDescription>
                        هل أنت متأكد من حذف <strong>{product.name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-row gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={isPending}>
                        إلغاء
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => mutate()} disabled={isPending}>
                        {isPending ? "جاري الحذف..." : "حذف"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
