"use client";
import { useForm, useWatch, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useState } from "react";

import { editProductSchema, TEditProductForm } from "./schema";
import { TProduct } from "@/server/models/product";
import { Button } from "@/components/ui/button";
import { BarcodeScanButton } from "@/components/common/barcode-scanner";
import { parseMinStock } from "@/lib/stock";
import { Label } from "@/components/ui/label";
import { useUpdate } from "@/hooks/api";
import { Dialog } from "@/ui/dialog";
import { Input } from "@/ui/input";

export function EditProductDialog({ product }: Readonly<{ product: TProduct }>) {
    const [open, setOpen] = useState(false);

    const defaults: TEditProductForm = {
        buyPrice: product.buyPrice,
        sellPrice: product.sellPrice,
        count: 0,
        minStock: product.minStock === undefined || product.minStock === null ? "" : String(product.minStock),
        barcode: product.barcode ?? "",
    };

    const form = useForm<TEditProductForm>({
        resolver: zodResolver(editProductSchema),
        defaultValues: defaults,
    });

    const { handleSubmit, control, setError, setValue } = form;

    const countChange = useWatch({ control, name: "count" }) || 0;
    const currentTotal = product.count + countChange;

    const { mutate, isPending } = useUpdate(`/api/products/${product._id}`, {
        invalidateKeys: ["products", "companies", "company-products", "analytics"],
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

        mutate({ ...data, barcode: data.barcode?.trim() || undefined, minStock: parseMinStock(data.minStock) ?? null });
    }

    return (
        <Dialog
            trigger={
                <Button variant="ghost" size="icon" aria-label="تعديل المنتج" className="size-9">
                    <Pencil className="size-3.5" />
                </Button>
            }
            title={`تعديل ${product.name}`}
            open={open}
            onOpenChange={(next) => {
                // Always start from the current product values: the quantity field is a delta and must never carry over
                if (next) form.reset(defaults);
                setOpen(next);
            }}
        >
            <FormProvider {...form}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input name="buyPrice" type="number" label="سعر الشراء (ج.م)" inputProps={{ min: "0", step: "any" }} />
                    <Input name="sellPrice" type="number" label="سعر البيع (ج.م)" inputProps={{ min: "0", step: "any" }} />
                    <div className="space-y-2">
                        <Input name="count" type="number" label="إضافة / خصم كمية" placeholder="مثال: 5 أو -5" />
                        <p className="text-xs text-muted-foreground">
                            الكمية الحالية: <span className="font-semibold text-foreground">{product.count}</span>
                            {" | "}
                            الكمية بعد التعديل:{" "}
                            <span className={`font-semibold ${currentTotal < 0 ? "text-destructive" : "text-foreground"}`}>{currentTotal}</span>
                        </p>
                    </div>
                    <Input name="minStock" label="تنبيه عند وصول الكمية إلى" placeholder="اتركه فارغاً لإيقاف التنبيه" inputProps={{ inputMode: "numeric" }} />
                    <div className="space-y-2">
                        <Label htmlFor="barcode">الباركود</Label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Input name="barcode" placeholder="الباركود" />
                            </div>
                            <BarcodeScanButton onScan={(code) => setValue("barcode", code)} className="size-9 shrink-0" />
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
                    </Button>
                </form>
            </FormProvider>
        </Dialog>
    );
}
