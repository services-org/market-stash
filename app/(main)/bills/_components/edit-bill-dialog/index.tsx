"use client";
import { useForm, useFieldArray, useWatch, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { Plus, Pencil } from "lucide-react";

import { billSchema, TBillForm } from "../create-bill-dialog/schema";
import { BillItemForm } from "../create-bill-dialog/bill-item-form";
import { Separator } from "@/components/ui/separator";
import { TProduct } from "@/server/models/product";
import { Button } from "@/components/ui/button";

import { useUpdate, useGet } from "@/hooks/api";
import { Label } from "@/components/ui/label";
import { TBill } from "@/server/models/bill";
import { Dialog } from "@/ui/dialog";
import { Input } from "@/ui/input";

export function EditBillDialog({ bill }: Readonly<{ bill: TBill }>) {
    const [open, setOpen] = useState(false);

    const { data: products = [] } = useGet<TProduct[]>("/api/products", {
        queryKey: ["products"],
        enabled: open,
    });

    const defaultItems = bill.items.map((item) => ({
        isFromDB: !!item.productId,
        productId: item.productId || "",
        name: item.name,
        count: item.count,
        price: item.price,
        location: item.location || "",
    }));

    const form = useForm<TBillForm>({
        resolver: zodResolver(billSchema),
        defaultValues: {
            customerName: bill.customerName,
            items: defaultItems,
        },
    });

    const { handleSubmit, setValue, control } = form;

    const { fields, append, remove } = useFieldArray({ control, name: "items" });
    const items = useWatch({ control, name: "items" });

    const { mutate, isPending } = useUpdate(`/api/bills/${bill._id}`, {
        invalidateKeys: ["bills", "bill", "products"],
        onSuccess: () => setOpen(false),
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
            return [...filtered].sort((a, b) => (b.count > 0 ? 1 : 0) - (a.count > 0 ? 1 : 0));
        },
        [products],
    );

    const total = (items || []).reduce((sum, item) => sum + (item?.price || 0) * (item?.count || 0), 0);

    return (
        <Dialog
            trigger={
                <Button variant="outline" size="sm" className="gap-1.5">
                    <Pencil className="size-3.5" />
                    تعديل
                </Button>
            }
            title="تعديل الفاتورة"
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
                        {isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
                    </Button>
                </form>
            </FormProvider>
        </Dialog>
    );
}
