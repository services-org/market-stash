"use client";

import { useCallback, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Database, PenLine, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useUpdate, useGet } from "@/hooks/api";
import { TProduct } from "@/server/models/product";
import { TBill } from "@/server/models/bill";

const LOCATIONS = ["المحل", "مخزن 1", "مخزن 2"];

const billItemSchema = z.object({
    isFromDB: z.boolean(),
    productId: z.string(),
    name: z.string().min(1, "اسم المنتج مطلوب"),
    count: z.number().int().min(1, "الكمية يجب أن تكون 1 على الأقل"),
    price: z.number().min(0, "السعر يجب أن يكون 0 أو أكثر"),
    location: z.string(),
});

const editBillSchema = z.object({
    customerName: z.string().min(1, "اسم العميل مطلوب"),
    items: z.array(billItemSchema).min(1, "يجب إضافة منتج واحد على الأقل"),
});

type TBillForm = z.infer<typeof editBillSchema>;

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

    const { register, handleSubmit, setValue, control } = useForm<TBillForm>({
        resolver: zodResolver(editBillSchema),
        defaultValues: {
            customerName: bill.customerName,
            items: defaultItems,
        },
    });

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

    const total = items.reduce((sum, item) => sum + (item.price || 0) * (item.count || 0), 0);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                    <Pencil className="size-3.5" />
                    تعديل
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] max-w-[calc(100vw-2rem)] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>تعديل الفاتورة</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-customerName">اسم العميل</Label>
                        <Input id="edit-customerName" placeholder="اسم العميل" {...register("customerName")} />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <Label>المنتجات</Label>

                        {fields.map((field, index) => {
                            const isFromDB = items[index]?.isFromDB;
                            const selectedLocation = items[index]?.location;

                            return (
                                <div key={field.id} className="space-y-2 rounded-lg border border-border/60 p-3">
                                    <div className="flex items-center justify-between">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 gap-1 px-2 text-xs text-muted-foreground"
                                            onClick={() => {
                                                setValue(`items.${index}.isFromDB`, !isFromDB);
                                                setValue(`items.${index}.productId`, "");
                                                setValue(`items.${index}.name`, "");
                                                setValue(`items.${index}.price`, 0);
                                                setValue(`items.${index}.location`, "");
                                            }}
                                        >
                                            {isFromDB ? (
                                                <>
                                                    <Database className="size-3" /> من المخازن
                                                </>
                                            ) : (
                                                <>
                                                    <PenLine className="size-3" /> منتج خارجي
                                                </>
                                            )}
                                        </Button>
                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-6 text-destructive"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="size-3" />
                                            </Button>
                                        )}
                                    </div>

                                    {isFromDB ? (
                                        <div className="flex justify-between items-center gap-3">
                                            <Select
                                                value={selectedLocation}
                                                onValueChange={(v) => {
                                                    setValue(`items.${index}.location`, v);
                                                    setValue(`items.${index}.productId`, "");
                                                    setValue(`items.${index}.name`, "");
                                                    setValue(`items.${index}.price`, 0);
                                                }}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="اختر الموقع" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {LOCATIONS.map((loc) => (
                                                        <SelectItem key={loc} value={loc}>
                                                            {loc}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Select
                                                value={items[index]?.productId}
                                                onValueChange={(v) => onProductSelect(index, v)}
                                                disabled={!selectedLocation}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="اختر المنتج" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {getFilteredProducts(selectedLocation).map((p) => (
                                                        <SelectItem key={p._id} value={p._id} disabled={p.count <= 0}>
                                                            {p.company} - {p.name} (متاح: {p.count})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : (
                                        <Input placeholder="اسم المنتج" {...register(`items.${index}.name`)} />
                                    )}

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs">الكمية</Label>
                                            <Input type="number" min="1" {...register(`items.${index}.count`, { valueAsNumber: true })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">السعر (ج.م)</Label>
                                            <Input type="number" min="0" step="0.01" {...register(`items.${index}.price`, { valueAsNumber: true })} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

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
            </DialogContent>
        </Dialog>
    );
}
