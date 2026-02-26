"use client";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightLeft } from "lucide-react";
import { useState } from "react";

import { transferProductSchema, TTransferProductForm } from "./schema";
import { TProduct } from "@/server/models/product";
import { Button } from "@/components/ui/button";
import { LOCATIONS } from "@/lib/constants";
import { useCreate } from "@/hooks/api";
import { Dialog } from "@/ui/dialog";
import { Select } from "@/ui/select";
import { Input } from "@/ui/input";

export function TransferProductDialog({ product }: Readonly<{ product: TProduct }>) {
    const [open, setOpen] = useState(false);

    const { mutate, isPending } = useCreate(`/api/products/${product._id}/transfer`, {
        invalidateKeys: ["products", "companies", "company-products", "locations"],
        onSuccess: () => setOpen(false),
    });

    const form = useForm<TTransferProductForm>({
        resolver: zodResolver(transferProductSchema),
        defaultValues: { count: 1, toLocation: "", sellPrice: product.sellPrice },
    });

    const onSubmit = (data: TTransferProductForm) => mutate(data);

    // Available locations excluding current one
    const availableLocations = LOCATIONS.filter((loc) => loc !== product.location).map((loc) => ({
        label: loc,
        value: loc,
    }));

    // Reset form when dialog opens
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) form.reset({ count: 1, toLocation: "", sellPrice: product.sellPrice });
        setOpen(isOpen);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={handleOpenChange}
            title="نقل المنتج"
            trigger={
                <button
                    type="button"
                    className="inline-flex size-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-primary/80 transition-colors"
                >
                    <ArrowRightLeft className="size-3.5" />
                </button>
            }
        >
            <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                        نقل كمية من <span className="font-semibold text-foreground">{product.name}</span> من{" "}
                        <span className="font-semibold text-foreground">{product.location}</span> إلى موقع آخر.
                    </p>
                    <Select name="toLocation" label="إلى موقع" placeholder="اختر الموقع" items={availableLocations} />

                    <Input
                        name="count"
                        type="number"
                        label={`الكمية المراد نقلها (المتاح: ${product.count})`}
                        placeholder="أدخل الكمية"
                        inputProps={{ min: 1, max: product.count, disabled: isPending }}
                    />

                    <Input
                        name="sellPrice"
                        type="number"
                        label="سعر البيع الجديد في الموقع (ج.م)"
                        placeholder="أدخل سعر البيع"
                        inputProps={{ min: 0, step: "0.01", disabled: isPending }}
                    />

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                            إلغاء
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "جاري النقل..." : "نقل المنتج"}
                        </Button>
                    </div>
                </form>
            </FormProvider>
        </Dialog>
    );
}
