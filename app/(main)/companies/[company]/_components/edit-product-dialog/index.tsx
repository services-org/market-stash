"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
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

    const {
        register,
        handleSubmit,
        control,
        setError,
        formState: { errors },
    } = useForm<TEditProductForm>({
        resolver: zodResolver(editProductSchema),
        defaultValues: { buyPrice: product.buyPrice, sellPrice: product.sellPrice, count: 0 },
    });

    const countChange = useWatch({ control, name: "count" }) || 0;
    const currentTotal = product.count + countChange;

    const { mutate, isPending } = useUpdate(`/api/products/${product._id}`, {
        invalidateKeys: ["products", "companies", "company-products"],
        onSuccess: () => {
            setOpen(false);
        },
    });

    function onSubmit(data: TEditProductForm) {
        const finalCount = product.count + data.count;
        if (finalCount < 0) {
            setError("count", { type: "manual", message: "لا يمكن أن تكون الكمية النهائية أقل من 0" });
            return;
        }

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
                    <Input id="edit-buyPrice" type="number" min="0" step="0.01" {...register("buyPrice", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit-sellPrice">سعر البيع (ج.م)</Label>
                    <Input id="edit-sellPrice" type="number" min="0" step="0.01" {...register("sellPrice", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit-count">إضافة / خصم كمية</Label>
                    <div className="flex gap-2">
                        <Input id="edit-count" type="number" placeholder="مثال: 5 أو -5" {...register("count", { valueAsNumber: true })} />
                    </div>
                    {errors.count && <p className="text-xs text-destructive">{errors.count.message}</p>}
                    <p className="text-xs text-muted-foreground">
                        الكمية الحالية: <span className="font-semibold text-foreground">{product.count}</span>
                        {" | "}
                        الكمية بعد التعديل:{" "}
                        <span className={`font-semibold ${currentTotal < 0 ? "text-destructive" : "text-foreground"}`}>{currentTotal}</span>
                    </p>
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
                </Button>
            </form>
        </Dialog>
    );
}
