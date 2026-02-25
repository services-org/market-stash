"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil } from "lucide-react";
import { useState } from "react";

import { editProductSchema, TEditProductForm } from "./schema";
import { TProduct } from "@/server/models/product";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdate } from "@/hooks/api";

export function EditProductDialog({ product }: Readonly<{ product: TProduct }>) {
    const [open, setOpen] = useState(false);

    const { register, handleSubmit } = useForm<TEditProductForm>({
        resolver: zodResolver(editProductSchema),
        defaultValues: { buyPrice: product.buyPrice, sellPrice: product.sellPrice, count: product.count },
    });

    const { mutate, isPending } = useUpdate(`/api/products/${product._id}`, {
        invalidateKeys: ["products", "companies", "company-products"],
        onSuccess: () => setOpen(false),
    });

    function onSubmit(data: TEditProductForm) {
        mutate(data);
    }

    return (
        <Dialog
            trigger={
                <Button variant="ghost" size="icon" className="size-8">
                    <Pencil className="size-3.5" />
                </Button>
            }
            title={`تعديل ${product.name}`}
            open={open}
            onOpenChange={setOpen}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="edit-buyPrice">سعر الشراء (ج.م)</Label>
                    <Input id="edit-buyPrice" type="number" min="0" step="0.01" {...register("buyPrice")} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit-sellPrice">سعر البيع (ج.م)</Label>
                    <Input id="edit-sellPrice" type="number" min="0" step="0.01" {...register("sellPrice")} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit-count">الكمية</Label>
                    <Input id="edit-count" type="number" min="0" {...register("count")} />
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
                </Button>
            </form>
        </Dialog>
    );
}
