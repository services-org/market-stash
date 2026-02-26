"use client";
import { useForm, useWatch, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useState } from "react";

import { editProductSchema, TEditProductForm } from "./schema";
import { TProduct } from "@/server/models/product";
import { Button } from "@/components/ui/button";
import { useUpdate } from "@/hooks/api";
import { Dialog } from "@/ui/dialog";
import { Input } from "@/ui/input";

export function EditProductDialog({ product }: Readonly<{ product: TProduct }>) {
    const [open, setOpen] = useState(false);

    const form = useForm<TEditProductForm>({
        resolver: zodResolver(editProductSchema),
        defaultValues: { buyPrice: product.buyPrice, sellPrice: product.sellPrice, count: 0 },
    });

    const { handleSubmit, control, setError } = form;

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
            <FormProvider {...form}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input name="buyPrice" type="number" label="سعر الشراء (ج.م)" inputProps={{ min: "0", step: "0.01" }} />
                    <Input name="sellPrice" type="number" label="سعر البيع (ج.م)" inputProps={{ min: "0", step: "0.01" }} />
                    <div className="space-y-2">
                        <Input name="count" type="number" label="إضافة / خصم كمية" placeholder="مثال: 5 أو -5" />
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
            </FormProvider>
        </Dialog>
    );
}
