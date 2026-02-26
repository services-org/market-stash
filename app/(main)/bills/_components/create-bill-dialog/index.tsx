"use client";
import { useForm, useFieldArray, useWatch, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { Plus } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { TProduct } from "@/server/models/product";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/ui/dialog";
import { Input } from "@/ui/input";

import { billSchema, TBillForm } from "./schema";
import { useCreate, useGet } from "@/hooks/api";
import { BillItemForm } from "./bill-item-form";

export function CreateBillDialog() {
    const [open, setOpen] = useState(false);

    const { data: products = [] } = useGet<TProduct[]>("/api/products", {
        queryKey: ["products"],
    });

    const form = useForm<TBillForm>({
        resolver: zodResolver(billSchema),
        defaultValues: {
            customerName: "",
            items: [{ isFromDB: true, productId: "", name: "", location: "", count: 1, price: 0 }],
        },
    });

    const { handleSubmit, reset, setValue, control } = form;

    const { fields, append, remove } = useFieldArray({ control, name: "items" });
    const items = useWatch({ control, name: "items" });

    const { mutate, isPending } = useCreate("/api/bills", {
        invalidateKeys: ["bills", "products"],
        onSuccess: () => {
            setOpen(false);
            reset();
        },
    });

    const onProductSelect = useCallback(
        (index: number, productId: string) => {
            const product = products.find((p) => p._id === productId);
            if (!product) return;
            setValue(`items.${index}.productId`, productId);
            setValue(`items.${index}.name`, `${product.company} - ${product.name}`);
            setValue(`items.${index}.price`, product.sellPrice);
            setValue(`items.${index}.location`, product.location);
        },
        [products, setValue],
    );

    function onSubmit(data: TBillForm) {
        const payload = {
            customerName: data.customerName,
            items: data.items.map((item) => ({
                ...(item.isFromDB && item.productId ? { productId: item.productId, location: item.location } : {}),
                name: item.name,
                count: item.count,
                price: item.price,
            })),
        };
        mutate(payload);
    }

    const getFilteredProducts = useCallback(
        (location: string) => {
            const filtered = location ? products.filter((p) => p.location === location) : products;
            return filtered.slice().sort((a, b) => (b.count > 0 ? 1 : 0) - (a.count > 0 ? 1 : 0));
        },
        [products],
    );

    const total = (items || []).reduce((sum, item) => sum + (item?.price || 0) * (item?.count || 0), 0);

    return (
        <Dialog
            trigger={
                <Button size="icon" className="size-9 rounded-full shadow-md">
                    <Plus className="size-4" />
                </Button>
            }
            title="فاتورة جديدة"
            open={open}
            onOpenChange={setOpen}
            className="max-h-[85vh] overflow-y-auto"
        >
            <FormProvider {...form}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input name="customerName" label="اسم العميل" placeholder="اسم العميل" />

                    <Separator />

                    <div className="space-y-3">
                        <Label>المنتجات</Label>

                        {fields.map((field, index) => (
                            <BillItemForm
                                key={field.id}
                                index={index}
                                item={items?.[index] || field}
                                canRemove={fields.length > 1}
                                setValue={setValue}
                                onRemove={() => remove(index)}
                                onProductSelect={onProductSelect}
                                getFilteredProducts={getFilteredProducts}
                            />
                        ))}

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            onClick={() => append({ isFromDB: true, productId: "", name: "", count: 1, price: 0, location: "" })}
                        >
                            <Plus className="size-3" /> إضافة منتج
                        </Button>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between text-sm font-semibold">
                        <span>الإجمالي</span>
                        <span className="font-mono">{total.toFixed(2)} ج.م</span>
                    </div>

                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? "جاري الإنشاء..." : "إنشاء الفاتورة"}
                    </Button>
                </form>
            </FormProvider>
        </Dialog>
    );
}
