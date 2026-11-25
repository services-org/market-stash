"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, FormProvider } from "react-hook-form";
import { Plus, PenLine, List } from "lucide-react";
import { useState, type ReactNode } from "react";

import { addProductSchema, TAddProductForm } from "./schema";
import { useCreate, useGet } from "@/hooks/api";
import { LOCATIONS } from "@/lib/constants";
import { parseMinStock } from "@/lib/stock";
import { BarcodeScanButton } from "@/components/common/barcode-scanner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/ui/select";
import { Dialog } from "@/ui/dialog";
import { Input } from "@/ui/input";

type TCompany = { _id: string; productCount: number; totalValue: number };

export function AddProductDialog({ trigger }: Readonly<{ trigger?: ReactNode }>) {
    const [isNewCompany, setIsNewCompany] = useState(false);
    const [open, setOpen] = useState(false);

    const { data: companies = [] } = useGet<TCompany[]>("/api/companies", {
        queryKey: ["companies"],
    });

    const form = useForm<TAddProductForm>({
        resolver: zodResolver(addProductSchema),
        defaultValues: { name: "", company: "", buyPrice: 0, sellPrice: 0, count: 0, location: "", barcode: "", minStock: "" },
    });

    const { handleSubmit, reset, setValue, control } = form;

    const company = useWatch({ control, name: "company" });
    const location = useWatch({ control, name: "location" });

    const { mutate, isPending } = useCreate("/api/products", {
        invalidateKeys: ["products", "locations", "companies", "analytics"],
        onSuccess: () => {
            setOpen(false);
            setIsNewCompany(false);
            reset();
        },
    });

    function onSubmit(data: TAddProductForm) {
        mutate({ ...data, barcode: data.barcode?.trim() || undefined, minStock: parseMinStock(data.minStock) });
    }

    return (
        <Dialog
            onOpenChange={setOpen}
            title="إضافة منتج"
            open={open}
            trigger={
                trigger ?? (
                    <Button size="icon" aria-label="إضافة منتج" className="size-9 rounded-full shadow-md">
                        <Plus className="size-4" />
                    </Button>
                )
            }
        >
            <FormProvider {...form}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>الشركة</Label>
                            <Button
                                className="h-6 gap-1 px-2 text-xs text-muted-foreground"
                                variant="ghost"
                                type="button"
                                size="sm"
                                onClick={() => {
                                    setIsNewCompany(!isNewCompany);
                                    setValue("company", "");
                                }}
                            >
                                {isNewCompany ? (
                                    <>
                                        <List className="size-3" /> اختر من القائمة
                                    </>
                                ) : (
                                    <>
                                        <PenLine className="size-3" /> شركة جديدة
                                    </>
                                )}
                            </Button>
                        </div>
                        {isNewCompany ? (
                            <Input name="company" placeholder="اسم الشركة الجديدة" />
                        ) : (
                            <Select
                                name="company"
                                value={company}
                                onValueChange={(v) => setValue("company", v)}
                                placeholder="اختر الشركة"
                                items={companies.map((c) => ({ value: c._id, label: c._id }))}
                            />
                        )}
                    </div>
                    <Input name="name" label="اسم المنتج" placeholder="مثال: مقاس 1" />
                    <div className="grid grid-cols-2 gap-3">
                        <Input name="buyPrice" type="number" label="سعر الشراء (ج.م)" placeholder="0" inputProps={{ min: "0", step: "any" }} />
                        <Input name="sellPrice" type="number" label="سعر البيع (ج.م)" placeholder="0" inputProps={{ min: "0", step: "any" }} />
                    </div>
                    <Input name="count" type="number" label="الكمية" placeholder="0" inputProps={{ min: "0" }} />
                    <div className="grid grid-cols-2 gap-3">
                        <Input name="minStock" label="تنبيه عند وصول الكمية إلى" placeholder="اختياري" inputProps={{ inputMode: "numeric" }} />
                        <div className="space-y-2">
                            <Label htmlFor="barcode">الباركود (اختياري)</Label>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Input name="barcode" placeholder="الباركود" />
                                </div>
                                <BarcodeScanButton onScan={(code) => setValue("barcode", code)} className="mt-0 size-9 shrink-0" />
                            </div>
                        </div>
                    </div>
                    <Select
                        name="location"
                        label="الموقع"
                        value={location}
                        onValueChange={(v) => setValue("location", v)}
                        placeholder="اختر الموقع"
                        items={LOCATIONS.map((loc) => ({ value: loc, label: loc }))}
                    />
                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? "جاري الإضافة..." : "إضافة المنتج"}
                    </Button>
                </form>
            </FormProvider>
        </Dialog>
    );
}
