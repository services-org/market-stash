"use client";
import { useForm, useFieldArray, useWatch, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { Plus } from "lucide-react";

import { billSchema, TBillForm } from "./create-bill-dialog/schema";
import { BillItemForm } from "./create-bill-dialog/bill-item-form";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TProduct } from "@/server/models/product";
import { formatNumber } from "@/lib/utils";
import { useGet } from "@/hooks/api";
import { Input } from "@/ui/input";

type TCustomerOption = { _id: string; phone?: string; address?: string };

export type TBillPayload = {
    customerName: string;
    phone?: string;
    address?: string;
    deliveryDate?: string;
    representative?: string;
    notes?: string;
    discount?: number;
    paid?: number;
    items: { productId?: string; location?: string; name: string; count: number; price: number }[];
};

type BillFormProps = {
    defaultValues: TBillForm;
    submitLabel: string;
    pendingLabel: string;
    isPending: boolean;
    onSubmit: (payload: TBillPayload) => void;
};

const toNumber = (value?: string) => (value ? Number(value) : undefined);

export const EMPTY_ITEM = { isFromDB: true, productId: "", name: "", location: "", count: 1, price: 0 };

/** The invoice form shared by the "new bill" and "edit bill" dialogs. */
export function BillForm({ defaultValues, submitLabel, pendingLabel, isPending, onSubmit }: Readonly<BillFormProps>) {
    const { data: products = [] } = useGet<TProduct[]>("/api/products", { queryKey: ["products"] });
    const { data: customers = [] } = useGet<TCustomerOption[]>("/api/customers", { queryKey: ["customers"] });
    const { data: representatives = [] } = useGet<string[]>("/api/representatives", { queryKey: ["representatives"] });

    const form = useForm<TBillForm>({ resolver: zodResolver(billSchema), defaultValues });
    const { handleSubmit, setValue, getValues, control } = form;

    const { fields, append, remove } = useFieldArray({ control, name: "items" });
    const items = useWatch({ control, name: "items" });
    const customerName = useWatch({ control, name: "customerName" });
    const discount = useWatch({ control, name: "discount" });
    const paid = useWatch({ control, name: "paid" });

    // Fill the phone / address of a known customer automatically
    useEffect(() => {
        const customer = customers.find((c) => c._id === customerName?.trim());
        if (!customer) return;
        if (!getValues("phone") && customer.phone) setValue("phone", customer.phone);
        if (!getValues("address") && customer.address) setValue("address", customer.address);
    }, [customerName, customers, getValues, setValue]);

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

    const getFilteredProducts = useCallback(
        (location: string) => {
            const filtered = location ? products.filter((p) => p.location === location) : products;
            return filtered.slice().sort((a, b) => (b.count > 0 ? 1 : 0) - (a.count > 0 ? 1 : 0));
        },
        [products],
    );

    function submit(data: TBillForm) {
        onSubmit({
            customerName: data.customerName,
            phone: data.phone,
            address: data.address,
            deliveryDate: data.deliveryDate,
            representative: data.representative,
            notes: data.notes,
            discount: toNumber(data.discount),
            paid: toNumber(data.paid),
            items: data.items.map((item) => ({
                ...(item.isFromDB && item.productId ? { productId: item.productId, location: item.location } : {}),
                name: item.name,
                count: item.count,
                price: item.price,
            })),
        });
    }

    const total = (items || []).reduce((sum, item) => sum + (item?.price || 0) * (item?.count || 0), 0);
    const discountValue = Math.min(Number(discount) || 0, total);
    const net = total - discountValue;
    const paidValue = paid ? Math.min(Number(paid) || 0, net) : net;
    const remaining = net - paidValue;

    return (
        <FormProvider {...form}>
            <form onSubmit={handleSubmit(submit)} className="space-y-4">
                <Input name="customerName" label="اسم العميل" placeholder="اسم العميل" suggestions={customers.map((c) => c._id)} />
                <div className="grid grid-cols-2 gap-3">
                    <Input name="phone" type="tel" label="رقم الهاتف" inputProps={{ inputMode: "tel" }} />
                    <Input name="deliveryDate" type="date" label="تاريخ التسليم" />
                </div>
                <Input name="address" label="العنوان" />
                <Input name="representative" label="المندوب" suggestions={representatives} />

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

                    <Button type="button" variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => append(EMPTY_ITEM)}>
                        <Plus className="size-3" /> إضافة منتج
                    </Button>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3">
                    <Input name="discount" label="الخصم (ج.م)" placeholder="0" inputProps={{ inputMode: "decimal" }} />
                    <Input name="paid" label="المدفوع (ج.م)" placeholder="كامل المبلغ" inputProps={{ inputMode: "decimal" }} />
                </div>
                <Input name="notes" label="ملاحظات" placeholder="ملاحظات على الفاتورة (اختياري)" />

                <div className="space-y-1.5 rounded-xl bg-muted/50 p-3 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">إجمالي الأصناف</span>
                        <span className="font-mono">{formatNumber(total)} ج.م</span>
                    </div>
                    {discountValue > 0 && (
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">الخصم</span>
                            <span className="font-mono">- {formatNumber(discountValue)} ج.م</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between font-semibold">
                        <span>الصافي</span>
                        <span className="font-mono">{formatNumber(net)} ج.م</span>
                    </div>
                    {remaining > 0 && (
                        <div className="flex items-center justify-between font-semibold text-destructive">
                            <span>المتبقي</span>
                            <span className="font-mono">{formatNumber(remaining)} ج.م</span>
                        </div>
                    )}
                </div>

                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? pendingLabel : submitLabel}
                </Button>
            </form>
        </FormProvider>
    );
}
