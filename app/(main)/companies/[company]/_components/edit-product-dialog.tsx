"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdate } from "@/hooks/api";
import { TProduct } from "@/server/models/product";

type TEditProductForm = {
    price: number;
    count: number;
};

export function EditProductDialog({ product }: Readonly<{ product: TProduct }>) {
    const [open, setOpen] = useState(false);

    const { register, handleSubmit } = useForm<TEditProductForm>({
        defaultValues: { price: product.price, count: product.count },
    });

    const { mutate, isPending } = useUpdate(`/api/products/${product._id}`, {
        invalidateKeys: ["products", "companies", "company-products"],
        onSuccess: () => setOpen(false),
    });

    function onSubmit(data: TEditProductForm) {
        mutate(data);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                    <Pencil className="size-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100vw-2rem)]">
                <DialogHeader>
                    <DialogTitle>تعديل {product.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-price">السعر (ج.م)</Label>
                        <Input id="edit-price" type="number" min="0" step="0.01" required {...register("price", { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-count">الكمية</Label>
                        <Input id="edit-count" type="number" min="0" required {...register("count", { valueAsNumber: true })} />
                    </div>
                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
